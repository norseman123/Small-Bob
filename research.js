// research.js - Progression Update

export const TECH_TREE = {
    science_automation: {
        title: "Science: Automation",
        cost: { raw_matter: 20 }, // Cost is raw items, not science points!
        icon: "🧪",
        unlocked: false,
        desc: "Automate raw matter research. Unlock the basic Lab building."
    },
    complex_manufacturing: {
        title: "Advanced Manufacturing",
        cost: { logic_circuit: 100 },
        icon: "⚙️",
        unlocked: false,
        requirements: ["science_automation"],
        desc: "Unlock Assembler Mk1 and splitters."
    }
};

// Call this from game.js whenever research points are added
export function checkResearchUnlock(state) {
    // Current goal is the first uncompleted tech
    const currentGoalKey = Object.keys(TECH_TREE).find(key => !TECH_TREE[key].unlocked);
    if (!currentGoalKey) return null; // All done!

    const goal = TECH_TREE[currentGoalKey];
    
    // Check if the state has enough science points (science points are now abstract)
    // For this complex loop, we'll keep a temporary abstract counter
    if (state.science >= goal.cost_abstract) {
        goal.unlocked = true;
        // Apply unlocks:
        if (currentGoalKey === 'science_automation') {
             // Unlock 'lab' button in HTML
        }
        return goal.title;
    }
    return null;
}
