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
    ritualActive: false,
    ritualTimer: 0
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');
const essenceEl = document.getElementById('essence');
const ritualStatus = document.getElementById('ritual-status');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// NEW FIX: Find absolute nearest from multiple types
function findAbsoluteNearest(origin, types) {
    const validTargets = state.buildings.filter(b => types.includes(b.type));
    if (validTargets.length === 0) return null;

    return validTargets.reduce((prev, curr) => {
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
    state.ritualTimer = 1800; // 30 seconds at 60fps
    ritualStatus.style.display = 'block';
}

function update() {
    // 1. Taxes
    state.taxTimer++;
    if (state.taxTimer > 60) {
        const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0);
        state.money -= totalTax;
        state.taxTimer = 0;
    }

    // 2. Ritual Countdown
    if (state.ritualActive) {
        state.ritualTimer--;
        if (state.ritualTimer <= 0) {
            state.ritualActive = false;
            ritualStatus.style.display = 'none';
        }
    }

    // 3. Production
    state.buildings.forEach(b => {
        if (b.type === 'drill' || b.type === 'mega_drill') {
            b.timer++;
            let speed = state.ritualActive ? b.speed / 2 : b.speed;
            if (b.timer > speed) {
                // FIXED: Now finds the nearest valid building out of ALL processors
                const target = findAbsoluteNearest(b, ['purifier', 'refinery', 'maw']);
                
                if (target) {
                    const count = (state.ritualActive && b.type === 'mega_drill') ? 3 : 1;
                    for (let i = 0; i < count; i++) {
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

    // 4. Workers
    for (let i = state.workers.length - 1; i >= 0; i--) {
        const w = state.workers[i];
        const dx = w.target.x - w.x;
        const dy = w.target.y - w.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            w.x += (dx / dist) * w.speed;
            w.y += (dy / dist) * w.speed;
        } else {
            if (w.target.type === 'maw') {
                state.money += (w.content === 'refined') ? 200 : (CATALOG[w.originType]?.payout || 10);
            } else if (w.target.type === 'altar') {
                if (w.content === 'essence') {
                    state.essence++;
                    if (state.essence >= 20 && !state.ritualActive) triggerRitual();
                }
            } else {
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
        ctx.shadowBlur = 15; ctx.shadowColor = b.color;
        
        // Ritual Visuals
        if (state.ritualActive && (b.type === 'altar' || b.type === 'mega_drill')) {
            ctx.shadowBlur = 30 + Math.sin(Date.now()/100) * 10;
        }

        ctx.fillStyle = b.color;
        if (b.type.includes('drill')) {
            ctx.beginPath();
            const s = b.type === 'mega_drill' ? 25 : 15;
            ctx.moveTo(b.x, b.y-s); ctx.lineTo(b.x+s, b.y+s); ctx.lineTo(b.x-s, b.y+s);
            ctx.fill();
        } else if (b.type === 'maw' || b.type === 'altar') {
            ctx.beginPath(); 
            ctx.arc(b.x, b.y, b.type === 'altar' ? 20 : 35, 0, Math.PI * 2); 
            ctx.fill();
        } else {
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
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
