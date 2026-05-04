import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cookRecipe,
  getRecipeDetail,
  addMissingIngredientsToShoppingList,
} from '../services/api';

const CookRecipeScreen = ({ route, navigation }) => {
  const { recipe: passedRecipe } = route.params;

  const [recipe, setRecipe] = useState(passedRecipe);
  const [cooking, setCooking] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const recipeId = recipe.id || recipe.recipe_id;
  const hasAllIngredients = recipe.hasAllIngredients ?? false;

  // Save cooked recipe to local cooking history
  const saveCookHistory = async (recipe) => {
    try {
      const history = await AsyncStorage.getItem('cooking_history');
      let historyList = history ? JSON.parse(history) : [];

      const newItem = {
        recipe_id: recipe.id || recipe.recipe_id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        date: new Date().toISOString(),
      };

      // Remove duplicates
      historyList = historyList.filter(
        (item) => item.recipe_id !== newItem.recipe_id
      );

      // Add newest item to the top
      historyList.unshift(newItem);

      // Keep only latest 20 items
      historyList = historyList.slice(0, 20);

      await AsyncStorage.setItem(
        'cooking_history',
        JSON.stringify(historyList)
      );
    } catch (error) {
      console.log('Save cooking history error', error);
    }
  };

  // Load or refresh latest recipe detail from API
  const refreshRecipeDetail = async () => {
    try {
      setLoadingDetail(true);

      const full = await getRecipeDetail(recipeId);

      setRecipe((prev) => ({
        ...prev,
        ...full,
      }));
    } catch (err) {
      console.error('Failed to refresh recipe detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Fetch full recipe details on first load if needed
  useEffect(() => {
    const needsDetail =
      !recipe.analyzedInstructions && !recipe.instructions;

    if (needsDetail) {
      refreshRecipeDetail();
    }
  }, []);

  // Refresh recipe whenever this screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      refreshRecipeDetail();
    }, [recipeId])
  );

  const handleAddToShoppingList = async () => {
    try {
      const missingIngredients = recipe.missingIngredients || [];

      if (missingIngredients.length === 0) {
        Alert.alert(
          'Nothing to Add',
          'You already have all the ingredients.'
        );
        return;
      }

      await addMissingIngredientsToShoppingList(
        recipeId,
        missingIngredients
      );

      Alert.alert(
        'Success',
        'Missing ingredients were added to your shopping list.',
        [
          {
            text: 'Stay Here',
            style: 'cancel',
          },
          {
            text: 'View Shopping List',
            onPress: () => navigation.navigate('ShoppingList'),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Shopping list error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Error',
        'Failed to add missing ingredients to shopping list.'
      );
    }
  };

  const handleCookRecipe = async () => {
    Alert.alert(
      'Confirm Cooking',
      'This will deduct ingredients from your pantry. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cook It!',
          onPress: async () => {
            setCooking(true);

            try {
              await cookRecipe(recipeId);

              // Save cooking history
              await saveCookHistory(recipe);

              Alert.alert(
                'Success! 🎉',
                `${recipe.title} cooked successfully! Your pantry has been updated.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('CookingHistory'),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to update pantry. Please try again.'
              );
            } finally {
              setCooking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.image} />
        )}

        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              ⏱️ {recipe.readyInMinutes} min
            </Text>
          </View>

          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              🍽️ {recipe.servings} servings
            </Text>
          </View>
        </View>

        {/* Ingredients you have */}
        {Array.isArray(recipe.availableIngredients) &&
          recipe.availableIngredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🟢 Ingredients You Have:
              </Text>

              {recipe.availableIngredients.map((ing, index) => {
                const name =
                  typeof ing === 'string'
                    ? ing
                    : ing?.original || ing?.name;

                return (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>• {name}</Text>
                  </View>
                );
              })}
            </View>
          )}

        {/* Missing ingredients */}
        {Array.isArray(recipe.missingIngredients) &&
          recipe.missingIngredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ⚠️ Missing Ingredients:
              </Text>

              <View style={styles.warningBox}>
                {recipe.missingIngredients.map((ing, index) => {
                  const name =
                    typeof ing === 'string'
                      ? ing
                      : ing?.name || ing?.original;

                  return (
                    <Text key={index} style={styles.missingText}>
                      • {name}
                    </Text>
                  );
                })}

                <Text style={styles.warningNote}>
                  You need these ingredients before cooking.
                </Text>

                <TouchableOpacity
                  style={styles.shoppingButton}
                  onPress={handleAddToShoppingList}
                >
                  <Text style={styles.shoppingButtonText}>
                    Add to Shopping List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Instructions */}
        {hasAllIngredients && (
          <>
            <View style={styles.readyBox}>
              <Text style={styles.readyText}>
                ✅ You have all required ingredients!
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Cooking Steps:</Text>

              {loadingDetail ? (
                <ActivityIndicator size="large" color="#27ae60" />
              ) : recipe.analyzedInstructions &&
                recipe.analyzedInstructions.length > 0 ? (
                recipe.analyzedInstructions[0].steps.map((step, index) => (
                  <View key={index} style={styles.stepCard}>
                    <Text style={styles.stepLabel}>STEP {index + 1}</Text>
                    <Text style={styles.stepDescription}>{step.step}</Text>
                  </View>
                ))
              ) : recipe.instructions ? (
                recipe.instructions
                  .replace(/<[^>]+>/g, '')
                  .split('. ')
                  .filter(Boolean)
                  .map((sentence, index) => (
                    <View key={index} style={styles.stepCard}>
                      <Text style={styles.stepLabel}>STEP {index + 1}</Text>
                      <Text style={styles.stepDescription}>
                        {sentence.trim()}.
                      </Text>
                    </View>
                  ))
              ) : (
                <Text>No instructions available.</Text>
              )}
            </View>
          </>
        )}

        {/* Warning */}
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Important:</Text>

          <Text style={styles.warningText}>
            Clicking &quot;Confirm Cooking&quot; will automatically deduct the ingredients
            you have from your pantry inventory.
          </Text>
        </View>

        {/* Cook Button */}
        <TouchableOpacity
          style={[
            styles.cookButton,
            (cooking || !hasAllIngredients) && styles.cookButtonDisabled,
          ]}
          onPress={handleCookRecipe}
          disabled={cooking || !hasAllIngredients}
        >
          <Text style={styles.cookButtonText}>
            {cooking ? 'Updating Pantry...' : '✓ Confirm Cooking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  missingText: {
    fontSize: 15,
    color: '#856404',
    marginBottom: 5,
  },
  warningNote: {
    fontSize: 13,
    color: '#856404',
    fontStyle: 'italic',
    marginTop: 10,
  },
  shoppingButton: {
    backgroundColor: '#f39c12',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shoppingButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2c3e50',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  cookButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cookButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  cookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
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
  readyBox: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  readyText: {
    color: '#155724',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CookRecipeScreen;