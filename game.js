const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 40;

let state = {
    cash: 100,
    power: 0,
    science: 0,
    grid: {}, // Stores buildings by "x,y" key
    selectedTool: null,
    scroll: { x: 0, y: 0 }
};

// --- Initialization ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupInputs();
    requestAnimationFrame(gameLoop);
}

function setupInputs() {
    document.querySelectorAll('.tool').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            state.selectedTool = btn.dataset.type;
            btn.classList.add('active');
        };
    });

    canvas.onmousedown = (e) => {
        const gridX = Math.floor((e.clientX - state.scroll.x) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - state.scroll.y) / TILE_SIZE);
        const key = `${gridX},${gridY}`;

        if (state.selectedTool && !state.grid[key]) {
            placeBuilding(gridX, gridY, state.selectedTool);
        }
    };
}

function placeBuilding(x, y, type) {
    state.grid[`${x},${y}`] = {
        type: type,
        x: x,
        y: y,
        level: 1,
        timer: 0
    };
    updateUI();
}

function updateUI() {
    document.getElementById('cash').innerText = state.cash;
    document.getElementById('science').innerText = state.science;
}

// --- Main Loop ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Logic for miners producing items, belts moving them, etc.
    Object.values(state.grid).forEach(b => {
        if (b.type === 'miner') {
            b.timer++;
            if (b.timer > 100) { // Every 100 frames
                state.cash += 5;
                b.timer = 0;
                updateUI();
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    ctx.strokeStyle = '#1a1a1a';
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw Buildings
    Object.values(state.grid).forEach(b => {
        const px = b.x * TILE_SIZE;
        const py = b.y * TILE_SIZE;
        
        ctx.fillStyle = b.type === 'miner' ? '#0cf' : '#f0f';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#fff';
        ctx.fillText(b.type[0].toUpperCase(), px + 15, py + 25);
    });
}

init();
