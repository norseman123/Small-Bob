const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');

// --- THE "BILLION" CONFIGURATION ---
// Add anything here to create a new building automatically!
const CATALOG = {
    drill: { 
        cost: 20, tax: 0.5, speed: 120, color: '#0cf', icon: '⛏️', 
        output: 'raw', payout: 2 
    },
    refinery: { 
        cost: 150, tax: 2, speed: 180, color: '#e040fb', icon: '🌀', 
        input: 'raw', output: 'refined' 
    },
    maw: { 
        cost: 100, tax: 5, color: '#f00', icon: '👄' 
    }
};

let state = {
    money: 100,
    buildings: [],
    workers: [],
    selectedTool: null,
    taxTimer: 0
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
            ...config, // Copy everything from the catalog
            type: state.selectedTool,
            x: e.clientX, y: e.clientY,
            inventory: [], timer: 0
        });
    }
});

function update() {
    // 1. SMART TAX LOGIC
    // Only start taxing once the player has established a real income (e.g., $250)
    // or has more than 5 buildings.
    const isGracePeriod = state.money < 250 && state.buildings.length < 5;
    
    state.taxTimer++;
    if (state.taxTimer > 60) {
        if (!isGracePeriod) {
            const totalTax = state.buildings.reduce((sum, b) => sum + (b.tax || 0), 0);
            state.money -= totalTax;
        }
        state.taxTimer = 0;
    }

    // 2. PREVENT NEGATIVE NUMBERS
    if (state.money < 0) state.money = 0;

    const maw = state.buildings.find(m => m.type === 'maw');
    const refinery = state.buildings.find(r => r.type === 'refinery');

    state.buildings.forEach(b => {
        // DRILL LOGIC
        if (b.type === 'drill' && (refinery || maw)) {
            b.timer++;
            if (b.timer > b.speed) {
                state.workers.push({
                    x: b.x, y: b.y,
                    target: refinery || maw,
                    content: 'raw', speed: 2
                });
                b.timer = 0;
            }
        }

        // REFINERY LOGIC
        if (b.type === 'refinery' && b.inventory.length > 0 && maw) {
            b.timer++;
            if (b.timer > b.speed) {
                b.inventory.shift();
                state.workers.push({ x: b.x, y: b.y, target: maw, content: 'refined', speed: 3 });
                b.timer = 0;
            }
        }
    });

    // 3. WORKER LOGIC
    state.workers.forEach((w, i) => {
        const dist = Math.hypot(w.target.x - w.x, w.target.y - w.y);
        if (dist > 5) {
            w.x += ((w.target.x - w.x) / dist) * w.speed;
            w.y += ((w.target.y - w.y) / dist) * w.speed;
        } else {
            if (w.target.type === 'maw') {
                state.money += (w.content === 'refined' ? 100 : 2);
            } else if (w.target.type === 'refinery') {
                w.target.inventory.push('raw');
            }
            state.workers.splice(i, 1);
        }
    });

    moneyEl.innerText = Math.floor(state.money);
    moneyEl.style.color = state.money < 20 ? 'red' : '#0f0';
}

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.buildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15; ctx.shadowColor = b.color;
        
        if (b.type === 'drill') {
            ctx.beginPath(); ctx.moveTo(b.x, b.y-15); ctx.lineTo(b.x+15, b.y+15); ctx.lineTo(b.x-15, b.y+15); ctx.fill();
        } else if (b.type === 'refinery') {
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x-20, b.y+25, (b.timer/b.speed)*40, 5);
        } else {
            ctx.beginPath(); ctx.arc(b.x, b.y, 25, 0, Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    });

    state.workers.forEach(w => {
        ctx.fillStyle = w.content === 'refined' ? '#e040fb' : '#fff';
        ctx.fillRect(w.x - 4, w.y - 4, 8, 8);
    });

    update();
    requestAnimationFrame(draw);
}
draw();
