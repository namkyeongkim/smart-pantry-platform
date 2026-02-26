import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFavorites, removeFavorite } from '../services/api';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const handleRemove = (recipeId) => {
    Alert.alert(
      "Remove Favorite",
      "Are you sure you want to remove this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFavorite(recipeId);
              setFavorites(prev =>
                prev.filter(f => f.recipe_id !== recipeId)
              );
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Favorite Recipes</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.recipe_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>

            {/* Navigate to Recipe Detail */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('RecipeDetail', { recipe: item })
              }
            >
              <Image
                source={{ uri: item.image }}
                style={styles.image}
              />
              <Text style={styles.recipeTitle}>{item.title}</Text>
            </TouchableOpacity>

            {/* Bottom Right Delete Button */}
            <View style={styles.bottomRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemove(item.recipe_id)}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No favorites yet.
          </Text>
        }
        contentContainerStyle={
          favorites.length === 0 && { flex: 1, justifyContent: 'center' }
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0',
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c3e50',
  },

  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  image: {
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },

  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },

  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 15,
  },
});

export default FavoritesScreen;