const express = require('express');
const router = express.Router();
const db = require('../db');

// Get overall system statistics
router.get('/stats', async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) FROM users');
    const recipes = await db.query('SELECT COUNT(*) FROM recipes');
    const pantry = await db.query('SELECT COUNT(*) FROM pantry_items');
    const favorites = await db.query('SELECT COUNT(*) FROM favorites');

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalRecipes: parseInt(recipes.rows[0].count),
      totalPantryItems: parseInt(pantry.rows[0].count),
      totalFavorites: parseInt(favorites.rows[0].count),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get top popular recipes
router.get('/recipes/top', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        recipe_id,
        title,
        COUNT(*) AS favorite_count
      FROM favorites
      GROUP BY recipe_id, title
      ORDER BY favorite_count DESC, title ASC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Top recipes error:', error);
    res.status(500).json({ error: 'Failed to fetch top recipes' });
  }
});

// Get all recipes sorted by popularity
router.get('/recipes', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        recipe_id,
        title,
        COUNT(*) AS favorite_count,
        MAX(created_at) AS last_favorited_at
      FROM favorites
      GROUP BY recipe_id, title
      ORDER BY favorite_count DESC, title ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Recipes error:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get low stock pantry items
router.get('/pantry/low-stock', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.name, p.quantity
      FROM pantry_items p
      JOIN ingredients i ON p.ingredient_id = i.id
      WHERE p.quantity <= 2
      ORDER BY p.quantity ASC, i.name ASC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Get pantry overview across all users
router.get('/pantry', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        i.name,
        SUM(p.quantity) AS total_quantity,
        p.unit,
        COUNT(DISTINCT p.user_id) AS user_count
      FROM pantry_items p
      JOIN ingredients i ON p.ingredient_id = i.id
      GROUP BY i.name, p.unit
      ORDER BY SUM(p.quantity) DESC, i.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Pantry overview error:', error);
    res.status(500).json({ error: 'Failed to fetch pantry overview' });
  }
});

// Get user list with basic activity information
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        COUNT(DISTINCT p.id) AS pantry_count,
        COUNT(DISTINCT f.id) AS favorite_count
      FROM users u
      LEFT JOIN pantry_items p ON u.id = p.user_id
      LEFT JOIN favorites f ON u.id = f.user_id
      GROUP BY u.id, u.username, u.email, u.created_at
      ORDER BY u.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get simple growth data based on user signups
router.get('/growth', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        DATE(created_at) AS signup_date,
        COUNT(*) AS signup_count
      FROM users
      WHERE created_at IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY signup_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Growth error:', error);
    res.status(500).json({ error: 'Failed to fetch growth data' });
  }
});

module.exports = router;