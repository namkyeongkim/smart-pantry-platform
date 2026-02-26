const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');


// Normalize ingredient text
function normalize(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/for .*$/i, '')      // remove "for garnish"
    .replace(/to taste/i, '')
    .replace(/[0-9\/]+/g, '')
    .replace(
      /\b(cup|cups|tbsp|tsp|tablespoon|teaspoon|oz|ounce|ounces|kg|g|gram|grams|fresh|chopped|diced|minced|small|large|medium)\b/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

// Split compound ingredients
function splitWords(ingredient) {
  const raw =
    typeof ingredient === 'string'
      ? ingredient
      : ingredient?.name || ingredient?.original || '';

  const cleaned = normalize(raw);

  if (!cleaned) return [];

  return cleaned
    .split(/,|and/gi)
    .map(w => w.trim())
    .filter(Boolean);
}

// Check if ALL words exist in pantry
function hasAll(words, pantry) {
  return words.every(word =>
    pantry.some(p =>
      p === word ||
      p === word.replace(/s$/, '') ||
      word === p.replace(/s$/, '')
    )
  );
}

// Check if ANY word exists in pantry
function hasAny(words, pantry) {
  return words.some(word =>
    pantry.some(p =>
      p === word ||
      p === word.replace(/s$/, '') ||
      word === p.replace(/s$/, '')
    )
  );
}

/* =====================================================
   SEARCH RECIPES (Pantry-based ranking)
===================================================== */
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { cuisine, maxCookTime } = req.body;
    const userId = req.user.id;

    let query = `
      SELECT * FROM recipes
      WHERE ready_in_minutes <= $1
    `;

    const values = [maxCookTime];
    let paramIndex = 2;

    if (cuisine) {
      query += ` AND LOWER(title) LIKE LOWER($${paramIndex})`;
      values.push(`%${cuisine}%`);
      paramIndex++;
    }

    query += ` LIMIT 30`;

    const result = await pool.query(query, values);

    const pantryResult = await pool.query(
      `SELECT i.name
       FROM pantry_items pi
       JOIN ingredients i ON pi.ingredient_id = i.id
       WHERE pi.user_id = $1`,
      [userId]
    );

    const pantryNames = pantryResult.rows.map(i =>
      i.name.toLowerCase()
    );

    const recipes = result.rows.map(recipe => {
      const ingredients = recipe.extended_ingredients || [];

      const missingIngredients = ingredients.filter(ing => {
        const words = splitWords(ing);
        return !hasAll(words, pantryNames);
      });

      const availableIngredients = ingredients.filter(ing => {
        const words = splitWords(ing);
        return hasAll(words, pantryNames);
      });

      const matchScore =
        ingredients.length === 0
          ? 0
          : availableIngredients.length / ingredients.length;

      return {
        id: recipe.spoonacular_id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.ready_in_minutes,
        servings: recipe.servings,
        hasAllIngredients: missingIngredients.length === 0,
        missingIngredients,
        availableIngredients,
        matchScore
      };
    });
    recipes.sort((a, b) => b.matchScore - a.matchScore);

    const filtered = recipes.filter(r => r.matchScore > 0);

    res.json(filtered.slice(0, 10));

  } catch (err) {
    console.error('Search DB error:', err.message);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

/* =====================================================
   COOK RECIPE (deduct ingredients from pantry)
===================================================== */
router.post('/cook', authenticateToken, async (req, res) => {
  const { recipeId } = req.body;
  const userId = req.user.id;

  if (!recipeId) {
    return res.status(400).json({ error: 'recipeId is required' });
  }

  try {
    // 1. Look up the recipe
    const recipeResult = await pool.query(
      'SELECT * FROM recipes WHERE spoonacular_id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];
    const ingredients = recipe.extended_ingredients || [];

    // 2. Get user pantry items with ingredient names
    const pantryResult = await pool.query(
      `SELECT pi.id, i.name, pi.quantity, pi.unit
       FROM pantry_items pi
       JOIN ingredients i ON pi.ingredient_id = i.id
       WHERE pi.user_id = $1`,
      [userId]
    );

    const pantryItems = pantryResult.rows;
    const updatedItems = [];
    const removedItems = [];

    // 3. For each recipe ingredient, find matching pantry item and deduct
    for (const ing of ingredients) {
      const words = splitWords(ing);

      // Find a matching pantry item
      const matchedPantry = pantryItems.find(p => {
        const pName = p.name.toLowerCase();
        return words.some(word =>
          pName === word ||
          pName === word.replace(/s$/, '') ||
          word === pName.replace(/s$/, '')
        );
      });

      if (matchedPantry) {
        // Deduct 1 unit (since recipe ingredients don't always have exact amounts mapped)
        const newQty = Math.max(0, matchedPantry.quantity - 1);

        if (newQty <= 0) {
          // Remove the item entirely
          await pool.query(
            'DELETE FROM pantry_items WHERE id = $1 AND user_id = $2',
            [matchedPantry.id, userId]
          );
          removedItems.push(matchedPantry.name);
        } else {
          await pool.query(
            `UPDATE pantry_items
             SET quantity = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3`,
            [newQty, matchedPantry.id, userId]
          );
          updatedItems.push({ name: matchedPantry.name, newQuantity: newQty });
        }

        // Update local copy so we don't double-deduct the same item
        matchedPantry.quantity = newQty;
      }
    }

    res.json({
      message: `${recipe.title} cooked successfully!`,
      updatedItems,
      removedItems
    });

  } catch (err) {
    console.error('Cook recipe error:', err.message);
    res.status(500).json({ error: 'Failed to cook recipe' });
  }
});

/* =====================================================
   GET FULL RECIPE DETAIL
===================================================== */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM recipes WHERE spoonacular_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = result.rows[0];
    const ingredients = recipe.extended_ingredients || [];

    const pantryResult = await pool.query(
      `SELECT i.name
       FROM pantry_items pi
       JOIN ingredients i ON pi.ingredient_id = i.id
       WHERE pi.user_id = $1`,
      [userId]
    );

    const pantryNames = pantryResult.rows.map(i =>
      i.name.toLowerCase()
    );

    const missingIngredients = ingredients.filter(ing => {
      const words = splitWords(ing);
      return !hasAll(words, pantryNames);
    });

    const availableIngredients = ingredients.filter(ing => {
      const words = splitWords(ing);
      return hasAll(words, pantryNames);
    });

    const hasAllIngredients = missingIngredients.length === 0;

    res.json({
      id: recipe.spoonacular_id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.ready_in_minutes,
      servings: recipe.servings,
      instructions: recipe.instructions,
      analyzedInstructions: recipe.analyzed_instructions || [],
      extendedIngredients: ingredients,
      hasAllIngredients,
      missingIngredients,
      availableIngredients
    });

  } catch (err) {
    console.error('Recipe detail DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});

module.exports = router;