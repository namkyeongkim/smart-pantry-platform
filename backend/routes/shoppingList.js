const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Normalize ingredient names for duplicate checking
const normalizeName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase();
};

// GET all items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM shopping_list_items
       WHERE user_id = $1
       ORDER BY checked ASC, created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET shopping list error:', err);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// ADD from recipe with duplicate prevention
router.post('/from-recipe', authenticateToken, async (req, res) => {
  try {
    const { recipeId, missingIngredients } = req.body;

    console.log('POST /from-recipe body:', req.body);
    console.log('Authenticated user:', req.user);

    if (!Array.isArray(missingIngredients)) {
      return res.status(400).json({
        error: 'missingIngredients must be an array',
      });
    }

    const inserted = [];
    const skipped = [];

    for (const ing of missingIngredients) {
      let name = '';
      let quantity = null;
      let unit = null;

      if (typeof ing === 'string') {
        name = ing;
      } else if (typeof ing === 'object' && ing !== null) {
        name = ing.name || ing.original || '';
        quantity = ing.amount || ing.quantity || null;
        unit = ing.unit || null;
      }

      if (!name) continue;

      const normalizedName = normalizeName(name);

      // Skip if same item already exists in unchecked shopping list
      const existing = await pool.query(
        `SELECT id
         FROM shopping_list_items
         WHERE user_id = $1
           AND LOWER(TRIM(ingredient_name)) = $2
           AND checked = FALSE
         LIMIT 1`,
        [req.user.id, normalizedName]
      );

      if (existing.rows.length > 0) {
        skipped.push(name);
        continue;
      }

      const result = await pool.query(
        `INSERT INTO shopping_list_items
          (user_id, recipe_id, ingredient_name, quantity, unit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, recipeId || null, name.trim(), quantity, unit]
      );

      inserted.push(result.rows[0]);
    }

    res.json({
      inserted,
      skipped,
      message: 'Shopping list updated successfully',
    });
  } catch (err) {
    console.error('POST /from-recipe error:', err);
    res.status(500).json({
      error: err.message || 'Failed to add items',
    });
  }
});

// TOGGLE checked
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { checked } = req.body;

    const result = await pool.query(
      `UPDATE shopping_list_items
       SET checked = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [checked, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH shopping list error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM shopping_list_items
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE shopping list error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;