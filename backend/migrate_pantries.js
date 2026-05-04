const fs = require('fs');
const path = require('path');
const pool = require('./db');

const FILE_PATH = path.join(__dirname, 'data', 'shared_pantries.json');

async function migratePantries() {
    if (!fs.existsSync(FILE_PATH)) return;
    const state = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    
    for (let pantry of state.pantries) {
        // Create a new valid user in the DB for this pantry
        const result = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [`shared_${pantry.id}`, `shared_${pantry.id}@system.local`, 'fake_shared_password']
        );
        pantry.virtualId = result.rows[0].id;
    }
    
    fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    console.log('Migrated all shared pantries to valid Postgres user IDs!');
    pool.end();
}

migratePantries().catch(console.error);
