import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ================= Base URL Configuration =================

// Get local development URL (Expo device → local backend)
const getDevBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.hostUri;

  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  return host ? `http://${host}:3000` : null;
};

const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const normalizedEnvApiUrl = envApiUrl?.startsWith('//')
  ? envApiUrl.slice(2)
  : envApiUrl;

const devBaseUrl = getDevBaseUrl();

// Priority: ENV → dev → emulator fallback
export const API_URL =
  normalizedEnvApiUrl && !normalizedEnvApiUrl.includes('ngrok-free.dev')
    ? normalizedEnvApiUrl
    : normalizedEnvApiUrl || devBaseUrl || 'http://10.0.2.2:3000';

// ================= Auth State =================

let authToken = null;
let authExpiredHandler = null;

// Register handler for expired session
export const setAuthExpiredHandler = (handler) => {
  authExpiredHandler = handler;
};

// Save token after login
export const setAuthToken = async (token) => {
  authToken = token;

  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
};

// Load token from storage (auto-login)
export const loadToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) authToken = token;
  return token;
};

// Clear token on logout or expiration
export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// ================= Axios Instance =================

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle expired token globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    const isExpired =
      status === 401 ||
      status === 403 ||
      message === 'Invalid or expired token.';

    if (isExpired) {
      console.log('Session expired. Logging out...');
      await clearAuthToken();

      if (authExpiredHandler) {
        authExpiredHandler();
      }
    }

    return Promise.reject(error);
  }
);

// ================= Pantry APIs =================

// Get all pantry items for the logged-in user
export const getPantryItems = async () => {
  try {
    const response = await api.get('/api/pantry');
    return response.data;
  } catch (error) {
    console.log('Offline mode: pantry unavailable');
    return [];
  }
};

// Fetch ingredient suggestions for autocomplete
export const getIngredientSuggestions = async () => {
  const response = await api.get('/api/pantry/ingredients');
  return response.data;
};

// Add new item to pantry
export const addPantryItem = async (item) => {
  const response = await api.post('/api/pantry', item);
  return response.data;
};

// Delete pantry item
export const deletePantryItem = async (id) => {
  const response = await api.delete(`/api/pantry/${id}`);
  return response.data;
};

// Update pantry item quantity
export const updatePantryQuantity = async (id, quantity) => {
  const response = await api.patch(`/api/pantry/${id}`, { quantity });
  return response.data;
};

// Associate UPC code with an existing pantry item
// ⚠️ Requires backend route: PATCH /api/pantry/:id/upc
export const associateUPCWithPantryItem = async (pantryItemId, upc) => {
  const response = await api.patch(`/api/pantry/${pantryItemId}/upc`, { upc });
  return response.data;
};

// ================= Recipe APIs =================

// Search recipes based on user preferences
export const searchRecipes = async (preferences) => {
  const response = await api.post('/api/recipes/search', preferences);
  return response.data;
};

// Cook a recipe and deduct ingredients from pantry
export const cookRecipe = async (recipeId) => {
  const response = await api.post('/api/recipes/cook', { recipeId });
  return response.data;
};

// Get detailed recipe info
export const getRecipeDetail = async (id) => {
  const response = await api.get(`/api/recipes/${id}`);
  return response.data;
};

// ================= User APIs =================

// Get user dietary preferences
export const getUserPreferences = async () => {
  const response = await api.get('/api/users/preferences');
  return response.data;
};

// Update user dietary preferences
export const updateUserPreferences = async (flags) => {
  const response = await api.put('/api/users/preferences', { flags });
  return response.data;
};

// ================= Favorites APIs =================

// Add recipe to favorites
export const addFavorite = async (recipe) => {
  const response = await api.post('/api/favorites', {
    recipe_id: recipe.id,
    title: recipe.title,
    image: recipe.image,
  });
  return response.data;
};

// Remove recipe from favorites
export const removeFavorite = async (recipeId) => {
  const response = await api.delete(`/api/favorites/${recipeId}`);
  return response.data;
};

// Get all favorite recipes
export const getFavorites = async () => {
  const response = await api.get('/api/favorites');
  return response.data;
};

// ================= Shopping List APIs =================

// Get shopping list
export const getShoppingList = async () => {
  const response = await api.get('/api/shopping-list');
  return response.data;
};

// Add item to shopping list
export const addShoppingListItem = async (item) => {
  const response = await api.post('/api/shopping-list', item);
  return response.data;
};

// Add missing ingredients from recipe to shopping list
export const addMissingIngredientsToShoppingList = async (recipeId, missingIngredients) => {
  const response = await api.post('/api/shopping-list/from-recipe', {
    recipeId,
    missingIngredients,
  });
  return response.data;
};

// Update shopping list item status (checked/unchecked)
export const updateShoppingListItem = async (id, checked) => {
  const response = await api.patch(`/api/shopping-list/${id}`, { checked });
  return response.data;
};

// Delete shopping list item
export const deleteShoppingListItem = async (id) => {
  const response = await api.delete(`/api/shopping-list/${id}`);
  return response.data;
};

export default api;