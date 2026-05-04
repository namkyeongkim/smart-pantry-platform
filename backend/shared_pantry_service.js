const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'data', 'shared_pantries.json');
const pool = require('./db');

function loadState() {
    if (fs.existsSync(FILE_PATH)) {
        return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    }
    return { pantries: [], user_pantries: {} };
}

function saveState(state) {
    if (!fs.existsSync(path.dirname(FILE_PATH))) {
        fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

module.exports = {
    getTargetUserId: (userId) => {
        const state = loadState();
        const activePantryId = state.user_pantries[userId];
        if (activePantryId) {
            const pantry = state.pantries.find(p => p.id === activePantryId);
            if (pantry) return pantry.virtualId || pantry.ownerId;
        }
        return userId;
    },
    createPantry: async (userId, name) => {
        const state = loadState();
        const id = Math.random().toString(36).substring(2, 10);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Create a valid user in Postgres to act as this pantry's owner
        const result = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [`shared_${id}`, `shared_${id}@system.local`, 'fake_shared_password']
        );
        const virtualId = result.rows[0].id;
        
        state.pantries.push({ id, name, code, ownerId: userId, virtualId });
        state.user_pantries[userId] = id;
        saveState(state);
        return code;
    },
    joinPantry: (userId, code) => {
        const state = loadState();
        const pantry = state.pantries.find(p => p.code === code.toUpperCase());
        if (!pantry) throw new Error('Pantry not found');
        state.user_pantries[userId] = pantry.id;
        saveState(state);
        return pantry.name;
    },
    leavePantry: (userId) => {
        const state = loadState();
        delete state.user_pantries[userId];
        saveState(state);
    },
    getJoinedPantry: (userId) => {
        const state = loadState();
        const activePantryId = state.user_pantries[userId];
        if (activePantryId) {
            return state.pantries.find(p => p.id === activePantryId);
        }
        return null;
    }
};
