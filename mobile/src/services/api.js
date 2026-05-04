import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

export const API_URL =
  normalizedEnvApiUrl && !normalizedEnvApiUrl.includes('ngrok-free.dev')
    ? normalizedEnvApiUrl
    : normalizedEnvApiUrl || devBaseUrl || 'http://10.0.2.2:3000';

let authToken = null;
let authExpiredHandler = null;

export const setAuthExpiredHandler = (handler) => {
  authExpiredHandler = handler;
};

export const setAuthToken = async (token) => {
  authToken = token;

  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
};

export const loadToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    authToken = token;
  }
  return token;
};

export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

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

const sharedQuery = (isShared = false) => `?shared=${isShared}`;

export const getPantryItems = async (isShared = false) => {
  try {
    const response = await api.get(`/api/pantry${sharedQuery(isShared)}`);
    return response.data;
  } catch (error) {
    console.log('Offline mode: pantry unavailable');
    return [];
  }
};

export const addPantryItem = async (item, isShared = false) => {
  const response = await api.post(`/api/pantry${sharedQuery(isShared)}`, item);
  return response.data;
};

export const deletePantryItem = async (id, isShared = false) => {
  const response = await api.delete(`/api/pantry/${id}${sharedQuery(isShared)}`);
  return response.data;
};

export const updatePantryQuantity = async (id, quantity, isShared = false) => {
  const response = await api.patch(
    `/api/pantry/${id}${sharedQuery(isShared)}`,
    { quantity }
  );
  return response.data;
};

export const associateUPCWithPantryItem = async (
  pantryItemId,
  upc,
  isShared = false
) => {
  const response = await api.patch(
    `/api/pantry/${pantryItemId}/upc${sharedQuery(isShared)}`,
    { upc }
  );
  return response.data;
};

export const getIngredientSuggestions = async () => {
  const response = await api.get('/api/pantry/ingredients');
  return response.data;
};

// ================= Shared Pantry =================

export const getActiveSharedPantry = async () => {
  const response = await api.get('/api/shared-pantry');
  return response.data;
};

export const createSharedPantry = async (name) => {
  const response = await api.post('/api/shared-pantry', { name });
  return response.data;
};

export const joinSharedPantry = async (code) => {
  const response = await api.post('/api/shared-pantry/join', { code });
  return response.data;
};

export const leaveSharedPantry = async () => {
  const response = await api.post('/api/shared-pantry/leave');
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

export const getRecipeDetail = async (id) => {
  const response = await api.get(`/api/recipes/${id}`);
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

// ================= Shopping List =================

export const getShoppingList = async () => {
  const response = await api.get('/api/shopping-list');
  return response.data;
};

export const addShoppingListItem = async (item) => {
  const response = await api.post('/api/shopping-list', item);
  return response.data;
};

export const addMissingIngredientsToShoppingList = async (
  recipeId,
  missingIngredients
) => {
  const response = await api.post('/api/shopping-list/from-recipe', {
    recipeId,
    missingIngredients,
  });
  return response.data;
};

export const updateShoppingListItem = async (id, checked) => {
  const response = await api.patch(`/api/shopping-list/${id}`, { checked });
  return response.data;
};

export const deleteShoppingListItem = async (id) => {
  const response = await api.delete(`/api/shopping-list/${id}`);
  return response.data;
};

export default api;