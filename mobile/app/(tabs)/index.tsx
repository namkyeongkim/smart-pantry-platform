import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, TextInput, Image, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth-context';

// ==============================================================================
// TEAM SETUP INSTRUCTION:
// 1. Open a terminal on your computer and run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
// 2. Find your IPv4 Address (e.g., 192.168.1.5).
// 3. Replace the IP address below with YOUR computer's IP.
// ==============================================================================
// using ngrok for stable remote access
const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.startsWith('//') ? rawBaseUrl.slice(2) : rawBaseUrl;
const API_URL = `${BASE_URL}/api/recipes/search-mood`;

interface Ingredient {
  name: string;
}

interface Step {
  step: string;
}

interface Instruction {
  steps: Step[];
}

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  missedIngredientCount: number;
  usedIngredientCount: number;
  extendedIngredients: string[];
  missedIngredients: string[];
  analyzedInstructions: Instruction[];
  summary: string;
}

interface RecommendationResponse {
  recipes: Recipe[];
  message: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { logout, user, token } = useAuth();
  const [mood, setMood] = useState('');
  const [servings, setServings] = useState('2');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFavoriteView, setIsFavoriteView] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
    
    
  const handleFindDinner = async () => {
    setLoading(true);
    setError(null);
    setRecipes([]);
    setSelectedRecipe(null);

    try {
      console.log(`Fetching recommendation for Mood: ${mood}, Servings: ${servings}`);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          userId: 1,
          mood: mood,
          servings: parseInt(servings) || 2
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Data received:', data);

      if (Array.isArray(data)) {
        setRecipes(data);
      } else {
        console.log("Backend returned error object:", data);
        setRecipes([]);
        setError("Backend error occurred");
      }
        
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend. Make sure the server is running and the IP address is correct.");
    } finally {
      setLoading(false);
    }
  };


  // Add recipe to favorites
  const addToFavorites = async (recipe: Recipe) => {
    try {
      await fetch(`${BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: 1,
          recipeId: recipe.id,
          title: recipe.title,
          image: recipe.image
        })
      });
      setFavoriteIds(prev => {
        if (prev.includes(recipe.id)) return prev;
        return [...prev, recipe.id];
      });
    
    } catch (err) {
      console.error(err);
    }
  };
  
  // Load saved favorite recipes from the backend
  const loadFavorites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/favorites/1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const formatted = data.map((item: any) => ({
        id: item.recipe_id,
        title: item.recipe_title,
        image: item.recipe_image,
        readyInMinutes: null,
        servings: null,
        missedIngredientCount: 0,
        usedIngredientCount: 0,
        extendedIngredients: [],
        missedIngredients: [],
        analyzedInstructions: [],
        summary: ''
      }));
      
      setRecipes(formatted);
      setFavoriteIds(formatted.map((r: any) => r.id));
    } catch (err) {
      console.error(err);
    }
   };

   // Remove recipe from favorites
   const removeFromFavorites = async (recipe: Recipe) => {
    try {
      await fetch(`${BASE_URL}/api/favorites/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setFavoriteIds(prev => prev.filter(id => id !== recipe.id));
      
      if (isFavoriteView) {
        setRecipes(prev => prev.filter(r => r.id !== recipe.id));
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  // Open recipe detail view
  const openRecipeDetails = async (recipe: Recipe) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/recipes/details/${recipe.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      setSelectedRecipe(data);
    
    } catch (err) {
      console.error(err);
    }
  };
  

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
  <View style={styles.container}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Text style={styles.title}>Pantry Pal 🥣</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setIsFavoriteView(true);
          loadFavorites();
        }}
      >
        <Text style={{ fontSize: 26 }}>❤️</Text>
      </TouchableOpacity>
    </View>

    {isFavoriteView && (
      <Button
        title="Back to Search"
        onPress={() => {
          setIsFavoriteView(false);
          setRecipes([]);
        }}
      />
    )}

    {!isFavoriteView && (
      <>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('barcode')}
        >
          <Text style={styles.scanButtonText}>Scan UPC</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>What are you in the mood for?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Pasta, Spicy, Vegan"
            value={mood}
            onChangeText={setMood}
          />

          <Text style={styles.label}>How many people?</Text>
          <TextInput
            style={styles.input}
            placeholder="2"
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />

          <Button
            title="Find Recipes"
            onPress={handleFindDinner}
            disabled={loading}
          />
        </View>
      </>
    )}

    {loading && (
      <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
    )}

    {!BASE_URL && (
      <Text style={styles.error}>
        EXPO_PUBLIC_API_URL is not configured correctly. Set it in mobile/.env and restart Expo.
      </Text>
    )}
    {error && <Text style={styles.error}>{error}</Text>}

    <ScrollView style={styles.resultContainer}>
      {recipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.card}
          onPress={() => openRecipeDetails(recipe)}
        >
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />

          <View style={styles.cardContent}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <Text style={styles.cardTitle} numberOfLines={2}>
                {recipe.title}
              </Text>

              <TouchableOpacity
                style={{ width: 30, alignItems: 'flex-end', marginTop: 2 }}
                onPress={() =>
                  favoriteIds.includes(recipe.id)
                    ? removeFromFavorites(recipe)
                    : addToFavorites(recipe)
                }
              >
                <Text style={{ fontSize: 22 }}>
                  {favoriteIds.includes(recipe.id) ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardInfo}>
              {recipe.readyInMinutes
                ? `🕒 ${recipe.readyInMinutes} mins | 👥 ${recipe.servings}`
                : 'Saved recipe'}
            </Text>

            {!isFavoriteView && (
              <Text style={styles.missingInfo}>
                Needs {recipe.missedIngredientCount} more ingredients
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>

    <Modal
      animationType="slide"
      transparent={false}
      visible={selectedRecipe !== null}
      onRequestClose={() => setSelectedRecipe(null)}
    >
      <View style={styles.modalContainer}>
        {selectedRecipe && (
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Image
              source={{ uri: selectedRecipe.image }}
              style={styles.modalImage}
            />

            <Text style={styles.modalTitle}>
              {selectedRecipe.title}
            </Text>

            <Text style={styles.modalSubtitle}>
              Ready in {selectedRecipe.readyInMinutes} mins | Servings:{' '}
              {selectedRecipe.servings}
            </Text>

            <Text style={styles.sectionHeader}>Ingredients</Text>

            {selectedRecipe.extendedIngredients &&
            selectedRecipe.extendedIngredients.length > 0
              ? selectedRecipe.extendedIngredients.map(
                  (ing: any, idx: number) => (
                    <Text key={idx} style={styles.ingredientItem}>
                      • {ing.original}
                    </Text>
                  )
                )
              : selectedRecipe.missedIngredients.map(
                  (ing: any, idx: number) => (
                    <Text key={idx} style={styles.ingredientItem}>
                      • {ing.original}
                    </Text>
                  )
                )}

            <Text style={styles.sectionHeader}>Instructions</Text>

            {selectedRecipe.analyzedInstructions.length > 0 ? (
              selectedRecipe.analyzedInstructions[0].steps.map(
                (step, idx) => (
                  <View key={idx} style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>
                      {idx + 1}. {step.step}
                    </Text>
                  </View>
                )
              )
            ) : (
              <Text style={styles.message}>
                No instructions available.
              </Text>
            )}

            <Button
              title="Close"
              onPress={() => setSelectedRecipe(null)}
            />
          </ScrollView>
        )}
      </View>
    </Modal>

    <StatusBar style="auto" />
  </View>
);}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  scanButton: {
    backgroundColor: '#5a7559',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
  resultContainer: {
    width: '100%',
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recipeImage: {
    width: 100,
    height: 100,
    backgroundColor: '#ddd',
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardInfo: {
    fontSize: 14,
    color: '#555',
  },
  missingInfo: {
    fontSize: 14,
    color: '#d32f2f',
    marginTop: 5,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  ingredientItem: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 16,
    lineHeight: 24,
  },
  message: {
    fontStyle: 'italic',
    color: '#666',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#5a7559',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
