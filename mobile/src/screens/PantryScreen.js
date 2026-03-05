import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { getPantryItems, deletePantryItem } from '../services/api';

const PantryScreen = ({ navigation }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load pantry items when screen opens
  useEffect(() => {
    loadPantryItems();
  }, []);

  // Reload when coming back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPantryItems();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPantryItems = async () => {
    try {
      setLoading(true);
      const items = await getPantryItems();
      setPantryItems(items);
    } catch (error) {
      console.log('Offline mode: pantry unavailable');
      setPantryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPantryItems();
    setRefreshing(false);
  };

  const handleDeleteItem = (id, name) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePantryItem(id);
              loadPantryItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && pantryItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading pantry...</Text>
        </View>
      ) : pantryItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Unable to load pantry</Text>
          <Text style={styles.emptySubtext}>Please connect to the internet</Text>
        </View>
      ) : (
        <FlatList
          data={pantryItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={() => navigation.navigate('AddItem')}
        >
          <Text style={styles.buttonText}>+ Add Ingredient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.recipeButton]}
          onPress={() => navigation.navigate('RecipeSearch')}
          disabled={pantryItems.length === 0}
        >
          <Text style={styles.buttonText}>🔍 Find Recipes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  recipeButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PantryScreen;