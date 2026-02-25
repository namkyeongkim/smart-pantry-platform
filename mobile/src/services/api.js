import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

let authToken = null;

// Set token when user logs in
export const setAuthToken = (token) => {
  authToken = token;
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

// Add token to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Pantry API calls
export const getPantryItems = async () => {
  try {
    const response = await api.get('/api/pantry');
    return response.data;
  } catch (error) {
    console.error('Error getting pantry items:', error);
    throw error;
  }
};

export const addPantryItem = async (item) => {
  try {
    const response = await api.post('/api/pantry', item);
    return response.data;
  } catch (error) {
    console.error('Error adding pantry item:', error);
    throw error;
  }
};

export const deletePantryItem = async (id) => {
  try {
    const response = await api.delete(`/api/pantry/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    throw error;
  }
};

export const updatePantryQuantity = async (id, quantity) => {
  try {
    const response = await api.patch(`/api/pantry/${id}`, { quantity });
    return response.data;
  } catch (error) {
    console.error('Error updating pantry quantity:', error);
    throw error;
  }
};

// Recipe API calls
export const searchRecipes = async (preferences) => {
  try {
    const response = await api.post('/api/recipes/search', preferences);
    return response.data;
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};

export const cookRecipe = async (recipeId) => {
  try {
    const response = await api.post('/api/recipes/cook', { recipeId });
    return response.data;
  } catch (error) {
    console.error('Error cooking recipe:', error);
    throw error;
  }
};

// User Preferences API calls
export const getUserPreferences = async () => {
  try {
    const response = await api.get('/api/users/preferences');
    return response.data;
  } catch (error) {
    console.error('Error getting preferences:', error);
    throw error;
  }
};

export const updateUserPreferences = async (flags) => {
  try {
    const response = await api.put('/api/users/preferences', { flags });
    return response.data;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

export default api;
