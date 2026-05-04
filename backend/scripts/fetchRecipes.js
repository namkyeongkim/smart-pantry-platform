require('dotenv').config();
const axios = require('axios');
const pool = require('../db');

const API_KEY = process.env.SPOONACULAR_API_KEY;

// Keywords to fetch different recipe categories
const keywords = ['pasta', 'chicken', 'breakfast', 'vegetarian', 'dessert'];

const fetchAndStoreRecipes = async () => {
  try {
    for (const keyword of keywords) {
      console.log(`Fetching recipes for: ${keyword}`);

      // Step 1: Search recipes by keyword
      const searchRes = await axios.get(
        'https://api.spoonacular.com/recipes/complexSearch',
        {
          params: {
            query: keyword,
            number: 100, 
            apiKey: API_KEY,
          },
        }
      );

      const recipes = searchRes.data.results;

      for (const recipe of recipes) {
        console.log(`Getting detail for: ${recipe.title}`);

        // Step 2: Get detailed recipe information
        const detailRes = await axios.get(
          `https://api.spoonacular.com/recipes/${recipe.id}/information`,
          {
            params: { apiKey: API_KEY },
          }
        );

        const detail = detailRes.data;

        // Step 3: Insert recipe into database
        await pool.query(
          `
          INSERT INTO recipes (
            spoonacular_id,
            title,
            image,
            ready_in_minutes,
            servings,
            instructions,
            analyzed_instructions,
            extended_ingredients
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (spoonacular_id) DO NOTHING
          `,
          [
            detail.id,
            detail.title,
            detail.image,
            detail.readyInMinutes,
            detail.servings,
            detail.instructions,
            JSON.stringify(detail.analyzedInstructions),
            JSON.stringify(detail.extendedIngredients),
          ]
        );

        console.log(`Saved: ${detail.title}`);
      }
    }

    console.log('All recipes saved successfully.');
    process.exit();
  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    process.exit(1);
  }
};

fetchAndStoreRecipes();