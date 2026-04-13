// buildings.js - Logistics Update

export const ITEMS = {
    raw_matter: { name: "Raw Web-Matter", color: "#00d4ff" }, // Cyan dot
    logic_circuit: { name: "Logic Circuit", color: "#e040fb" }  // Magenta dot
};

export const BUILDINGS = {
    // EXTRACTION
    miner_mk1: {
        type: "miner", name: "Data Miner Mk1", icon: "⛏️",
        cost: { cash: 15 }, powerDraw: 2, speed: 1, // Items per 5s
        bufferMax: 5, // Internal storage capacity
        update: (node, state) => {
            if (node.buffer.length < node.bufferMax) {
                node.timer++;
                if (node.timer >= 300 / node.speed) {
                    node.buffer.push("raw_matter");
                    node.timer = 0;
                }
            }
        }
    },

    // LOGISTICS (Belts move things forward)
    belt: {
        type: "belt", name: "Conveyor Belt", icon: "➡",
        cost: { cash: 5 }, powerDraw: 0.1,
        update: (node, state, grid) => {
            // Find the NEXT tile based on node.direction (0:U, 1:R, 2:D, 3:L)
            const nextKey = getNextTileKey(node);
            const target = grid[nextKey];

            if (node.buffer.length > 0 && target && target.type === 'belt') {
                // If next tile is a belt and has space
                if (target.buffer.length < 4) { // Belt max capacity
                    const item = node.buffer.shift();
                    target.buffer.push(item);
                }
            }
        }
    },

    // INSERTERS (Essential linking mechanism)
    inserter: {
        type: "inserter", name: "Basic Inserter", icon: "🦾",
        cost: { cash: 10 }, powerDraw: 1,
        update: (node, state, grid) => {
            node.timer++;
            if (node.timer < 60) return; // Inserter speed (1 swing/s)
            
            const sourceKey = getPrevTileKey(node);
            const destKey = getNextTileKey(node);
            const source = grid[sourceKey];
            const dest = grid[destKey];

            // PULL from source output
            if (source && source.buffer.length > 0) {
                // PUSH to dest input
                if (dest && dest.buffer.length < (dest.bufferMax || 4)) {
                    const item = source.buffer.shift();
                    dest.buffer.push(item);
                    node.timer = 0;
                }
            }
        }
    }
};

// --- Helper Functions for Directional Logic ---
export function getNextTileKey(node) {
    let nx = node.x, ny = node.y;
    if (node.direction === 0) ny--;      // Up
    else if (node.direction === 1) nx++; // Right
    else if (node.direction === 2) ny++; // Down
    else if (node.direction === 3) nx--; // Left
    return `${nx},${ny}`;
}

export function getPrevTileKey(node) {
    // The opposite of next tile (for inserter picking)
    let px = node.x, py = node.y;
    if (node.direction === 0) py++;      // Bottom (Source)
    else if (node.direction === 1) px--; // Left (Source)
    else if (node.direction === 2) py--; // Top (Source)
    else if (node.direction === 3) px++; // Right (Source)
    return `${px},${py}`;
}
