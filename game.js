const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');

function findNearest(origin, type) {
    const targets = state.buildings.filter(b => b.type === type);
    if (targets.length === 0) return null;

    // Sort by distance and take the first one
    return targets.reduce((prev, curr) => {
        const distPrev = Math.hypot(origin.x - prev.x, origin.y - prev.y);
        const distCurr = Math.hypot(origin.x - curr.x, origin.y - curr.y);
        return distCurr < distPrev ? curr : prev;
    });
}

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
        cost: 500, tax: 4.0, speed: 60, color: '#ffea00', icon: '🚜', payout: 75 
    }
};

let state = {
    money: 300, // <--- YOUR $200 BONUS APPLIED ($100 base + $200)
    buildings: [],
    workers: [],
    selectedTool: null,
    taxTimer: 0,
    gracePeriod: true
};

window.setTool = (t) => {
    state.selectedTool = t;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    if(t) document.getElementById(`btn-${t}`).classList.add('active');
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

function update() {
    // 1. IMPROVED TAX LOGIC
    state.taxTimer++;
    if (state.taxTimer > 60) {
        // TAX PROTECTION: Only tax if money is above $50
        if (state.money > 50) {
            const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0);
            state.money -= totalTax;
        }
        state.taxTimer = 0;
    }

    const maw = state.buildings.find(m => m.type === 'maw');
    const refinery = state.buildings.find(r => r.type === 'refinery');

if ((b.type === 'drill' || b.type === 'mega_drill')) {
    b.timer++;
    if (b.timer > b.speed) {
        // Find the closest refinery AND the closest maw
        const nearRefinery = findNearest(b, 'refinery');
        const nearMaw = findNearest(b, 'maw');

        // Logic: If a refinery exists, go to the nearest one. 
        // Otherwise, go to the nearest Maw.
        const finalDestination = nearRefinery || nearMaw;

        if (finalDestination) {
            state.workers.push({
                x: b.x, y: b.y,
                target: finalDestination,
                content: 'raw',
                originType: b.type,
                speed: 2.5
            });
            b.timer = 0;
        }
    }
}

        if (b.type === 'refinery' && b.inventory.length > 0 && maw) {
            b.timer++;
            if (b.timer > b.speed) {
                b.inventory.shift();
                state.workers.push({ x: b.x, y: b.y, target: maw, content: 'refined', speed: 3.5 });
                b.timer = 0;
            }
        }
    });

    // 2. WORKER MOVEMENT
    state.workers.forEach((w, i) => {
        const dist = Math.hypot(w.target.x - w.x, w.target.y - w.y);
        if (dist > 5) {
            w.x += ((w.target.x - w.x) / dist) * w.speed;
            w.y += ((w.target.y - w.y) / dist) * w.speed;
        } else {
            if (w.target.type === 'maw') {
                if (w.content === 'refined') {
                    state.money += 150;
                } else {
                    state.money += CATALOG[w.originType]?.payout || 10;
                }
            } else if (w.target.type === 'refinery') {
                w.target.inventory.push('raw');
            }
            state.workers.splice(i, 1);
        }
    });

    moneyEl.innerText = Math.floor(state.money);
    moneyEl.style.color = state.money < 50 ? '#ff4444' : '#00ff41';
}

function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Buildings
    state.buildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15; ctx.shadowColor = b.color;
        if (b.type === 'drill' || b.type === 'mega_drill') {
            ctx.beginPath(); 
            const size = b.type === 'mega_drill' ? 25 : 15;
            ctx.moveTo(b.x, b.y-size); ctx.lineTo(b.x+size, b.y+size); ctx.lineTo(b.x-size, b.y+size); 
            ctx.fill();
        } else if (b.type === 'refinery') {
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x-20, b.y+25, (b.timer/b.speed)*40, 5);
        } else {
            ctx.beginPath(); ctx.arc(b.x, b.y, 30, 0, Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    });

    // Draw Workers
    state.workers.forEach(w => {
        ctx.fillStyle = w.content === 'refined' ? '#e040fb' : '#ffffff';
        ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(w.x - 3, w.y - 3, 6, 6);
        ctx.shadowBlur = 0;
    });

    update();
    requestAnimationFrame(draw);
}
draw();
