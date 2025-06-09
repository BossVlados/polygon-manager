class PolygonElement extends HTMLElement {
    constructor() {
        super();
        this.polygonData = null;
    }

    connectedCallback() {
        this.draggable = true;
        this.setupDragAndDrop();
    }

    setData(polygonData) {
        this.polygonData = polygonData;
        this.dataset.polygonId = polygonData.id;
        this.dataset.polygonData = JSON.stringify(polygonData);
        this.render();
    }

    render() {
        if (!this.polygonData) return;

        this.innerHTML = `
            <div class="polygon-preview">
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <polygon 
                        points="${this.polygonData.points}" 
                        fill="${this.polygonData.color}" 
                        stroke="#333" 
                        stroke-width="1"
                        transform="translate(40,40) scale(0.3)"
                    />
                </svg>
                <div class="polygon-info">
                    <div class="polygon-id">ID: ${this.polygonData.id.slice(0, 8)}</div>
                    <div class="polygon-vertices">${this.polygonData.vertices} вершин</div>
                </div>
            </div>
        `;
    }

    setupDragAndDrop() {
        this.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', this.polygonData.id);
            this.classList.add('dragging');
        });

        this.addEventListener('dragend', () => {
            this.classList.remove('dragging');
        });

        // Add visual feedback
        this.addEventListener('mouseenter', () => {
            this.classList.add('hover');
        });

        this.addEventListener('mouseleave', () => {
            this.classList.remove('hover');
        });
    }
}

customElements.define('polygon-element', PolygonElement);