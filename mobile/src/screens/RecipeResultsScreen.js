import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { addFavorite, removeFavorite, getRecipeDetail } from '../services/api';

const RecipeResultsScreen = ({ route, navigation }) => {

  const { recipes } = route.params;
  const [favoriteIds, setFavoriteIds] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {

      const latest = await AsyncStorage.getItem('favorites');
      const favorites = latest ? JSON.parse(latest) : [];

      const ids = favorites.map((f) =>
        Number(f.id || f.recipe_id)
      );

      setFavoriteIds(ids);

    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = async (recipe) => {

    try {

      const latest = await AsyncStorage.getItem('favorites');
      let favorites = latest ? JSON.parse(latest) : [];

      const isFavorite = favorites.some(
        (f) => Number(f.id || f.recipe_id) === Number(recipe.id)
      );

      if (isFavorite) {

        try {
          await removeFavorite(recipe.id);
        } catch (err) {
          console.log('Offline remove');
        }

        favorites = favorites.filter(
          (f) => Number(f.id || f.recipe_id) !== Number(recipe.id)
        );

        await AsyncStorage.setItem(
          'favorites',
          JSON.stringify(favorites)
        );

        setFavoriteIds((prev) =>
          prev.filter((id) => id !== recipe.id)
        );

      } else {

        const fullRecipe = await getRecipeDetail(recipe.id);

        try {
          await addFavorite(fullRecipe);
        } catch (err) {
          console.log('Offline add');
        }

        const exists = favorites.some(
          (f) => Number(f.id || f.recipe_id) === Number(fullRecipe.id)
        );

        if (!exists) {
          favorites.push(fullRecipe);
        }

        await AsyncStorage.setItem(
          'favorites',
          JSON.stringify(favorites)
        );

        setFavoriteIds((prev) => [...prev, recipe.id]);

      }

    } catch (err) {
      console.error(err);
    }
  };

  const renderRecipe = ({ item }) => {

    const availableCount =
      item.availableCount ??
      (item.availableIngredients?.length || 0);

    const missingCount =
      item.missingCount ??
      (item.missingIngredients?.length || 0);

    const totalIngredients =
      item.totalIngredients ??
      availableCount + missingCount;

    const percent =
      totalIngredients > 0
        ? (availableCount / totalIngredients) * 100
        : 0;

    const barColor =
      percent >= 70
        ? '#27ae60'
        : percent >= 40
        ? '#f39c12'
        : '#e74c3c';

    return (

      <TouchableOpacity
        style={styles.recipeCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('CookRecipe', { recipe: item })
        }
      >

        {/* Image + heart */}
        <View style={styles.imageWrapper}>

          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
          />

          {/* Favorite button */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleFavorite(item);
            }}
          >

            <Ionicons
              name={
                favoriteIds.includes(item.id)
                  ? 'heart'
                  : 'heart-outline'
              }
              size={22}
              color="#ef4444"
            />

          </TouchableOpacity>

        </View>

        {/* Recipe info */}
        <View style={styles.recipeInfo}>

          <Text style={styles.recipeName}>
            {item.title}
          </Text>

          <View style={styles.metaContainer}>

            <Text style={styles.metaText}>
              ⏱️ {item.readyInMinutes} min
            </Text>

            <Text style={styles.metaText}>
              🍽️ {item.servings} servings
            </Text>

          </View>

          {/* Pantry match */}
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

      {/* Header */}
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