// 1. DATA CONFIGURATION
const CATALOG = {
    drill: { 
        cost: 20, tax: 0.1, speed: 100, color: '#0cf', icon: '⛏️', payout: 10 
    },
    refinery: { 
        cost: 150, tax: 1.5, speed: 150, color: '#e040fb', icon: '🌀', input: 'raw', output: 'refined' 
    },
    maw: { 
        cost: 100, tax: 0.5, color: '#f00', icon: '👄' 
    },
    mega_drill: { 
        cost: 500, tax: 4.0, speed: 60, color: '#ffea00', icon: '🚜', payout: 100 
    }
};

let state = {
    money: 300, // $200 Bonus included
    buildings: [],
    workers: [],
    selectedTool: null,
    taxTimer: 0
};

// 2. HELPER FUNCTIONS (Distance Logic)
function findNearest(origin, type) {
    const targets = state.buildings.filter(b => b.type === type);
    if (targets.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const target of targets) {
        const d = Math.hypot(origin.x - target.x, origin.y - target.y);
        if (d < minDist) {
            minDist = d;
            nearest = target;
        }
    }
    return nearest;
}

// 3. UI CONTROLS
window.setTool = (t) => {
    state.selectedTool = t;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-${t}`);
    if(btn) btn.classList.add('active');
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 4. PLACEMENT LOGIC
canvas.addEventListener('mousedown', (e) => {
    if (!state.selectedTool) return;
    const config = CATALOG[state.selectedTool];
    
    if (state.money >= config.cost) {
        state.money -= config.cost;
        state.buildings.push({
            ...JSON.parse(JSON.stringify(config)),
            type: state.selectedTool,
            x: e.clientX, y: e.clientY,
            inventory: [], timer: 0
        });
    }
});

// 5. THE CORE ENGINE
function update() {
    // Taxation
    state.taxTimer++;
    if (state.taxTimer > 60) {
        if (state.money > 20) { // Tax protection
            const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0);
            state.money -= totalTax;
        }
        state.taxTimer = 0;
    }

    // Production
    state.buildings.forEach(b => {
        if (b.type === 'drill' || b.type === 'mega_drill') {
            b.timer++;
            if (b.timer > b.speed) {
                const target = findNearest(b, 'refinery') || findNearest(b, 'maw');
                if (target) {
                    state.workers.push({
                        x: b.x, y: b.y, target: target,
                        content: 'raw', originType: b.type, speed: 3
                    });
                    b.timer = 0;
                }
            }
        }

        if (b.type === 'refinery' && b.inventory.length > 0) {
            b.timer++;
            if (b.timer > b.speed) {
                const target = findNearest(b, 'maw');
                if (target) {
                    b.inventory.shift();
                    state.workers.push({
                        x: b.x, y: b.y, target: target,
                        content: 'refined', originType: 'refinery', speed: 4
                    });
                    b.timer = 0;
                }
            }
        }
    });

    // Logistics (Movement)
    for (let i = state.workers.length - 1; i >= 0; i--) {
        const w = state.workers[i];
        const dx = w.target.x - w.x;
        const dy = w.target.y - w.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            w.x += (dx / dist) * w.speed;
            w.y += (dy / dist) * w.speed;
        } else {
            // Arrival
            if (w.target.type === 'maw') {
                state.money += (w.content === 'refined') ? 200 : (CATALOG[w.originType]?.payout || 10);
            } else if (w.target.type === 'refinery') {
                w.target.inventory.push('raw');
            }
            state.workers.splice(i, 1);
        }
    }

    moneyEl.innerText = Math.floor(state.money);
}

// 6. RENDERING
function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.buildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15; ctx.shadowColor = b.color;
        if (b.type.includes('drill')) {
            ctx.beginPath();
            const s = b.type === 'mega_drill' ? 25 : 15;
            ctx.moveTo(b.x, b.y-s); ctx.lineTo(b.x+s, b.y+s); ctx.lineTo(b.x-s, b.y+s);
            ctx.fill();
        } else if (b.type === 'refinery') {
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
            ctx.fillStyle = 'white'; ctx.fillRect(b.x-20, b.y+25, (b.timer/b.speed)*40, 4);
        } else {
            ctx.beginPath(); ctx.arc(b.x, b.y, 30, 0, Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    });

    state.workers.forEach(w => {
        ctx.fillStyle = w.content === 'refined' ? '#e040fb' : 'white';
        ctx.fillRect(w.x-3, w.y-3, 6, 6);
    });

    update();
    requestAnimationFrame(draw);
}

draw();
