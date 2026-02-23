const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1️⃣ Add favorite
router.post('/', async (req, res) => {
  const { userId, recipeId, title, image } = req.body;

  try {
    await pool.query(
      `INSERT INTO favorites (user_id, recipe_id, recipe_title, recipe_image)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, recipe_id) DO NOTHING`,
      [userId, recipeId, title, image]
    );

    res.json({ message: "Added to favorites ❤️" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// 2️⃣ Get favorites
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// 3️⃣ Remove favorite
router.delete('/:recipeId', async (req, res) => {
  const recipeId = parseInt(req.params.recipeId); 
  const userId = 1;

  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    res.json({ message: "Removed from favorites 💔" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});
module.exports = router;//

