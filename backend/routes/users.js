const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this_in_production';

// Validation helper functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return errors;
};

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate username
        if (username.trim().length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password strength
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ error: passwordErrors.join('. ') });
        }

        // Check if user already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            const existingUser = userExists.rows[0];
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username.trim(), email.trim(), hashedPassword]
        );

        res.json({
            message: 'User registered successfully',
            user: newUser.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if user exists
        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email },
            JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.rows[0].id,
                username: user.rows[0].username,
                email: user.rows[0].email
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user dietary preferences
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT df.name
             FROM user_dietary_preferences udp
             JOIN dietary_flags df ON udp.dietary_flag_id = df.id
             WHERE udp.user_id = $1`,
            [userId]
        );
        const flags = result.rows.map(r => r.name);
        res.json({ flags });
    } catch (err) {
        console.error('Get preferences error:', err.message);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

// Set user dietary preferences (full replace)
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { flags = [] } = req.body;

        // Clear existing preferences
        await pool.query(
            'DELETE FROM user_dietary_preferences WHERE user_id = $1',
            [userId]
        );

        if (flags.length > 0) {
            // Look up flag IDs and insert new preferences
            for (const flagName of flags) {
                const flagResult = await pool.query(
                    'SELECT id FROM dietary_flags WHERE LOWER(name) = LOWER($1)',
                    [flagName]
                );
                if (flagResult.rows.length > 0) {
                    await pool.query(
                        'INSERT INTO user_dietary_preferences (user_id, dietary_flag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [userId, flagResult.rows[0].id]
                    );
                }
            }
        }

        res.json({ message: 'Preferences updated successfully', flags });
    } catch (err) {
        console.error('Update preferences error:', err.message);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;
