import './styles/main.css';
import './components/BufferZone.js';
import './components/WorkZone.js';
import './components/PolygonElement.js';
import { PolygonManager } from './utils/PolygonManager.js';

class App {
    constructor() {
        this.polygonManager = new PolygonManager();
        this.bufferZone = document.getElementById('buffer-zone');
        this.workZone = document.getElementById('work-zone');
        
        this.initEventListeners();
        this.loadData();
    }

    initEventListeners() {
        document.getElementById('create-btn').addEventListener('click', () => {
            this.createPolygons();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveData();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetData();
        });
    }

    createPolygons() {
        const count = Math.floor(Math.random() * 16) + 5; // 5-20 polygons
        const polygons = this.polygonManager.generatePolygons(count);
        
        polygons.forEach(polygonData => {
            this.bufferZone.addPolygon(polygonData);
        });
    }

    saveData() {
        const data = {
            bufferPolygons: this.bufferZone.getPolygonsData(),
            workPolygons: this.workZone.getPolygonsData()
        };
        localStorage.setItem('polygonManagerData', JSON.stringify(data));
        
        // Visual feedback
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Сохранено!';
        saveBtn.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
        }, 1500);
    }

    loadData() {
        const savedData = localStorage.getItem('polygonManagerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            data.bufferPolygons?.forEach(polygonData => {
                this.bufferZone.addPolygon(polygonData);
            });
            
            data.workPolygons?.forEach(polygonData => {
                this.workZone.addPolygon(polygonData);
            });
        }
    }

    resetData() {
        if (confirm('Вы уверены, что хотите сбросить все данные?')) {
            localStorage.removeItem('polygonManagerData');
            this.bufferZone.clear();
            this.workZone.clear();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});