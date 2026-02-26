const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// GET all favorites for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// ADD favorite
router.post('/', authenticateToken, async (req, res) => {
  const { recipe_id, title, image } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, recipe_id, title, image)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, recipe_id) DO NOTHING
       RETURNING *`,
      [req.user.id, recipe_id, title, image]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE favorite
router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [req.user.id, req.params.recipeId]
    );

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('Delete favorite error:', err);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

module.exports = router;