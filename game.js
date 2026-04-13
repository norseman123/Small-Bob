// game.js - Canvas Drawing Update
import { BUILDINGS, ITEMS } from './buildings.js';

// --- Draw Item Particles ---
function drawItem(ctx, itemType, x, y) {
    const config = ITEMS[itemType];
    if (!config) return;
    
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

// --- Specific Draw Functions for Building Types ---
const DRAW_FUNCTIONS = {
    belt: (ctx, node, px, py, TILE_SIZE) => {
        const center = TILE_SIZE / 2;
        ctx.save();
        ctx.translate(px + center, py + center);
        // Rotate the canvas based on belt direction
        ctx.rotate((node.direction * 90) * Math.PI / 180);
        
        // Draw Belt Graphic (Dashed arrow)
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(-center + 5, 0); ctx.lineTo(center - 5, 0); ctx.stroke();
        
        // Draw Arrowhead
        ctx.beginPath(); ctx.moveTo(center - 10, -10); ctx.lineTo(center - 5, 0); ctx.lineTo(center - 10, 10); ctx.stroke();
        ctx.restore(); ctx.setLineDash([]); // Reset dash

        // Draw Items on Belt (Buffer is 0-4 slots along the line)
        node.buffer.forEach((itemType, index) => {
            // Calculate item position along the line (0-1 progression)
            const progress = (index + 1) / (node.buffer.length + 1);
            let itemX = -center + (TILE_SIZE * progress);
            let itemY = 0;
            
            // Re-apply rotation logic to position the item correctly
            ctx.save();
            ctx.translate(px + center, py + center);
            ctx.rotate((node.direction * 90) * Math.PI / 180);
            drawItem(ctx, itemType, itemX, itemY);
            ctx.restore();
        });
    },
    
    inserter: (ctx, node, px, py, TILE_SIZE) => {
        const center = TILE_SIZE / 2;
        ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
        ctx.save();
        ctx.translate(px + center, py + center);
        ctx.rotate((node.direction * 90) * Math.PI / 180);
        
        // Draw Inserter Body (L-Shape)
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0); // Base arm
        ctx.lineTo(10, -TILE_SIZE/2 - 5);    // Swing arm
        ctx.stroke();
        
        // Visual indicator: If holding an item, draw it at the tip of the arm
        if (node.buffer.length > 0) {
            drawItem(ctx, node.buffer[0], 10, -TILE_SIZE/2 - 5);
        }
        ctx.restore();
    },
    
    generic: (ctx, node, px, py, TILE_SIZE) => {
        // Fallback for miners, assemblers, labs (squares with icons)
        const config = BUILDINGS[node.type];
        ctx.fillStyle = (node.timer > 0) ? '#004411' : '#222'; // Flashes green when working
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
        ctx.fillText(config.icon, px + 10, py + 26);
    }
};

// --- The Master Draw Function (Call this in your main loop) ---
export function drawGrid(ctx, state, TILE_SIZE) {
    Object.values(state.grid).forEach(node => {
        const px = node.x * TILE_SIZE;
        const py = node.y * TILE_SIZE;
        const drawFn = DRAW_FUNCTIONS[node.type] || DRAW_FUNCTIONS.generic;
        drawFn(ctx, node, px, py, TILE_SIZE);
    });
}
