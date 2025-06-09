class WorkZone extends HTMLElement {
    constructor() {
        super();
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        this.isDraggingPolygon = false;
        this.draggedPolygon = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="zone-header" draggable="false">
                <h2>Рабочая зона</h2>
                <span class="polygon-count">Полигонов: 0</span>
                <span class="zoom-info">Масштаб: 100%</span>
            </div>
            <div class="work-zone-container">
                <svg class="work-zone-svg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <!-- X-axis scale -->
                    <g class="x-scale"></g>
                    <!-- Y-axis scale -->
                    <g class="y-scale"></g>
                    
                    <!-- Content group for polygons -->
                    <g class="content-group" transform="translate(0,0) scale(1)"></g>
                </svg>
            </div>
        `;

        this.svg = this.querySelector('.work-zone-svg');
        this.contentGroup = this.querySelector('.content-group');
        this.setupInteractions();
        this.updateScales();
        this.setupDropZone();
    }

    setupInteractions() {
        // Zoom with mouse wheel
        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.scale = Math.max(0.1, Math.min(5, this.scale));
            this.updateTransform();
            this.updateScales();
        });

        // Pan with mouse drag (only when not dragging polygon)
        this.svg.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !this.isDraggingPolygon) {
                this.isPanning = true;
                this.lastPanPoint = { x: e.clientX, y: e.clientY };
                this.svg.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning && !this.isDraggingPolygon) {
                const deltaX = e.clientX - this.lastPanPoint.x;
                const deltaY = e.clientY - this.lastPanPoint.y;
                
                this.translateX += deltaX / this.scale;
                this.translateY += deltaY / this.scale;
                
                this.updateTransform();
                this.lastPanPoint = { x: e.clientX, y: e.clientY };
            } else if (this.isDraggingPolygon && this.draggedPolygon) {
                // Calculate movement delta in screen coordinates
                const deltaX = e.clientX - this.lastMousePos.x;
                const deltaY = e.clientY - this.lastMousePos.y;
                
                // Convert to SVG coordinates (accounting for scale)
                const svgDeltaX = deltaX / this.scale;
                const svgDeltaY = deltaY / this.scale;
                
                // Get current polygon position
                const polygonData = JSON.parse(this.draggedPolygon.dataset.polygonData);
                const newX = (polygonData.x || 0) + svgDeltaX;
                const newY = (polygonData.y || 0) + svgDeltaY;
                
                // Update polygon position
                this.draggedPolygon.setAttribute('transform', `translate(${newX}, ${newY})`);
                
                // Update polygon data
                polygonData.x = newX;
                polygonData.y = newY;
                this.draggedPolygon.setAttribute('data-polygon-data', JSON.stringify(polygonData));
                
                // Update last mouse position
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            this.isPanning = false;
            this.isDraggingPolygon = false;
            this.draggedPolygon = null;
            this.svg.style.cursor = 'default';
        });
    }

    setupDropZone() {
        this.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        this.addEventListener('dragleave', (e) => {
            if (!this.contains(e.relatedTarget)) {
                this.classList.remove('drag-over');
            }
        });

        this.addEventListener('drop', (e) => {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const polygonId = e.dataTransfer.getData('text/plain');
            const polygonElement = document.querySelector(`polygon-element[data-polygon-id="${polygonId}"]`);
            
            if (polygonElement && !this.contains(polygonElement)) {
                const polygonData = JSON.parse(polygonElement.dataset.polygonData);
                
                // Calculate drop position relative to SVG content group
                const rect = this.svg.getBoundingClientRect();
                const x = (e.clientX - rect.left - this.translateX * this.scale) / this.scale;
                const y = (e.clientY - rect.top - this.translateY * this.scale) / this.scale;
                
                polygonData.x = x;
                polygonData.y = y;
                
                this.addPolygon(polygonData);
                polygonElement.remove();
                
                // Update counter of source zone
                const bufferZone = document.getElementById('buffer-zone');
                if (bufferZone) {
                    bufferZone.updateCounter();
                }
            }
        });
    }

    updateTransform() {
        this.contentGroup.setAttribute('transform', 
            `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`
        );
        
        const zoomInfo = this.querySelector('.zoom-info');
        if (zoomInfo) {
            zoomInfo.textContent = `Масштаб: ${Math.round(this.scale * 100)}%`;
        }
    }

    updateScales() {
        const xScale = this.querySelector('.x-scale');
        const yScale = this.querySelector('.y-scale');
        
        xScale.innerHTML = '';
        yScale.innerHTML = '';
        
        const step = 50 / this.scale;
        const adjustedStep = this.getAdjustedStep(step);
        
        // X-axis scale
        for (let x = 0; x <= 800; x += adjustedStep) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', 10);
            line.setAttribute('stroke', '#666');
            line.setAttribute('stroke-width', '1');
            xScale.appendChild(line);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', 25);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#666');
            text.textContent = Math.round(x);
            xScale.appendChild(text);
        }
        
        // Y-axis scale
        for (let y = 0; y <= 600; y += adjustedStep) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', 10);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#666');
            line.setAttribute('stroke-width', '1');
            yScale.appendChild(line);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', -5);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#666');
            text.textContent = Math.round(y);
            yScale.appendChild(text);
        }
    }

    getAdjustedStep(step) {
        if (step < 10) return 10;
        if (step < 25) return 25;
        if (step < 50) return 50;
        if (step < 100) return 100;
        return Math.round(step / 100) * 100;
    }

    addPolygon(polygonData) {
        const polygonSVG = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygonSVG.setAttribute('points', polygonData.points);
        polygonSVG.setAttribute('fill', polygonData.color);
        polygonSVG.setAttribute('stroke', '#333');
        polygonSVG.setAttribute('stroke-width', '2');
        polygonSVG.setAttribute('transform', `translate(${polygonData.x || 0}, ${polygonData.y || 0})`);
        polygonSVG.setAttribute('data-polygon-id', polygonData.id);
        polygonSVG.setAttribute('data-polygon-data', JSON.stringify(polygonData));
        polygonSVG.style.cursor = 'grab';
        polygonSVG.classList.add('draggable-polygon');
        
        // Make polygon draggable within work zone
        polygonSVG.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isDraggingPolygon = true;
            this.draggedPolygon = polygonSVG;
            polygonSVG.style.cursor = 'grabbing';
            
            // Store initial mouse position
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        });
        
        polygonSVG.addEventListener('mouseup', () => {
            polygonSVG.style.cursor = 'grab';
        });
        
        // Add hover effects
        polygonSVG.addEventListener('mouseenter', () => {
            if (!this.isDraggingPolygon) {
                polygonSVG.setAttribute('stroke-width', '3');
                polygonSVG.style.filter = 'brightness(1.1)';
            }
        });
        
        polygonSVG.addEventListener('mouseleave', () => {
            if (!this.isDraggingPolygon) {
                polygonSVG.setAttribute('stroke-width', '2');
                polygonSVG.style.filter = 'none';
            }
        });
        
        this.contentGroup.appendChild(polygonSVG);
        this.updateCounter();
    }

    getPolygonsData() {
        return Array.from(this.contentGroup.children).map(child => 
            JSON.parse(child.dataset.polygonData)
        );
    }

    updateCounter() {
        const counter = this.querySelector('.polygon-count');
        if (counter) {
            const count = this.contentGroup.children.length;
            counter.textContent = `Полигонов: ${count}`;
        }
    }

    clear() {
        this.contentGroup.innerHTML = '';
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
        this.updateScales();
        this.updateCounter();
    }
}

customElements.define('work-zone', WorkZone);