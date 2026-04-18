const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

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

// Associate UPC with pantry item
router.patch('/:id/upc', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { upc } = req.body;
        const userId = req.user.id;
        console.log('Associating UPC with pantry item:', id, upc);

        // First get the ingredient_id from the pantry item
        const pantryResult = await pool.query(
            'SELECT ingredient_id FROM pantry_items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (pantryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pantry item not found' });
        }

        const ingredientId = pantryResult.rows[0].ingredient_id;

        // Update the ingredient with the UPC
        await pool.query(
            'UPDATE ingredients SET upc = $1 WHERE id = $2',
            [upc, ingredientId]
        );

        res.json({ message: 'UPC associated successfully' });
    } catch (err) {
        console.error('UPC association error:', err);
        res.status(500).json({ error: 'Failed to associate UPC' });
    }
});

module.exports = router;