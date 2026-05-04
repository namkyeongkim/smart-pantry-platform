const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - ORDER MATTERS!
app.use(cors());
app.use(express.json());


// Import Routes
const userRoutes = require('./routes/users');
const pantryRoutes = require('./routes/pantry');
const recipeRoutes = require('./routes/recipes');
const favoriteRoutes = require('./routes/favorites');

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('Pantry Manager API is running');
});

// Database Connection Test
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: 'Database connected successfully', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
