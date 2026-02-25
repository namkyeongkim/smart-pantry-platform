const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Mock recipes for fallback when API limit is reached
const MOCK_RECIPES = [
    {
        id: 1,
        title: "Spicy Bean Rice Bowl (Mock)",
        image: "https://spoonacular.com/recipeImages/661188-312x231.jpg",
        readyInMinutes: 45,
        servings: 2,
        missedIngredientCount: 2,
        usedIngredientCount: 2,
        extendedIngredients: ["1 cup Rice", "1 can Black Beans", "1 jar Salsa", "1 Avocado"],
        missedIngredients: ["Salsa", "Avocado"],
        analyzedInstructions: [{ steps: [{ step: "Cook rice." }, { step: "Mix beans and salsa." }, { step: "Serve with avocado." }] }],
        summary: "A delicious mock recipe because the API limit was reached."
    },
    {
        id: 2,
        title: "Chicken Pasta (Mock)",
        image: "https://spoonacular.com/recipeImages/654959-312x231.jpg",
        readyInMinutes: 30,
        servings: 2,
        missedIngredientCount: 1,
        usedIngredientCount: 1,
        extendedIngredients: ["8 oz Pasta", "1 lb Chicken Breast", "1 jar Tomato Sauce"],
        missedIngredients: ["Tomato Sauce"],
        analyzedInstructions: [{ steps: [{ step: "Boil pasta." }, { step: "Cook chicken." }, { step: "Mix everything." }] }],
        summary: "Another mock recipe."
    }
];

// Search recipes based on pantry and preferences
router.post('/search', authenticateToken, async (req, res) => {
    try {
        const { cuisine, maxCookTime, dietaryRestrictions } = req.body;
        const userId = req.user.id;

        // Get user's pantry items using the correct schema
        const pantryResult = await pool.query(
            `SELECT i.name 
             FROM pantry_items pi
             JOIN ingredients i ON pi.ingredient_id = i.id
             WHERE pi.user_id = $1`,
            [userId]
        );

        const ingredients = pantryResult.rows.map(row => row.name).join(',');

        if (!ingredients) {
            return res.json([]);
        }

        // Build Spoonacular API URL
        let apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${ingredients}&number=10&ranking=1`;

        // Call Spoonacular API
        try {
            const response = await axios.get(apiUrl);
            let recipes = response.data;

            // Filter by cook time and cuisine if provided
            if (maxCookTime || cuisine || dietaryRestrictions) {
                const detailedRecipes = await Promise.all(
                    recipes.slice(0, 5).map(async (recipe) => {
                        const detailRes = await axios.get(
                            `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${SPOONACULAR_API_KEY}`
                        );
                        return detailRes.data;
                    })
                );

                // Parse dietary restrictions into a lowercase array
                const dietaryFlags = dietaryRestrictions
                    ? dietaryRestrictions.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
                    : [];

                recipes = detailedRecipes.filter(recipe => {
                    if (maxCookTime && recipe.readyInMinutes > maxCookTime) return false;
                    if (cuisine && cuisine !== 'All' && !recipe.cuisines.includes(cuisine)) return false;

                    // Check each dietary restriction against Spoonacular flags
                    for (const flag of dietaryFlags) {
                        if ((flag === 'vegetarian') && !recipe.vegetarian) return false;
                        if (flag === 'vegan' && !recipe.vegan) return false;
                        if ((flag === 'gluten-free' || flag === 'glutenfree') && !recipe.glutenFree) return false;
                        if ((flag === 'dairy-free' || flag === 'dairyfree') && !recipe.dairyFree) return false;
                    }

                    return true;
                });
            }

            res.json(recipes);
        } catch (apiErr) {
            if (apiErr.response && apiErr.response.status === 402) {
                console.warn('⚠️ API Limit Reached. Serving Mock Data.');
                return res.json(MOCK_RECIPES);
            }
            throw apiErr;
        }
    } catch (err) {
        console.error('Recipe search error:', err.message);
        res.status(500).json({ error: 'Failed to search recipes' });
    }
});

// Search recipes based on keyword/mood (Integrated from friend's backend)
router.post('/search-mood', authenticateToken, async (req, res) => {
    const { mood, servings } = req.body;
    const query = mood || "dinner";

    try {
        const apiResponse = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
            params: {
                query: query,
                number: 5,
                addRecipeInformation: true,
                fillIngredients: true,
                apiKey: SPOONACULAR_API_KEY,
                instructionsRequired: true,
            }
        });

        const recipes = apiResponse.data.results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            missedIngredientCount: recipe.missedIngredientCount,
            usedIngredientCount: recipe.usedIngredientCount,
            extendedIngredients: recipe.extendedIngredients ? recipe.extendedIngredients.map(i => i.original) : [],
            missedIngredients: recipe.missedIngredients ? recipe.missedIngredients.map(i => i.name) : [],
            analyzedInstructions: recipe.analyzedInstructions,
            summary: recipe.summary
        }));

        res.json(recipes);

    } catch (err) {
        if (err.response && err.response.status === 402) {
            console.warn('⚠️ API Limit Reached. Serving Mock Data.');
            return res.json(MOCK_RECIPES);
        }
        console.error("Error in /api/recipes/search-mood:", err.message);
        res.status(500).json({ error: "Failed to fetch mood-based recipes" });
    }
});

// Cook a recipe (deduct ingredients from pantry)
router.post('/cook', authenticateToken, async (req, res) => {
    try {
        const { recipeId } = req.body;
        const userId = req.user.id;

        // Get recipe details from Spoonacular
        const recipeRes = await axios.get(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`
        );
        const recipe = recipeRes.data;

        // Deduct ingredients from pantry using correct schema
        for (const ingredient of recipe.extendedIngredients) {
            // Find ingredient ID
            const ingResult = await pool.query(
                'SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1)',
                [ingredient.name]
            );

            if (ingResult.rows.length > 0) {
                const ingredientId = ingResult.rows[0].id;

                // Update pantry quantity
                await pool.query(
                    `UPDATE pantry_items 
                     SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $2 AND ingredient_id = $3 AND quantity >= $1`,
                    [ingredient.amount, userId, ingredientId]
                );
            }
        }

        // Remove items with 0 or negative quantity
        await pool.query(
            'DELETE FROM pantry_items WHERE user_id = $1 AND quantity <= 0',
            [userId]
        );

        // Log cooking history
        await pool.query(
            'INSERT INTO cooking_history (user_id, recipe_title, recipe_id) VALUES ($1, $2, $3)',
            [userId, recipe.title, recipeId.toString()]
        );

        res.json({ message: 'Recipe cooked successfully!' });
    } catch (err) {
        console.error('Cook recipe error:', err.message);
        res.status(500).json({ error: 'Failed to cook recipe' });
    }
});

module.exports = router;
