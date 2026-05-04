const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const sharedPantryService = require('../shared_pantry_service');

// Get active shared pantry
router.get('/', authenticateToken, (req, res) => {
    try {
        const pantry = sharedPantryService.getJoinedPantry(req.user.id);
        res.json(pantry || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create shared pantry
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const code = await sharedPantryService.createPantry(req.user.id, name);
        res.json({ code });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Join shared pantry
router.post('/join', authenticateToken, (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });
        const name = sharedPantryService.joinPantry(req.user.id, code);
        res.json({ name });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Leave shared pantry (go back to personal)
router.post('/leave', authenticateToken, (req, res) => {
    try {
        sharedPantryService.leavePantry(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
