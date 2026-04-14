const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const moneyEl = document.getElementById('money');

let state = {
    money: 100,
    buildings: [],
    workers: [],
    selectedTool: null
};

// Make the tool selection function global so buttons can see it
window.setTool = (tool) => {
    state.selectedTool = tool;
    // Visual feedback for buttons
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    if(tool) document.getElementById(`btn-${tool}`).classList.add('active');
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Clicking to place buildings
canvas.addEventListener('mousedown', (e) => {
    if (!state.selectedTool) return;

    const costs = { drill: 10, maw: 50 };
    if (state.money >= costs[state.selectedTool]) {
        state.money -= costs[state.selectedTool];
        moneyEl.innerText = state.money;
        
        state.buildings.push({
            type: state.selectedTool,
            x: e.clientX,
            y: e.clientY,
            inventory: 0,
            timer: 0
        });
    }
});

function update() {
    // 1. Drills produce Raw Data
    const maw = state.buildings.find(m => m.type === 'maw');
    
    state.buildings.forEach(b => {
        if (b.type === 'drill') {
            b.timer++;
            // Every 3 seconds, try to send a worker if a Maw exists
            if (b.timer > 180 && maw) {
                state.workers.push({
                    x: b.x,
                    y: b.y,
                    target: maw,
                    speed: 2.5
                });
                b.timer = 0;
            }
        }
    });

    // 2. Workers move to the Maw
    state.workers.forEach((w, index) => {
        const dx = w.target.x - w.x;
        const dy = w.target.y - w.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            w.x += (dx / dist) * w.speed;
            w.y += (dy / dist) * w.speed;
        } else {
            // Arrived at Maw: Get paid and delete worker
            state.money += 25;
            moneyEl.innerText = state.money;
            state.workers.splice(index, 1);
        }
    });
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (for flavor)
    ctx.strokeStyle = '#222';
    for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
    for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

    // Draw Buildings
    state.buildings.forEach(b => {
        ctx.fillStyle = b.type === 'drill' ? '#0cf' : '#f00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.beginPath();
        // Drills are triangles, Maws are circles
        if (b.type === 'drill') {
            ctx.moveTo(b.x, b.y - 20); ctx.lineTo(b.x + 20, b.y + 20); ctx.lineTo(b.x - 20, b.y + 20);
        } else {
            ctx.arc(b.x, b.y, 25, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Little Guys
    state.workers.forEach(w => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(w.x - 4, w.y - 4, 8, 8);
        // Glow effect for the guy
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fff";
        ctx.fillRect(w.x - 2, w.y - 2, 4, 4);
        ctx.shadowBlur = 0;
    });

    update();
    requestAnimationFrame(draw);
}

// Start the loop
draw();
