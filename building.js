export const BUILDINGS = {
    // POWER GENERATION
    solar_panel: {
        name: "Solar Array",
        icon: "☀️",
        cost: { cash: 25 },
        powerGen: 10,
        desc: "Generates clean energy from the browser's light.",
        update: (node, state) => { /* Passive */ }
    },

    // EXTRACTION
    miner_mk1: {
        name: "Data Miner Mk1",
        icon: "⛏️",
        cost: { cash: 15 },
        powerDraw: 2,
        speed: 1, // Items per 5 seconds
        desc: "Extracts raw web-matter from the page.",
        update: (node, state) => {
            node.timer++;
            if (node.timer >= 300 / node.speed) { // roughly 5 seconds
                node.buffer.push("raw_matter");
                node.timer = 0;
            }
        }
    },

    // LOGISTICS
    belt: {
        name: "Conveyor Belt",
        icon: "➡",
        cost: { cash: 5 },
        powerDraw: 0.1,
        desc: "Moves items in a specific direction.",
        update: (node, state, grid) => {
            if (node.buffer.length > 0) {
                // Logic to find the next tile based on node.direction
                // and push the item forward
            }
        }
    },

    // PROCESSING
    assembler: {
        name: "Basic Assembler",
        icon: "⚙️",
        cost: { cash: 50 },
        powerDraw: 5,
        recipe: { input: "raw_matter", qty: 2, output: "logic_circuit" },
        desc: "Combines raw matter into complex components.",
        update: (node, state) => {
            const matterCount = node.buffer.filter(i => i === "raw_matter").length;
            if (matterCount >= 2) {
                // Consume 2 raw matter, produce 1 logic circuit after delay
            }
        }
    },

    // RESEARCH
    lab: {
        name: "Research Lab",
        icon: "🧪",
        cost: { cash: 100 },
        powerDraw: 8,
        desc: "Consumes components to generate Science Points.",
        update: (node, state) => {
            if (node.buffer.includes("logic_circuit")) {
                node.buffer.splice(node.buffer.indexOf("logic_circuit"), 1);
                state.science += 5;
            }
        }
    }
};
