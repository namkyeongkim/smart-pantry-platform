<<<<<<< Updated upstream
<<<<<<< Updated upstream
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database Connection
// Ensure you create a .env file with DATABASE_URL=postgres://user:password@localhost:5432/pantry_app
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Root Route for easy verification
app.get('/', (req, res) => {
  res.send('Pantry Pal Backend is Running! 🥣');
});

// Mock Recipe for PoC
const MOCK_RECIPE = {
  id: 1,
  title: "Spicy Bean Rice Bowl",
  ingredients: ["Rice", "Black Beans", "Salsa", "Avocado"] // Requires Avocado
};

// API Endpoint: Get Recommendations
// API Endpoint: Get Recommendations
app.post('/api/recommend', async (req, res) => {
  const { userId, mood, servings } = req.body;

  try {
    // 1. Fetch User's Pantry from DB (Optional for complexSearch but good for context if we want to includeIngredients later)
    const result = await pool.query(
      'SELECT ingredient_name FROM pantry_inventory WHERE user_id = $1',
      [userId]
    );

    const pantryItems = result.rows.map(row => row.ingredient_name).join(',');
    console.log(`User ${userId} pantry:`, pantryItems);
    console.log(`Search Request - Mood: ${mood}, Servings: ${servings}`);

    // 2. Call Spoonacular API (complexSearch)
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error("Spoonacular API Key is missing or invalid.");
    }

    // Default to "dinner" if mood is empty
    const query = mood || "dinner";
    const numServings = servings || 2;

    const apiResponse = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        query: query,
        // includeIngredients: pantryItems, // Optional: verify if we want to enforce pantry items or just search by mood
        number: 5, // Get 5 results
        addRecipeInformation: true, // Needed for instructions and readyInMinutes
        fillIngredients: true, // Needed for used/missed ingredients info
        apiKey: apiKey,
        instructionsRequired: true,
      }
    });

    if (apiResponse.data.results.length === 0) {
      return res.json({
        recipes: [],
        message: "No recipes found. Try a different search term!"
      });
    }

    // 3. Transform Data for Frontend
    const recipes = apiResponse.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      missedIngredientCount: recipe.missedIngredientCount,
      usedIngredientCount: recipe.usedIngredientCount,
      // Use extendedIngredients for full details (amount + unit + name)
      extendedIngredients: recipe.extendedIngredients ? recipe.extendedIngredients.map(i => i.original) : [],
      // Keep these for backward compatibility if needed, or for "missing" logic
      missedIngredients: recipe.missedIngredients ? recipe.missedIngredients.map(i => i.name) : [],
      analyzedInstructions: recipe.analyzedInstructions,
      summary: recipe.summary
    }));

    // 4. Return Response
    res.json({
      recipes: recipes,
      message: `Found ${recipes.length} recipes for "${query}"`
    });

  } catch (err) {
    console.error("Error in /api/recommend:", err.message);
    if (err.response) {
      console.error("API Response:", err.response.data);

      // Fallback to Mock Data if API Limit Reached (402)
      if (err.response.status === 402) {
        console.log("⚠️ API Limit Reached. Serving Mock Data.");
        const mockRecipes = [
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

        return res.json({
          recipes: mockRecipes,
          message: "API Limit Reached - Showing Mock Recipes for Demo"
        });
      }
    }
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
=======
=======
const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database Connection
// Ensure you create a .env file with DATABASE_URL=postgres://user:password@localhost:5432/pantry_app
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Root Route for easy verification
app.get('/', (req, res) => {
  res.send('Pantry Pal Backend is Running! 🥣');
});

// Mock Recipe for PoC
const MOCK_RECIPE = {
  id: 1,
  title: "Spicy Bean Rice Bowl",
  ingredients: ["Rice", "Black Beans", "Salsa", "Avocado"] // Requires Avocado
};

// API Endpoint: Get Recommendations
// API Endpoint: Get Recommendations
app.post('/api/recommend', async (req, res) => {
  const { userId, mood, servings } = req.body;

  try {
    // 1. Fetch User's Pantry from DB (Optional for complexSearch but good for context if we want to includeIngredients later)
    const result = await pool.query(
      'SELECT ingredient_name FROM pantry_inventory WHERE user_id = $1',
      [userId]
    );

    const pantryItems = result.rows.map(row => row.ingredient_name).join(',');
    console.log(`User ${userId} pantry:`, pantryItems);
    console.log(`Search Request - Mood: ${mood}, Servings: ${servings}`);

    // 2. Call Spoonacular API (complexSearch)
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error("Spoonacular API Key is missing or invalid.");
    }

    // Default to "dinner" if mood is empty
    const query = mood || "dinner";
    const numServings = servings || 2;

    const apiResponse = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        query: query,
        // includeIngredients: pantryItems, // Optional: verify if we want to enforce pantry items or just search by mood
        number: 5, // Get 5 results
        addRecipeInformation: true, // Needed for instructions and readyInMinutes
        fillIngredients: true, // Needed for used/missed ingredients info
        apiKey: apiKey,
        instructionsRequired: true,
      }
    });

    if (apiResponse.data.results.length === 0) {
      return res.json({
        recipes: [],
        message: "No recipes found. Try a different search term!"
      });
    }

    // 3. Transform Data for Frontend
    const recipes = apiResponse.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      missedIngredientCount: recipe.missedIngredientCount,
      usedIngredientCount: recipe.usedIngredientCount,
      // Use extendedIngredients for full details (amount + unit + name)
      extendedIngredients: recipe.extendedIngredients ? recipe.extendedIngredients.map(i => i.original) : [],
      // Keep these for backward compatibility if needed, or for "missing" logic
      missedIngredients: recipe.missedIngredients ? recipe.missedIngredients.map(i => i.name) : [],
      analyzedInstructions: recipe.analyzedInstructions,
      summary: recipe.summary
    }));

    // 4. Return Response
    res.json({
      recipes: recipes,
      message: `Found ${recipes.length} recipes for "${query}"`
    });

  } catch (err) {
    console.error("Error in /api/recommend:", err.message);
    if (err.response) {
      console.error("API Response:", err.response.data);

      // Fallback to Mock Data if API Limit Reached (402)
      if (err.response.status === 402) {
        console.log("⚠️ API Limit Reached. Serving Mock Data.");
        const mockRecipes = [
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

        return res.json({
          recipes: mockRecipes,
          message: "API Limit Reached - Showing Mock Recipes for Demo"
        });
      }
    }
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
