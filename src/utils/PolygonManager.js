export class PolygonManager {
    constructor() {
        this.redColor = '#940024';
    }

    generatePolygons(count) {
        const polygons = [];
        
        for (let i = 0; i < count; i++) {
            const vertices = Math.floor(Math.random() * 8) + 3; // 3-10 vertices
            const polygon = this.generatePolygon(vertices);
            polygons.push(polygon);
        }
        
        return polygons;
    }

    generatePolygon(vertexCount) {
        const id = this.generateId();
        const color = this.redColor; // Всегда используем красный цвет
        const points = this.generatePolygonPoints(vertexCount);
        
        return {
            id,
            vertices: vertexCount,
            color,
            points: points.map(p => `${p.x},${p.y}`).join(' '),
            x: 0,
            y: 0
        };
    }

    generatePolygonPoints(vertexCount) {
        const points = [];
        const centerX = 0;
        const centerY = 0;
        const baseRadius = 30;
        
        for (let i = 0; i < vertexCount; i++) {
            const angle = (2 * Math.PI * i) / vertexCount;
            // Add some randomness to radius for more natural shapes
            const radius = baseRadius + (Math.random() - 0.5) * 10;
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            points.push({ x: Math.round(x), y: Math.round(y) });
        }
        
        return points;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}