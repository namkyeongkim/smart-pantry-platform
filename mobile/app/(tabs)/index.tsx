import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, TextInput, Image, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState } from 'react';

// ==============================================================================
// TEAM SETUP INSTRUCTION:
// 1. Open a terminal on your computer and run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
// 2. Find your IPv4 Address (e.g., 192.168.1.5).
// 3. Replace the IP address below with YOUR computer's IP.
// ==============================================================================
// using ngrok for stable remote access
const API_URL = 'https://supercommercial-suellen-lacelike.ngrok-free.dev/api/recommend';

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
  const [mood, setMood] = useState('');
  const [servings, setServings] = useState('2');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

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

      const data: RecommendationResponse = await response.json();
      console.log('Data received:', data);
      setRecipes(data.recipes);
      if (data.recipes.length === 0 && data.message) {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend. Make sure the server is running and the IP address is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantry Pal(Or any other name we come up with) 🥣</Text>
      <Text style={styles.subtitle}>Find your next meal</Text>

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

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <ScrollView style={styles.resultContainer}>
        {recipes.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={styles.card} onPress={() => setSelectedRecipe(recipe)}>
            <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{recipe.title}</Text>
              <Text style={styles.cardInfo}>🕒 {recipe.readyInMinutes} mins | 👥 {recipe.servings} servings</Text>
              <Text style={styles.missingInfo}>
                Needs {recipe.missedIngredientCount} more ingredients
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={selectedRecipe !== null}
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalContainer}>
          {selectedRecipe && (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
              <Text style={styles.modalSubtitle}>
                Ready in {selectedRecipe.readyInMinutes} mins | Servings: {selectedRecipe.servings}
              </Text>

              <Text style={styles.sectionHeader}>Ingredients</Text>
              {/* Prefer extendedIngredients if available, otherwise just show missing (fallback) */}
              {(selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.length > 0) ? (
                selectedRecipe.extendedIngredients.map((ing, idx) => (
                  <Text key={idx} style={styles.ingredientItem}>• {ing}</Text>
                ))
              ) : (
                selectedRecipe.missedIngredients.map((ing, idx) => (
                  <Text key={idx} style={styles.ingredientItem}>• {ing}</Text>
                ))
              )}

              <Text style={styles.sectionHeader}>Instructions</Text>
              {selectedRecipe.analyzedInstructions.length > 0 ? (
                selectedRecipe.analyzedInstructions[0].steps.map((step, idx) => (
                  <View key={idx} style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>{step.step}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.message}>No instructions available.</Text>
              )}

              <Button title="Close" onPress={() => setSelectedRecipe(null)} />
            </ScrollView>
          )}
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    flexWrap: 'wrap',
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
});
