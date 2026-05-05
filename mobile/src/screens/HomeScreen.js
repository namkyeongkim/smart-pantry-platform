import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  getPantryItems,
  deletePantryItem,
  updatePantryQuantity,
  getShoppingList,
} from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteQuantity, setDeleteQuantity] = useState('1');
  const [recentlyCooked, setRecentlyCooked] = useState([]);
  const [shoppingListCount, setShoppingListCount] = useState(0);

  useEffect(() => {
    loadPantryItems();
    loadCookingHistory();
    loadShoppingListCount();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return null;

      const user = JSON.parse(userData);
      return user.id;
    } catch (error) {
      console.log('Failed to get current user', error);
      return null;
    }
  };

  const loadCookingHistory = async () => {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        setRecentlyCooked([]);
        return;
      }

      const history = await AsyncStorage.getItem(`cooking_history_${userId}`);

      if (history) {
        const parsed = JSON.parse(history);
        setRecentlyCooked(parsed.slice(0, 3));
      } else {
        setRecentlyCooked([]);
      }
    } catch (error) {
      console.log('Failed to load cooking history', error);
      setRecentlyCooked([]);
    }
  };

  const loadShoppingListCount = async () => {
    try {
      const data = await getShoppingList();
      setShoppingListCount(data.length);
    } catch (error) {
      console.log('Failed to load shopping list count', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPantryItems();
      loadCookingHistory();
      loadShoppingListCount();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPantryItems = async () => {
    try {
      setLoading(true);
      const items = await getPantryItems();
      setPantryItems(items);
    } catch (error) {
      console.error('Error loading pantry:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPantryItems();
    await loadCookingHistory();
    await loadShoppingListCount();
    setRefreshing(false);
  };

  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setDeleteQuantity('1');
    setDeleteModalVisible(true);
    setSelectedItem(null);
  };

  const handleDeleteQuantity = async () => {
    if (!currentItem) return;

    const qty = parseFloat(deleteQuantity);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quantity');
      return;
    }

    if (qty >= currentItem.quantity) {
      try {
        await deletePantryItem(currentItem.id);
        setPantryItems(pantryItems.filter(item => item.id !== currentItem.id));
        setDeleteModalVisible(false);
      } catch (error) {
        console.error('Error deleting item:', error);
        Alert.alert('Error', 'Failed to delete item');
      }
    } else {
      try {
        await updatePantryQuantity(currentItem.id, currentItem.quantity - qty);
        setPantryItems(pantryItems.map(item =>
          item.id === currentItem.id
            ? { ...item, quantity: item.quantity - qty }
            : item
        ));
        setDeleteModalVisible(false);
      } catch (error) {
        console.error('Error updating item:', error);
        Alert.alert('Error', 'Failed to update quantity');
        loadPantryItems();
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!currentItem) return;

    Alert.alert(
      'Delete All',
      `Remove all ${currentItem.name} from pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePantryItem(currentItem.id);
              setPantryItems(pantryItems.filter(item => item.id !== currentItem.id));
              setDeleteModalVisible(false);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const filteredItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Welcome to{'\n'}Your Pantry</Text>
            <Text style={styles.heroSubtitle}>
              Easily manage your pantry items{'\n'}and find tasty recipes.
            </Text>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => navigation.navigate('Pantry')}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroImage}>
            <Text style={styles.heroEmoji}>🍯</Text>
            <Text style={styles.heroEmoji}>🥖</Text>
            <Text style={styles.heroEmoji}>🧄</Text>
          </View>
        </View>

        {/* Search Pantry Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search pantry..."
              placeholderTextColor="#7a8b7c"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Your Pantry Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Pantry</Text>
              <Text style={styles.itemCount}>
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                {searchQuery ? ' found' : ' in stock'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddItem')}
            >
              <Text style={styles.addButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {loading && pantryItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5a7559" />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No items found' : 'Your pantry is empty!'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Add some ingredients to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsGrid}>
              {filteredItems.slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pantryCard,
                    selectedItem === item.id && styles.pantryCardSelected
                  ]}
                  onPress={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    {selectedItem === item.id && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => openDeleteModal(item)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filteredItems.length > 6 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Pantry')}
            >
              <Text style={styles.viewAllText}>
                View All {filteredItems.length} Items →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recently Cooked */}
        {recentlyCooked.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Cooked</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CookingHistory')}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {recentlyCooked.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentCard}
                onPress={() =>
                  navigation.navigate('RecipeDetail', {
                    recipe: item
                  })
                }
              >
                <Text style={styles.recentTitle}>🍳 {item.title}</Text>
                <Text style={styles.recentTime}>⏱ {item.readyInMinutes} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Pantry')}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🗄️</Text>
              </View>
              <Text style={styles.featureTitle}>Manage Pantry</Text>
              <View style={styles.featureButton}>
                <Text style={styles.featureButtonText}>Go to Pantry</Text>
              </View>
            </TouchableOpacity>

            {/* Scan UPC */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('BarcodeScanner')}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>📷</Text>
              </View>

              <Text style={styles.featureTitle}>Scan UPC</Text>

              <View style={styles.featureButton}>
                <Text style={styles.featureButtonText}>Open Camera</Text>
              </View>
            </TouchableOpacity>

            {/* Search Recipes */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('RecipeSearch')}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🔍</Text>
              </View>
              <Text style={styles.featureTitle}>Search Recipes</Text>
              <View style={styles.featureButton}>
                <Text style={styles.featureButtonText}>Find Recipes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Favorites')}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>❤️</Text>
              </View>
              <Text style={styles.featureTitle}>Favorites</Text>
              <View style={styles.featureButton}>
                <Text style={styles.featureButtonText}>View Favorites</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('CookingHistory')}
            >
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🍳</Text>
              </View>
              <Text style={styles.featureTitle}>Cooking History</Text>
              <View style={styles.featureButton}>
                <Text style={styles.featureButtonText}>View History</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Shopping Cart Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ShoppingList')}
      >
        <Ionicons name="cart" size={26} color="#fff" />
        {shoppingListCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>
              {shoppingListCount > 9 ? '9+' : shoppingListCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Delete Quantity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Remove {currentItem?.name?.charAt(0).toUpperCase()}{currentItem?.name?.slice(1)}
            </Text>
            <Text style={styles.modalSubtitle}>
              Available: {currentItem?.quantity} {currentItem?.unit}
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>How much to remove?</Text>
              <TextInput
                style={styles.modalInput}
                value={deleteQuantity}
                onChangeText={setDeleteQuantity}
                keyboardType="numeric"
                placeholder={`Enter amount in ${currentItem?.unit || 'units'}`}
                placeholderTextColor="#999"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalRemoveButton]}
                onPress={handleDeleteQuantity}
              >
                <Text style={styles.modalRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalDeleteAllButton}
              onPress={handleDeleteAll}
            >
              <Text style={styles.modalDeleteAllText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0'
  },
  hero: {
    backgroundColor: '#e8e5df',
    paddingHorizontal: 20,
    paddingVertical: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroText: {
    flex: 1
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 8,
    lineHeight: 34
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#5a6b5c',
    lineHeight: 20,
    marginBottom: 20
  },
  getStartedButton: {
    backgroundColor: '#5a7559',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  getStartedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  heroImage: {
    marginLeft: 16,
    alignItems: 'center'
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 4
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0dcd7',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#3d4a3e',
  },
  clearButton: {
    fontSize: 18,
    color: '#7a8b7c',
    paddingHorizontal: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 4
  },
  itemCount: {
    fontSize: 14,
    color: '#7a8b7c'
  },
  addButton: {
    backgroundColor: '#5a7559',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7a8b7c'
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  pantryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  pantryCardSelected: {
    borderWidth: 2,
    borderColor: '#5a7559',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 4
  },
  itemQuantity: {
    fontSize: 13,
    color: '#7a8b7c'
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12
  },
  viewAllText: {
    fontSize: 15,
    color: '#5a7559',
    fontWeight: '600'
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  featureIcon: {
    alignItems: 'center',
    marginBottom: 12
  },
  featureEmoji: {
    fontSize: 48
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 12,
    textAlign: 'center'
  },
  featureButton: {
    backgroundColor: '#5a7559',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5a7559',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#7a8b7c',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#e0dcd7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f5f3f0',
    color: '#3d4a3e',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0ede8',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7a8b7c',
  },
  modalRemoveButton: {
    backgroundColor: '#5a7559',
  },
  modalRemoveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalDeleteAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDeleteAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },
  recentCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d4a3e'
  },
  recentTime: {
    fontSize: 13,
    color: '#7a8b7c',
    marginTop: 4
  },
});

export default HomeScreen;