const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Categorize ingredients by name keywords
function categorize(name) {
  const n = name.toLowerCase();
  if (['chicken', 'beef', 'pork', 'sausage', 'turkey', 'lamb', 'bacon', 'ham', 'meat', 'steak'].some(k => n.includes(k))) return 'Meat & Poultry';
  if (['salmon', 'tuna', 'shrimp', 'fish', 'cod', 'lobster', 'crab', 'prawn', 'anchovy', 'seafood'].some(k => n.includes(k))) return 'Seafood';
  if (['milk', 'cheese', 'butter', 'cream', 'yogurt', 'parmesan', 'mozzarella', 'ricotta', 'egg'].some(k => n.includes(k))) return 'Dairy & Eggs';
  if (['tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'zucchini', 'squash', 'mushroom', 'avocado', 'corn', 'pea', 'bean', 'lentil', 'celery', 'cucumber', 'kale', 'chard', 'arugula', 'scallion', 'leek', 'asparagus', 'eggplant', 'cabbage', 'turnip'].some(k => n.includes(k))) return 'Vegetables';
  if (['apple', 'banana', 'lemon', 'lime', 'orange', 'berry', 'cherry', 'mango', 'pineapple', 'grape', 'peach', 'pear', 'watermelon', 'strawberry', 'blueberry', 'raspberry'].some(k => n.includes(k))) return 'Fruits';
  if (['salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'oregano', 'basil', 'thyme', 'rosemary', 'parsley', 'cilantro', 'sage', 'dill', 'chili powder', 'turmeric', 'ginger', 'nutmeg', 'clove', 'coriander', 'bay leaf', 'saffron', 'suya'].some(k => n.includes(k))) return 'Spices & Herbs';
  if (['oil', 'olive oil', 'vinegar', 'soy sauce', 'sauce', 'ketchup', 'mustard', 'mayo', 'dressing', 'enchilada'].some(k => n.includes(k))) return 'Oils & Condiments';
  if (['rice', 'pasta', 'flour', 'bread', 'noodle', 'quinoa', 'oat', 'cereal', 'tortilla', 'crumb', 'gnocchi', 'spaghetti', 'penne', 'rigatoni', 'farfalle', 'cavatelli', 'fusilli', 'linguine', 'capellini'].some(k => n.includes(k))) return 'Grains & Pasta';
  if (['sugar', 'honey', 'syrup', 'cocoa', 'chocolate', 'vanilla', 'cacao', 'peanut butter', 'jam', 'jelly', 'fudge'].some(k => n.includes(k))) return 'Baking & Sweets';
  if (['water', 'broth', 'stock', 'juice', 'wine', 'beer', 'coconut milk', 'almond milk'].some(k => n.includes(k))) return 'Liquids';
  if (['almond', 'walnut', 'cashew', 'peanut', 'pecan', 'pistachio', 'nut', 'seed', 'pine nut', 'chia'].some(k => n.includes(k))) return 'Nuts & Seeds';
  return 'Other';
}

// Guess a sensible unit for an ingredient
function guessUnit(name) {
  const n = name.toLowerCase();
  if (['chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'salmon', 'tuna', 'fish', 'shrimp', 'pasta', 'rice', 'flour', 'sugar', 'quinoa'].some(k => n.includes(k))) return 'grams';
  if (['oil', 'vinegar', 'sauce', 'milk', 'cream', 'broth', 'stock', 'juice', 'water', 'wine', 'honey', 'syrup', 'yogurt'].some(k => n.includes(k))) return 'ml';
  if (['salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'oregano', 'thyme', 'turmeric', 'nutmeg', 'chili powder', 'ginger', 'suya'].some(k => n.includes(k))) return 'tsp';
  if (['egg', 'tomato', 'onion', 'garlic', 'lemon', 'lime', 'avocado', 'potato', 'carrot', 'apple', 'banana', 'pepper', 'mushroom', 'zucchini', 'cucumber', 'celery'].some(k => n.includes(k))) return 'pieces';
  return 'pieces';
}

// GET ingredient suggestions (master list for autocomplete)
router.get('/ingredients', authenticateToken, async (req, res) => {
  try {
    // 1. Get names from ingredients table
    const ingResult = await pool.query('SELECT DISTINCT LOWER(name) as name, default_unit FROM ingredients ORDER BY name');

    // 2. Get unique ingredient names from all recipes
    const recipeResult = await pool.query('SELECT extended_ingredients FROM recipes');

    const nameMap = new Map(); // name -> { name, unit, category }

    // Add from recipes first (these are the "correct" names that match)
    recipeResult.rows.forEach(row => {
      const ings = row.extended_ingredients || [];
      ings.forEach(ing => {
        if (typeof ing === 'object' && ing.name) {
          const n = ing.name.toLowerCase().trim();
          if (n && n.length > 1 && !nameMap.has(n)) {
            const unit = ing.unit || guessUnit(n);
            nameMap.set(n, { name: n, unit, category: categorize(n) });
          }
        }
      });
    });

    // Add from ingredients table (fill gaps)
    ingResult.rows.forEach(row => {
      const n = row.name.toLowerCase().trim();
      if (n && n.length > 1 && !nameMap.has(n)) {
        nameMap.set(n, { name: n, unit: row.default_unit || guessUnit(n), category: categorize(n) });
      }
    });

    // Sort alphabetically and return
    const suggestions = [...nameMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    res.json(suggestions);
  } catch (err) {
    console.error('Ingredient suggestions error:', err.message);
    res.status(500).json({ error: 'Failed to get ingredient suggestions' });
  }
});

// Get all pantry items for logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Getting pantry for user:', userId);
        const result = await pool.query(
            `SELECT pi.id, i.name, pi.quantity, pi.unit, pi.updated_at as created_at
             FROM pantry_items pi
             JOIN ingredients i ON pi.ingredient_id = i.id
             WHERE pi.user_id = $1
             ORDER BY pi.updated_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Pantry get error:', err);
        res.status(500).json({ error: 'Failed to fetch pantry items' });
    }
});

// Add pantry item
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, quantity, unit } = req.body;
        const userId = req.user.id;
        console.log('Adding item for user:', userId);

        // First, check if ingredient exists, if not create it
        let ingredientResult = await pool.query(
            'SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1)',
            [name]
        );

        let ingredientId;
        if (ingredientResult.rows.length === 0) {
            // Create new ingredient
            const newIngredient = await pool.query(
                'INSERT INTO ingredients (name, default_unit) VALUES ($1, $2) RETURNING id',
                [name, unit]
            );
            ingredientId = newIngredient.rows[0].id;
        } else {
            ingredientId = ingredientResult.rows[0].id;
        }

        // Check if user already has this ingredient in pantry
        const existingItem = await pool.query(
            'SELECT id FROM pantry_items WHERE user_id = $1 AND ingredient_id = $2',
            [userId, ingredientId]
        );

        let result;
        if (existingItem.rows.length > 0) {
            // Update existing quantity
            result = await pool.query(
                `UPDATE pantry_items 
                 SET quantity = quantity + $1, unit = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $3 AND ingredient_id = $4
                 RETURNING id, quantity, unit`,
                [quantity, unit, userId, ingredientId]
            );
        } else {
            // Insert new pantry item
            result = await pool.query(
                `INSERT INTO pantry_items (user_id, ingredient_id, quantity, unit)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, quantity, unit`,
                [userId, ingredientId, quantity, unit]
            );
        }

        // Return with ingredient name
        res.status(201).json({
            id: result.rows[0].id,
            name: name,
            quantity: result.rows[0].quantity,
            unit: result.rows[0].unit
        });
    } catch (err) {
        console.error('Pantry add error:', err);
        res.status(500).json({ error: 'Failed to add pantry item' });
    }
});

// Update pantry item quantity (partial removal)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        if (quantity === undefined || isNaN(quantity)) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        const qty = parseFloat(quantity);

        if (qty <= 0) {
            // Delete the item if quantity hits 0 or below
            await pool.query(
                'DELETE FROM pantry_items WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            return res.json({ message: 'Item removed (quantity reached zero)' });
        }

        const result = await pool.query(
            `UPDATE pantry_items
             SET quantity = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING id, quantity, unit`,
            [qty, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Pantry update error:', err);
        res.status(500).json({ error: 'Failed to update pantry item' });
    }
});

// Delete pantry item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        console.log('Deleting item for user:', userId);

        await pool.query(
            'DELETE FROM pantry_items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Pantry delete error:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router;