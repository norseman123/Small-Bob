const CATALOG = {
    drill: { cost: 20, tax: 0.1, speed: 100, color: '#0cf', payout: 10 },
    mega_drill: { cost: 500, tax: 4.0, speed: 60, color: '#ffea00', payout: 100 },
    refinery: { cost: 150, tax: 1.5, speed: 150, color: '#e040fb', input: 'raw', output: 'refined' },
    purifier: { cost: 400, tax: 3.0, speed: 200, color: '#00f2ff', input: 'raw', output: 'essence' },
    altar: { cost: 1000, tax: 15.0, color: '#ff0055' },
    maw: { cost: 100, tax: 0.5, color: '#f00' }
};

let state = {
    money: 300,
    essence: 0,
    buildings: [],
    workers: [],
    selectedTool: null,
    taxTimer: 0,
    ritualActive: false
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');
const essenceEl = document.getElementById('essence');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- LOGIC FUNCTIONS ---

function findNearest(origin, type) {
    const targets = state.buildings.filter(b => b.type === type);
    if (targets.length === 0) return null;
    return targets.reduce((prev, curr) => {
        const d1 = Math.hypot(origin.x - prev.x, origin.y - prev.y);
        const d2 = Math.hypot(origin.x - curr.x, origin.y - curr.y);
        return d2 < d1 ? curr : prev;
    });
}

window.setTool = (t) => {
    state.selectedTool = t;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-${t}`);
    if (btn) btn.classList.add('active');
};

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

function triggerRitual() {
    state.ritualActive = true;
    state.essence = 0;
    // Visual indicator: glowing red vignette
    canvas.style.boxShadow = "inset 0 0 100px rgba(255, 0, 0, 0.5)";
    setTimeout(() => {
        state.ritualActive = false;
        canvas.style.boxShadow = "none";
    }, 30000); // Ritual lasts 30 seconds
}

function update() {
    // 1. Taxes
    state.taxTimer++;
    if (state.taxTimer > 60) {
        const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0);
        // Only take tax if player can afford it, or let them go slightly into debt
        state.money -= totalTax;
        state.taxTimer = 0;
    }

    // 2. Production
    state.buildings.forEach(b => {
        // DRILLS
        if (b.type === 'drill' || b.type === 'mega_drill') {
            b.timer++;
            let speed = state.ritualActive ? b.speed / 2 : b.speed;
            if (b.timer > speed) {
                // Priority pathing: Find nearest place to drop off Raw Matter
                const target = findNearest(b, 'purifier') || findNearest(b, 'refinery') || findNearest(b, 'maw');
                if (target) {
                    // RITUAL BONUS: Mega Drills spawn 3 workers instead of 1
                    const count = (state.ritualActive && b.type === 'mega_drill') ? 3 : 1;
                    for (let i = 0; i < count; i++) {
                        state.workers.push({ x: b.x, y: b.y, target, content: 'raw', originType: b.type, speed: 3 });
                    }
                    b.timer = 0;
                }
            }
        }

        // PROCESSORS (Refinery / Purifier)
        if ((b.type === 'refinery' || b.type === 'purifier') && b.inventory.length > 0) {
            b.timer++;
            if (b.timer > b.speed) {
                const outType = b.type === 'refinery' ? 'refined' : 'essence';
                const target = outType === 'essence' ? findNearest(b, 'altar') : findNearest(b, 'maw');
                if (target) {
                    b.inventory.shift();
                    state.workers.push({ x: b.x, y: b.y, target, content: outType, originType: b.type, speed: 4 });
                    b.timer = 0;
                }
            }
        }
    });

    // 3. Workers Movement
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
            } else if (w.target.type === 'altar') {
                if (w.content === 'essence') {
                    state.essence++;
                    if (state.essence >= 20 && !state.ritualActive) triggerRitual();
                }
            } else if (w.target.inventory) {
                w.target.inventory.push(w.content);
            }
            state.workers.splice(i, 1);
        }
    }

    moneyEl.innerText = Math.floor(state.money);
    essenceEl.innerText = state.essence;
}

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
        } else if (b.type === 'maw' || b.type === 'altar') {
            ctx.beginPath(); 
            ctx.arc(b.x, b.y, b.type === 'altar' ? 20 : 35, 0, Math.PI * 2); 
            ctx.fill();
            // Inner circle for Altar
            if (b.type === 'altar') {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill();
            }
        } else {
            // Refineries and Purifiers are squares
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
            // Progress bar
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(b.x-20, b.y+25, 40, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(b.x-20, b.y+25, (b.timer/b.speed)*40, 4);
        }
        ctx.shadowBlur = 0;
    });

    state.workers.forEach(w => {
        ctx.fillStyle = w.content === 'essence' ? '#00f2ff' : (w.content === 'refined' ? '#e040fb' : 'white');
        ctx.fillRect(w.x-3, w.y-3, 6, 6);
    });

    update();
    requestAnimationFrame(draw);
}

draw();
