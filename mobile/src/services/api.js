import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

// Store JWT token in memory
let authToken = null;

// Callback function to handle token expiration globally
let authExpiredHandler = null;

// Register a handler to be called when token expires
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

// Load token from storage on app start (auto login)
export const loadToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    authToken = token;
  }
  return token;
};

// Clear token and user data (logout or expired session)
export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle expired or invalid token globally
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

// ================= Pantry =================
export const getPantryItems = async () => {
  try {
    const response = await api.get('/api/pantry');
    return response.data;
  } catch (error) {
    console.log('Offline mode: pantry unavailable');
    return [];
  }
};

export const addPantryItem = async (item) => {
  const response = await api.post('/api/pantry', item);
  return response.data;
};

export const deletePantryItem = async (id) => {
  const response = await api.delete(`/api/pantry/${id}`);
  return response.data;
};

export const updatePantryQuantity = async (id, quantity) => {
  const response = await api.patch(`/api/pantry/${id}`, { quantity });
  return response.data;
};

// ================= Recipes =================
export const searchRecipes = async (preferences) => {
  const response = await api.post('/api/recipes/search', preferences);
  return response.data;
};

export const cookRecipe = async (recipeId) => {
  const response = await api.post('/api/recipes/cook', { recipeId });
  return response.data;
};

// ================= User =================
export const getUserPreferences = async () => {
  const response = await api.get('/api/users/preferences');
  return response.data;
};

export const updateUserPreferences = async (flags) => {
  const response = await api.put('/api/users/preferences', { flags });
  return response.data;
};

// ================= Favorites =================
export const addFavorite = async (recipe) => {
  const response = await api.post('/api/favorites', {
    recipe_id: recipe.id,
    title: recipe.title,
    image: recipe.image,
  });
  return response.data;
};

export const removeFavorite = async (recipeId) => {
  const response = await api.delete(`/api/favorites/${recipeId}`);
  return response.data;
};

export const getFavorites = async () => {
  const response = await api.get('/api/favorites');
  return response.data;
};

export const getRecipeDetail = async (id) => {
  const response = await api.get(`/api/recipes/${id}`);
  return response.data;
};

export default api;