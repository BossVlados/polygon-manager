class BufferZone extends HTMLElement {
    constructor() {
        super();
        this.polygons = [];
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="zone-header" draggable="false">
                <h2>Буферная зона</h2>
                <span class="polygon-count">Полигонов: 0</span>
            </div>
            <div class="zone-content" id="buffer-content"></div>
        `;

        this.content = this.querySelector('#buffer-content');
        this.setupDropZone();
        this.updateCounter();
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
            const polygonElement = document.querySelector(`[data-polygon-id="${polygonId}"]`);
            
            if (polygonElement && !this.contains(polygonElement)) {
                const polygonData = JSON.parse(polygonElement.dataset.polygonData);
                this.addPolygon(polygonData);
                polygonElement.remove();
                
                // Update counter of source zone
                const workZone = document.getElementById('work-zone');
                if (workZone) {
                    workZone.updateCounter();
                }
            }
        });
    }

    addPolygon(polygonData) {
        const polygonElement = document.createElement('polygon-element');
        polygonElement.setData(polygonData);
        this.content.appendChild(polygonElement);
        this.polygons.push(polygonData);
        this.updateCounter();
    }

    removePolygon(polygonId) {
        this.polygons = this.polygons.filter(p => p.id !== polygonId);
        this.updateCounter();
    }

    getPolygonsData() {
        return Array.from(this.content.children).map(child => 
            JSON.parse(child.dataset.polygonData)
        );
    }

    updateCounter() {
        const counter = this.querySelector('.polygon-count');
        if (counter) {
            const count = this.content.children.length;
            counter.textContent = `Полигонов: ${count}`;
        }
    }

    clear() {
        this.content.innerHTML = '';
        this.polygons = [];
        this.updateCounter();
    }
}

customElements.define('buffer-zone', BufferZone);