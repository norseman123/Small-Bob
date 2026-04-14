const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');

let state = {
    money: 150,
    buildings: [],
    workers: [],
    selectedTool: null,
    taxTimer: 0
};

window.setTool = (tool) => {
    state.selectedTool = tool;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    if(tool) document.getElementById(`btn-${tool}`).classList.add('active');
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('mousedown', (e) => {
    if (!state.selectedTool) return;
    const costs = { drill: 20, refinery: 150, maw: 100 };
    if (state.money >= costs[state.selectedTool]) {
        state.money -= costs[state.selectedTool];
        state.buildings.push({
            type: state.selectedTool,
            x: e.clientX,
            y: e.clientY,
            inventory: [],
            timer: 0
        });
    }
});

function update() {
    // 1. Maintenance Tax (The "Money Sink")
    state.taxTimer++;
    if (state.taxTimer > 60) {
        // Every second, pay $1 per building
        state.money -= state.buildings.length;
        state.taxTimer = 0;
    }

    const maw = state.buildings.find(m => m.type === 'maw');
    const refinery = state.buildings.find(r => r.type === 'refinery');

    state.buildings.forEach(b => {
        // DRILL LOGIC
        if (b.type === 'drill') {
            b.timer++;
            if (b.timer > 120) { // Every 2 seconds
                // Pathfinding: Go to refinery if it exists, otherwise go to Maw
                const destination = refinery || maw;
                if (destination) {
                    state.workers.push({
                        x: b.x, y: b.y,
                        target: destination,
                        content: 'raw', // White cargo
                        speed: 2
                    });
                }
                b.timer = 0;
            }
        }

        // REFINERY LOGIC
        if (b.type === 'refinery') {
            if (b.inventory.length > 0) {
                b.timer++;
                if (b.timer > 180 && maw) { // 3 seconds to refine
                    b.inventory.shift();
                    state.workers.push({
                        x: b.x, y: b.y,
                        target: maw,
                        content: 'refined', // Purple cargo
                        speed: 3
                    });
                    b.timer = 0;
                }
            }
        }
    });

    // 2. Workers Logic
    state.workers.forEach((w, index) => {
        const dx = w.target.x - w.x;
        const dy = w.target.y - w.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            w.x += (dx / dist) * w.speed;
            w.y += (dy / dist) * w.speed;
        } else {
            // Drop off logic
            if (w.target.type === 'maw') {
                state.money += (w.content === 'refined' ? 100 : 2);
            } else if (w.target.type === 'refinery') {
                w.target.inventory.push('raw');
            }
            state.workers.splice(index, 1);
        }
    });

    moneyEl.innerText = Math.floor(state.money);
}

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.buildings.forEach(b => {
        ctx.shadowBlur = 15;
        if (b.type === 'drill') {
            ctx.fillStyle = '#0cf';
            ctx.beginPath(); ctx.moveTo(b.x, b.y-15); ctx.lineTo(b.x+15, b.y+15); ctx.lineTo(b.x-15, b.y+15); ctx.fill();
        } else if (b.type === 'refinery') {
            ctx.fillStyle = '#e040fb'; // Purple
            ctx.fillRect(b.x-20, b.y-20, 40, 40);
            // Draw "Loading Bar" for refinery
            ctx.fillStyle = '#fff';
            ctx.fillRect(b.x-20, b.y+25, (b.timer/180)*40, 5);
        } else {
            ctx.fillStyle = '#f00';
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


class Building {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.type = config.type;
        this.productionRate = config.rate;
        this.inventory = [];
    }
    
    produce() {
        // Generic logic: if I have ingredients, wait X seconds, then output
    }
};
