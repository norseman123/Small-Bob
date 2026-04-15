// ==========================================
// 1. DATA & STATE CONFIGURATION
// ==========================================
const TILE_SIZE = 40;

const CATALOG = {
    drill: { cost: 50, tax: 0.5, speed: 120, color: '#0cf', payout: 8, size: 1 },
    mega_drill: { cost: 800, tax: 8.0, speed: 80, color: '#ffea00', payout: 60, size: 2 },
    refinery: { cost: 300, tax: 4.0, speed: 180, color: '#e040fb', size: 2 },
    purifier: { cost: 500, tax: 6.0, speed: 200, color: '#00f2ff', size: 2 },
    altar: { cost: 2000, tax: 25.0, color: '#ff0055', size: 3 },
    maw: { cost: 200, tax: 2.0, color: '#f00', size: 3 }
};

let state = {
    money: 1000, // Starting capital
    essence: 0,
    buildings: [],
    workers: [],
    
    occupiedTiles: new Set(),
    
    // Ritual Variables
    ritualActive: false,
    ritualTimer: 0,
    
    // Evil Bob Variables
    evilBobs: [],
    bobTimer: 0,
    benevolentBills: [],
    billTimer: 0,

    selectedTool: null,
    taxTimer: 0
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');
const essenceEl = document.getElementById('essence');
const ritualStatus = document.getElementById('ritual-status');

// Snap canvas to grid size
canvas.width = Math.floor(window.innerWidth / TILE_SIZE) * TILE_SIZE;
canvas.height = Math.floor(window.innerHeight / TILE_SIZE) * TILE_SIZE;


// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function getGridPos(val) {
    return Math.floor(val / TILE_SIZE) * TILE_SIZE;
}

function isAreaClear(startX, startY, size) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const tileStr = `${startX + x * TILE_SIZE},${startY + y * TILE_SIZE}`;
            if (state.occupiedTiles.has(tileStr)) return false;
        }
    }
    return true;
}

function markArea(startX, startY, size) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            state.occupiedTiles.add(`${startX + x * TILE_SIZE},${startY + y * TILE_SIZE}`);
        }
    }
}

function findAbsoluteNearest(origin, types) {
    const targets = state.buildings.filter(b => types.includes(b.type));
    if (targets.length === 0) return null;
    return targets.reduce((prev, curr) => {
        const d1 = Math.hypot(origin.x - prev.x, origin.y - prev.y);
        const d2 = Math.hypot(origin.x - curr.x, origin.y - curr.y);
        return d2 < d1 ? curr : prev;
    });
}


// ==========================================
// 3. INPUT & UI CONTROLS
// ==========================================

window.setTool = (t) => {
    state.selectedTool = t;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    if(document.getElementById(`btn-${t}`)) document.getElementById(`btn-${t}`).classList.add('active');
};

canvas.addEventListener('mousedown', (e) => {
    // 1. CHECK FOR EVIL BOB CLICKS FIRST
    for (let i = state.evilBobs.length - 1; i >= 0; i--) {
        let bob = state.evilBobs[i];
        if (Math.hypot(e.clientX - bob.x, e.clientY - bob.y) < 25) { // 25px hit radius
            state.evilBobs.splice(i, 1);
            state.money += 200;
            state.essence += 2;
            console.log("SMACKED EVIL BOB!");
            return; // Stop the click so we don't accidentally place a building!
        }
    }

    // 2. PLACE BUILDINGS
    if (!state.selectedTool) return;
    const config = CATALOG[state.selectedTool];
    const gridX = getGridPos(e.clientX);
    const gridY = getGridPos(e.clientY);

    if (state.money >= config.cost && isAreaClear(gridX, gridY, config.size)) {
        state.money -= config.cost;
        markArea(gridX, gridY, config.size);
        
        const offset = (config.size * TILE_SIZE) / 2;
        state.buildings.push({
            ...JSON.parse(JSON.stringify(config)),
            type: state.selectedTool,
            x: gridX + offset, 
            y: gridY + offset,
            gridX, gridY,
            inventory: [], timer: 0
        });
    }
});


// ==========================================
// 4. THE CORE ENGINE
// ==========================================

function update() {
    // --- TAXES ---
    state.taxTimer++;
    if (state.taxTimer > 60) {
        const complexityMult = 1 + (state.buildings.length * 0.05);
        const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0) * complexityMult;
        state.money -= totalTax;
        state.taxTimer = 0;
    }

    // --- RITUAL LOGIC ---
    if (state.ritualActive) {
        state.ritualTimer--;
        if (state.ritualTimer <= 0) {
            state.ritualActive = false;
            if(ritualStatus) ritualStatus.style.display = 'none';
        }
    }

    // --- EVIL BOB SPAWN & CHASE LOGIC ---
    state.bobTimer++;
    // Spawns every ~15 seconds if you have more than $1000
    if (state.bobTimer > 900 && state.money > 1000) {
        state.evilBobs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1.5,
            size: 20
        });
        state.bobTimer = 0;
    }

    for (let i = state.evilBobs.length - 1; i >= 0; i--) {
        let bob = state.evilBobs[i];
        
        if (state.workers.length > 0) {
            let targetWorker = state.workers.reduce((prev, curr) => {
                const d1 = Math.hypot(bob.x - prev.x, bob.y - prev.y);
                const d2 = Math.hypot(bob.x - curr.x, bob.y - curr.y);
                return d2 < d1 ? curr : prev;
            });

            let dx = targetWorker.x - bob.x;
            let dy = targetWorker.y - bob.y;
            let dist = Math.hypot(dx, dy);

            if (dist > 5) {
                bob.x += (dx / dist) * bob.speed;
                bob.y += (dy / dist) * bob.speed;
            } else {
                // Bob caught a worker!
                state.workers.splice(state.workers.indexOf(targetWorker), 1);
                state.money -= 50; // Penalty
            }
        }
    }

    // --- BUILDING PRODUCTION ---
    state.buildings.forEach(b => {
        if (b.type === 'drill' || b.type === 'mega_drill') {
            b.timer++;
            let speed = state.ritualActive ? b.speed / 2 : b.speed;
            if (b.timer > speed) {
                const target = findAbsoluteNearest(b, ['purifier', 'refinery', 'maw']);
                if (target) {
                    const count = (state.ritualActive && b.type === 'mega_drill') ? 2 : 1;
                    for(let i=0; i<count; i++) {
                        state.workers.push({ x: b.x, y: b.y, target, content: 'raw', originType: b.type, speed: 3 });
                    }
                    b.timer = 0;
                }
            }
        }

        if ((b.type === 'refinery' || b.type === 'purifier') && b.inventory.length > 0) {
            b.timer++;
            if (b.timer > b.speed) {
                const outType = b.type === 'refinery' ? 'refined' : 'essence';
                const targetType = outType === 'essence' ? 'altar' : 'maw';
                const target = findAbsoluteNearest(b, [targetType]);
                if (target) {
                    b.inventory.shift();
                    state.workers.push({ x: b.x, y: b.y, target, content: outType, originType: b.type, speed: 4 });
                    b.timer = 0;
                }
            }
        }
    });

    // --- WORKER MOVEMENT ---
    for (let i = state.workers.length - 1; i >= 0; i--) {
        const w = state.workers[i];
        const dx = w.target.x - w.x;
        const dy = w.target.y - w.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            w.x += (dx / dist) * w.speed;
            w.y += (dy / dist) * w.speed;
        } else {
            // Arrival Logic
            if (w.target.type === 'maw') {
                state.money += (w.content === 'refined') ? 120 : (CATALOG[w.originType]?.payout || 5);
            } else if (w.target.type === 'altar') {
                if (w.content === 'essence') {
                    state.essence++;
                    if (state.essence >= 20 && !state.ritualActive) {
                        state.ritualActive = true;
                        state.ritualTimer = 1200; // 20 seconds at 60 FPS
                        state.essence = 0;
                        if(ritualStatus) ritualStatus.style.display = 'block';
                    }
                }
            } else if (w.target.inventory) {
                w.target.inventory.push(w.content);
            }
            state.workers.splice(i, 1);
        }
    }

    // --- UI UPDATES ---
    moneyEl.innerText = Math.floor(state.money);
    essenceEl.innerText = state.essence;
}


// ==========================================
// 5. RENDERING
// ==========================================

function draw() {
    // CLEAR canvas so CSS grid shows through!
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Buildings
    state.buildings.forEach(b => {
        ctx.shadowBlur = 10; ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        
        // Ritual glow effect
        if (state.ritualActive && (b.type === 'altar' || b.type === 'mega_drill')) {
            ctx.shadowBlur = 30 + Math.sin(Date.now() / 100) * 15;
        }

        const drawSize = (b.size * TILE_SIZE) - 4;
        const drawX = b.gridX + 2;
        const drawY = b.gridY + 2;

        if (b.type.includes('drill')) {
            ctx.beginPath();
            ctx.moveTo(b.x, drawY); 
            ctx.lineTo(drawX + drawSize, drawY + drawSize);
            ctx.lineTo(drawX, drawY + drawSize);
            ctx.fill();
        } else if (b.type === 'maw' || b.type === 'altar') {
            ctx.beginPath();
            ctx.arc(b.x, b.y, (drawSize/2), 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
        ctx.shadowBlur = 0;
    });

    // Draw Workers
    state.workers.forEach(w => {
        ctx.fillStyle = w.content === 'essence' ? '#00f2ff' : (w.content === 'refined' ? '#e040fb' : 'white');
        ctx.fillRect(w.x-3, w.y-3, 6, 6);
    });

    // Draw Evil Bobs
    state.evilBobs.forEach(bob => {
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff0000';
        ctx.fillRect(bob.x - bob.size/2, bob.y - bob.size/2, bob.size, bob.size);
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(bob.x - 6, bob.y - 4, 4, 4); // Left eye
        ctx.fillRect(bob.x + 2, bob.y - 4, 4, 4); // Right eye
    });

    update();
    requestAnimationFrame(draw);
}

// Start the game loop
draw();
