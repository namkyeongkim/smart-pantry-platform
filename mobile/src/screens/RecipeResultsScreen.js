import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { addFavorite, removeFavorite, getFavorites } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const RecipeResultsScreen = ({ route, navigation }) => {
  const { recipes } = route.params;

  const [favoriteIds, setFavoriteIds] = useState([]);

  // Load favorites when screen is mounted
  useEffect(() => {
    loadFavorites();
  }, []);

  // Fetch favorite recipes from backend
  const loadFavorites = async () => {
    try {
      const data = await getFavorites();
      const ids = data.map((f) => f.recipe_id);
      setFavoriteIds(ids);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle favorite state for a recipe
  const handleFavorite = async (recipe) => {
    try {
      if (favoriteIds.includes(recipe.id)) {
        await removeFavorite(recipe.id);
        setFavoriteIds(favoriteIds.filter((id) => id !== recipe.id));
      } else {
        await addFavorite(recipe);
        setFavoriteIds([...favoriteIds, recipe.id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render each recipe card
  const renderRecipe = ({ item }) => {
    // Count how many ingredients you have / miss
    const availableCount =
      item.availableCount ??
      (item.availableIngredients?.length || 0);

    const missingCount =
      item.missingCount ??
      (item.missingIngredients?.length || 0);

    const totalIngredients =
      item.totalIngredients ?? availableCount + missingCount;

    // Percentage of ingredients you already have
    const percent =
      totalIngredients > 0 ? (availableCount / totalIngredients) * 100 : 0;

    // Change bar color based on match percentage
    const barColor =
      percent >= 70
        ? '#27ae60' // green – good match
        : percent >= 40
        ? '#f39c12' // orange – medium match
        : '#e74c3c'; // red – low match

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CookRecipe', { recipe: item })}
      >
        {/* Image wrapper (for recipe thumbnail + heart button) */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.recipeImage} />

          {/* Favorite (heart) button */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation(); // prevent card press
              handleFavorite(item);
            }}
          >
            <Ionicons
              name={favoriteIds.includes(item.id) ? 'heart' : 'heart-outline'}
              size={22}
              color="#ef4444"
            />
          </TouchableOpacity>
        </View>

        {/* Text + meta info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.title}</Text>

          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>⏱️ {item.readyInMinutes} min</Text>
            <Text style={styles.metaText}>🍽️ {item.servings} servings</Text>
          </View>

          {/* Pantry match progress + missing info */}
          {totalIngredients > 0 && (
            <View style={styles.ingredientsStatus}>
              {/* Progress bar */}
              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusBarFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>

              <Text style={styles.statusText}>
                You have {availableCount} of {totalIngredients} ingredients
              </Text>

              {missingCount > 0 && (
                <View style={styles.missingBadge}>
                  <Text style={styles.missingText}>
                    Missing: {missingCount} ingredients
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header showing how many recipes were found */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for you!
        </Text>
      </View>

      {/* Recipe list */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recipeInfo: {
    padding: 15,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  ingredientsStatus: {
    marginTop: 10,
  },
  statusBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  statusBarFill: {
    height: '100%',
    backgroundColor: '#27ae60',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  missingBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#f1c40f',
  },
  missingText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RecipeResultsScreen;