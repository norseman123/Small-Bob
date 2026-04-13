export const TECH_TREE = {
    automation_1: {
        title: "Basic Automation",
        cost: 20, // Science points
        unlocked: false,
        requirements: [],
        desc: "Unlocks the Assembler and Conveyor Belts.",
        onUnlock: (state) => {
            console.log("Automation Unlocked!");
            // Logic to show hidden buttons in index.html
        }
    },
    green_energy: {
        title: "High-Efficiency Solar",
        cost: 50,
        unlocked: false,
        requirements: ["automation_1"],
        desc: "Solar panels now generate 50% more power.",
        onUnlock: (state) => {
            state.modifiers.solarEfficiency = 1.5;
        }
    },
    advanced_mining: {
        title: "Hyper-Threading Miners",
        cost: 150,
        unlocked: false,
        requirements: ["green_energy"],
        desc: "Miners extract data twice as fast.",
        onUnlock: (state) => {
            state.modifiers.minerSpeed = 2.0;
        }
    },
    fabrication_socks: {
        title: "Industrial Sock Weaving",
        cost: 500,
        unlocked: false,
        requirements: ["advanced_mining"],
        desc: "Unlocks the Sock Fabricator. High profit potential.",
        onUnlock: (state) => {
             // Unlock advanced building type
        }
    }
};
