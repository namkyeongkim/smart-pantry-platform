const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;


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

// Allergen keywords for ingredient-level filtering
const NUT_KEYWORDS = ['peanut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'nut'];
const SEAFOOD_KEYWORDS = ['shrimp', 'prawn', 'lobster', 'crab', 'clam', 'mussel', 'oyster', 'scallop', 'squid', 'octopus', 'anchovy', 'sardine', 'tuna', 'salmon', 'cod', 'halibut', 'tilapia', 'fish', 'seafood'];

// Build Spoonacular diet & intolerance params from user flags
function buildSpoonacularDietParams(userFlags, manualRestrictions) {
  const diets = [];
  const intolerances = [];

  if (userFlags.includes('Vegetarian')) diets.push('vegetarian');
  if (userFlags.includes('Vegan')) diets.push('vegan');
  if (userFlags.includes('Gluten-Free')) intolerances.push('gluten');
  if (userFlags.includes('Dairy-Free')) intolerances.push('dairy');
  if (userFlags.includes('Nut-Allergy')) intolerances.push('peanut', 'tree nut');
  if (userFlags.includes('Seafood-Allergy')) intolerances.push('seafood', 'shellfish');

  // Also parse manual restrictions
  if (manualRestrictions) {
    const m = manualRestrictions.toLowerCase();
    if (m.includes('vegetarian') && !diets.includes('vegetarian')) diets.push('vegetarian');
    if (m.includes('vegan') && !diets.includes('vegan')) diets.push('vegan');
    if ((m.includes('gluten-free') || m.includes('gluten free')) && !intolerances.includes('gluten')) intolerances.push('gluten');
    if ((m.includes('dairy-free') || m.includes('dairy free')) && !intolerances.includes('dairy')) intolerances.push('dairy');
  }

  return {
    diet: diets.length > 0 ? diets.join(',') : undefined,
    intolerances: intolerances.length > 0 ? intolerances.join(',') : undefined
  };
}

// Save Spoonacular recipes to local DB for future searches
async function saveSpoonacularRecipes(recipes) {
  for (const r of recipes) {
    try {
      // Check if already exists
      const exists = await pool.query('SELECT id FROM recipes WHERE spoonacular_id = $1', [r.id]);
      if (exists.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO recipes (spoonacular_id, title, image, ready_in_minutes, servings, instructions, analyzed_instructions, extended_ingredients, vegetarian, vegan, gluten_free, dairy_free)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
        [
          r.id,
          r.title,
          r.image,
          r.readyInMinutes,
          r.servings,
          r.instructions || '',
          JSON.stringify(r.analyzedInstructions || []),
          JSON.stringify(r.extendedIngredients || []),
          r.vegetarian || false,
          r.vegan || false,
          r.glutenFree || false,
          r.dairyFree || false
        ]
      );
    } catch (err) {
      console.error(`Failed to save recipe ${r.id}:`, err.message);
    }
  }
}

/* =====================================================
   SEARCH RECIPES (Hybrid: Local DB + Spoonacular API)
===================================================== */
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { cuisine, maxCookTime, dietaryRestrictions } = req.body;
    const userId = req.user.id;

    // 1. Fetch user's saved dietary preferences
    const prefResult = await pool.query(
      `SELECT df.name
       FROM user_dietary_preferences udp
       JOIN dietary_flags df ON udp.dietary_flag_id = df.id
       WHERE udp.user_id = $1`,
      [userId]
    );
    const userFlags = prefResult.rows.map(r => r.name);

    // 2. Get user pantry for ingredient matching
    const pantryResult = await pool.query(
      `SELECT i.name
       FROM pantry_items pi
       JOIN ingredients i ON pi.ingredient_id = i.id
       WHERE pi.user_id = $1`,
      [userId]
    );
    const pantryNames = pantryResult.rows.map(i => i.name.toLowerCase());

    // 3. Build local DB query with dietary filters
    let query = `SELECT * FROM recipes WHERE ready_in_minutes <= $1`;
    const values = [maxCookTime];
    let paramIndex = 2;

    if (cuisine) {
      query += ` AND LOWER(title) LIKE LOWER($${paramIndex})`;
      values.push(`%${cuisine}%`);
      paramIndex++;
    }

    if (userFlags.includes('Vegetarian')) query += ` AND vegetarian = true`;
    if (userFlags.includes('Vegan')) query += ` AND vegan = true`;
    if (userFlags.includes('Gluten-Free')) query += ` AND gluten_free = true`;
    if (userFlags.includes('Dairy-Free')) query += ` AND dairy_free = true`;

    if (dietaryRestrictions) {
      const manual = dietaryRestrictions.toLowerCase();
      if (manual.includes('vegetarian')) query += ` AND vegetarian = true`;
      if (manual.includes('vegan')) query += ` AND vegan = true`;
      if (manual.includes('gluten-free') || manual.includes('gluten free')) query += ` AND gluten_free = true`;
      if (manual.includes('dairy-free') || manual.includes('dairy free')) query += ` AND dairy_free = true`;
    }

    query += ` LIMIT 50`;
    const localResult = await pool.query(query, values);

    // 4. Allergy-based ingredient filtering for local results
    const hasNutAllergy = userFlags.includes('Nut-Allergy');
    const hasSeafoodAllergy = userFlags.includes('Seafood-Allergy');

    let localRows = localResult.rows;
    if (hasNutAllergy || hasSeafoodAllergy) {
      localRows = localRows.filter(recipe => {
        const ingredients = recipe.extended_ingredients || [];
        const ingredientText = ingredients
          .map(ing => (typeof ing === 'string' ? ing : ing?.name || ing?.original || '').toLowerCase())
          .join(' ');
        if (hasNutAllergy && NUT_KEYWORDS.some(kw => ingredientText.includes(kw))) return false;
        if (hasSeafoodAllergy && SEAFOOD_KEYWORDS.some(kw => ingredientText.includes(kw))) return false;
        return true;
      });
    }

    // 5. Score local recipes by pantry match
    const scoreRecipe = (recipe, ingredientsList) => {
      const ingredients = ingredientsList || [];
      const missingIngredients = ingredients.filter(ing => {
        const words = splitWords(ing);
        return !hasAll(words, pantryNames);
      });
      const availableIngredients = ingredients.filter(ing => {
        const words = splitWords(ing);
        return hasAll(words, pantryNames);
      });
      const matchScore = ingredients.length === 0 ? 0 : availableIngredients.length / ingredients.length;
      return { missingIngredients, availableIngredients, matchScore };
    };

    let localRecipes = localRows.map(recipe => {
      const ingredients = recipe.extended_ingredients || [];
      const { missingIngredients, availableIngredients, matchScore } = scoreRecipe(recipe, ingredients);
      return {
        id: recipe.spoonacular_id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.ready_in_minutes,
        servings: recipe.servings,
        vegetarian: recipe.vegetarian,
        vegan: recipe.vegan,
        glutenFree: recipe.gluten_free,
        dairyFree: recipe.dairy_free,
        hasAllIngredients: missingIngredients.length === 0,
        missingIngredients,
        availableIngredients,
        matchScore,
        source: 'local'
      };
    });

    localRecipes.sort((a, b) => b.matchScore - a.matchScore);
    let finalRecipes = localRecipes.filter(r => r.matchScore > 0);

    // 6. If local results are fewer than 10, fetch more from Spoonacular API
    if (finalRecipes.length < 10 && SPOONACULAR_API_KEY) {
      try {
        console.log(`Local results: ${finalRecipes.length}. Fetching more from Spoonacular...`);

        const { diet, intolerances } = buildSpoonacularDietParams(userFlags, dietaryRestrictions);

        const spoonParams = {
          apiKey: SPOONACULAR_API_KEY,
          number: 15,
          maxReadyTime: maxCookTime,
          addRecipeInformation: true,
          fillIngredients: true,
          instructionsRequired: true,
        };

        // Send pantry items as preferred ingredients
        if (pantryNames.length > 0) {
          spoonParams.includeIngredients = pantryNames.slice(0, 10).join(',');
        }
        if (cuisine) spoonParams.cuisine = cuisine;
        if (diet) spoonParams.diet = diet;
        if (intolerances) spoonParams.intolerances = intolerances;

        const spoonResponse = await axios.get(
          'https://api.spoonacular.com/recipes/complexSearch',
          { params: spoonParams }
        );

        const spoonRecipes = spoonResponse.data.results || [];
        const existingIds = new Set(finalRecipes.map(r => r.id));

        // Save new recipes to local DB for future searches
        saveSpoonacularRecipes(spoonRecipes).catch(err =>
          console.error('Background save error:', err.message)
        );

        // Score and add Spoonacular recipes (deduplicating)
        for (const sr of spoonRecipes) {
          if (existingIds.has(sr.id)) continue;

          const ingredients = sr.extendedIngredients || [];
          const { missingIngredients, availableIngredients, matchScore } = scoreRecipe(sr, ingredients);

          finalRecipes.push({
            id: sr.id,
            title: sr.title,
            image: sr.image,
            readyInMinutes: sr.readyInMinutes,
            servings: sr.servings,
            vegetarian: sr.vegetarian || false,
            vegan: sr.vegan || false,
            glutenFree: sr.glutenFree || false,
            dairyFree: sr.dairyFree || false,
            hasAllIngredients: missingIngredients.length === 0,
            missingIngredients,
            availableIngredients,
            matchScore,
            source: 'spoonacular'
          });

          existingIds.add(sr.id);
        }

        // Re-sort with all recipes
        finalRecipes.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`After Spoonacular: ${finalRecipes.length} total results`);

      } catch (apiErr) {
        console.error('Spoonacular API fallback error:', apiErr.message);
        // Continue with local results only
      }
    }

    // If still no results with matchScore > 0, include all local recipes regardless of match
    if (finalRecipes.length === 0) {
      finalRecipes = localRecipes.slice(0, 10);
    }

    res.json(finalRecipes.slice(0, 15));

  } catch (err) {
    console.error('Search error:', err.message);
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