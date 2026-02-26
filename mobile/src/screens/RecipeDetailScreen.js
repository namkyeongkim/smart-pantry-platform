import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getRecipeDetail } from '../services/api';

const RecipeDetailScreen = ({ route, navigation }) => {
  const { recipe } = route.params;
  const [fullRecipe, setFullRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);

      try {
        const data = await getRecipeDetail(
          recipe.recipe_id || recipe.id
        );
        setFullRecipe(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [recipe]); 

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!fullRecipe) {
    return (
      <View style={styles.center}>
        <Text>Failed to load recipe.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {fullRecipe.image && (
          <Image
            source={{ uri: fullRecipe.image }}
            style={styles.image}
          />
        )}

        <Text style={styles.title}>{fullRecipe.title}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              ⏱️ {fullRecipe.readyInMinutes} min
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              🍽️ {fullRecipe.servings} servings
            </Text>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Ingredients:</Text>
          {fullRecipe.extendedIngredients?.length > 0 &&
            fullRecipe.extendedIngredients.map((ing, index) => {
              const name =
                typeof ing === 'string'
                  ? ing
                  : ing.original || ing.name;

              return (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>• {name}</Text>
                </View>
              );
            })}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Instructions:</Text>

          {fullRecipe.analyzedInstructions?.length > 0 ? (
            fullRecipe.analyzedInstructions[0].steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <Text style={styles.stepLabel}>
                  STEP {index + 1}
                </Text>
                <Text style={styles.stepDescription}>
                  {step.step}
                </Text>
              </View>
            ))
          ) : fullRecipe.instructions ? (
            fullRecipe.instructions
              .replace(/<[^>]+>/g, '')
              .split('. ')
              .filter(Boolean)
              .map((sentence, index) => (
                <View key={index} style={styles.stepCard}>
                  <Text style={styles.stepLabel}>
                    STEP {index + 1}
                  </Text>
                  <Text style={styles.stepDescription}>
                    {sentence.trim()}.
                  </Text>
                </View>
              ))
          ) : (
            <Text style={styles.stepDescription}>
              No instructions available.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('CookRecipe', {
              recipe: fullRecipe,
            })
          }
        >
          <Text style={styles.buttonText}>
            🍳 Start Cooking
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metaBadge: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  ingredientItem: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  ingredientText: {
    fontSize: 15,
    color: '#155724',
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 6,
    letterSpacing: 1,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
});

export default RecipeDetailScreen;