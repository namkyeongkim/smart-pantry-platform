const pool = require('../db');

async function migrate() {
    try {
        console.log("Starting migration...");
        
        // 1. Create pantries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pantries (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                share_code VARCHAR(20) UNIQUE NOT NULL,
                owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created pantries table.");

        // 2. Create pantry_members table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pantry_members (
                pantry_id INTEGER REFERENCES pantries(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (pantry_id, user_id)
            )
        `);
        console.log("Created pantry_members table.");

        // 3. Add active_pantry_id to users
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN active_pantry_id INTEGER REFERENCES pantries(id) ON DELETE SET NULL`);
            console.log("Added active_pantry_id to users.");
        } catch(e) {
            console.log("active_pantry_id might already exist.", e.message);
        }

        // 4. Add pantry_id to pantry_items
        try {
            await pool.query(`ALTER TABLE pantry_items ADD COLUMN pantry_id INTEGER REFERENCES pantries(id) ON DELETE CASCADE`);
            console.log("Added pantry_id to pantry_items.");
        } catch(e) {
            console.log("pantry_id might already exist.", e.message);
        }

        // 5. Migrate existing users
        const users = await pool.query('SELECT id, username FROM users');
        for (let user of users.rows) {
            // Check if user already has a default pantry
            let existing = await pool.query('SELECT id FROM pantries WHERE owner_id = $1 ORDER BY id ASC LIMIT 1', [user.id]);
            let pantryId;
            if (existing.rows.length === 0) {
                const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                const res = await pool.query(
                    'INSERT INTO pantries (name, share_code, owner_id) VALUES ($1, $2, $3) RETURNING id',
                    [`${user.username}'s Pantry`, code, user.id]
                );
                pantryId = res.rows[0].id;
                await pool.query('INSERT INTO pantry_members (pantry_id, user_id) VALUES ($1, $2)', [pantryId, user.id]);
            } else {
                pantryId = existing.rows[0].id;
            }

            // Set active pantry if null
            await pool.query('UPDATE users SET active_pantry_id = $1 WHERE id = $2 AND active_pantry_id IS NULL', [pantryId, user.id]);

            // Move items
            await pool.query('UPDATE pantry_items SET pantry_id = $1 WHERE user_id = $2 AND pantry_id IS NULL', [pantryId, user.id]);
        }
        console.log("Migrated users and items.");

        // 6. Update pantry_items unique constraint
        try {
            await pool.query('ALTER TABLE pantry_items DROP CONSTRAINT pantry_items_user_id_ingredient_id_key');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE pantry_items ADD CONSTRAINT pantry_items_pantry_id_ingredient_id_key UNIQUE (pantry_id, ingredient_id)');
        } catch (e) {}

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}

migrate();
