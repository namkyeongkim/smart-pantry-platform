import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPantryItems, deletePantryItem, updatePantryQuantity } from '../services/api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Categorize ingredient by name
function categorize(name) {
  const n = name.toLowerCase();
  if (['chicken', 'beef', 'pork', 'sausage', 'turkey', 'lamb', 'bacon', 'ham', 'meat', 'steak'].some(k => n.includes(k))) return 'Meat & Poultry';
  if (['salmon', 'tuna', 'shrimp', 'fish', 'cod', 'lobster', 'crab', 'prawn', 'anchovy', 'seafood'].some(k => n.includes(k))) return 'Seafood';
  if (['milk', 'cheese', 'butter', 'cream', 'yogurt', 'parmesan', 'mozzarella', 'ricotta', 'egg'].some(k => n.includes(k))) return 'Dairy & Eggs';
  if (['tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'zucchini', 'squash', 'mushroom', 'avocado', 'corn', 'pea', 'bean', 'lentil', 'celery', 'cucumber', 'kale', 'chard', 'arugula', 'scallion', 'leek', 'asparagus', 'eggplant', 'cabbage', 'turnip'].some(k => n.includes(k))) return 'Vegetables';
  if (['apple', 'banana', 'lemon', 'lime', 'orange', 'berry', 'cherry', 'mango', 'pineapple', 'grape', 'peach', 'pear'].some(k => n.includes(k))) return 'Fruits';
  if (['salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'oregano', 'basil', 'thyme', 'rosemary', 'parsley', 'cilantro', 'sage', 'dill', 'chili powder', 'turmeric', 'ginger', 'nutmeg', 'suya', 'caraway'].some(k => n.includes(k))) return 'Spices & Herbs';
  if (['oil', 'olive oil', 'vinegar', 'soy sauce', 'sauce', 'ketchup', 'mustard', 'mayo'].some(k => n.includes(k))) return 'Oils & Condiments';
  if (['rice', 'pasta', 'flour', 'bread', 'noodle', 'quinoa', 'oat', 'cereal', 'tortilla', 'crumb'].some(k => n.includes(k))) return 'Grains & Pasta';
  if (['water', 'broth', 'stock', 'juice', 'wine', 'beer', 'milk'].some(k => n.includes(k))) return 'Liquids';
  if (['almond', 'walnut', 'cashew', 'peanut', 'pecan', 'pistachio', 'nut', 'seed', 'chia'].some(k => n.includes(k))) return 'Nuts & Seeds';
  return 'Other';
}

// Category icons & colors
const CATEGORY_META = {
  'Meat & Poultry': { icon: '🍗', color: '#e74c3c' },
  'Seafood': { icon: '🐟', color: '#3498db' },
  'Dairy & Eggs': { icon: '🥚', color: '#f39c12' },
  'Vegetables': { icon: '🥬', color: '#27ae60' },
  'Fruits': { icon: '🍎', color: '#e91e63' },
  'Spices & Herbs': { icon: '🌿', color: '#8e44ad' },
  'Oils & Condiments': { icon: '🫒', color: '#d35400' },
  'Grains & Pasta': { icon: '🍝', color: '#c0392b' },
  'Liquids': { icon: '💧', color: '#2980b9' },
  'Nuts & Seeds': { icon: '🥜', color: '#795548' },
  'Other': { icon: '📦', color: '#607d8b' },
};

// Category sort order
const CATEGORY_ORDER = [
  'Meat & Poultry', 'Seafood', 'Dairy & Eggs', 'Vegetables', 'Fruits',
  'Spices & Herbs', 'Oils & Condiments', 'Grains & Pasta', 'Liquids',
  'Nuts & Seeds', 'Other'
];

const PantryScreen = ({ navigation }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    loadPantryItems();
  }, []);

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
      // Auto-expand all categories on first load
      const cats = {};
      items.forEach(item => {
        const cat = categorize(item.name);
        cats[cat] = true;
      });
      setExpandedCategories(cats);
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

  const toggleCategory = (category) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDeleteItem = (item) => {
    setCurrentItem(item);
    setRemoveQuantity('');
    setModalVisible(true);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [removeQuantity, setRemoveQuantity] = useState('');

  const handleRemoveQuantity = async () => {
    if (!currentItem) return;
    const qty = parseFloat(removeQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quantity');
      return;
    }

    try {
      if (qty >= currentItem.quantity) {
        await deletePantryItem(currentItem.id);
      } else {
        await updatePantryQuantity(currentItem.id, currentItem.quantity - qty);
      }
      setModalVisible(false);
      loadPantryItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
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
              setModalVisible(false);
              loadPantryItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  // Group items by category
  const groupedItems = {};
  pantryItems.forEach(item => {
    const cat = categorize(item.name);
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  // Sort categories by defined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => groupedItems[cat]);

  const totalItems = pantryItems.length;

  return (
    <View style={styles.container}>
      {loading && pantryItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading pantry...</Text>
        </View>
      ) : pantryItems.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>🥣</Text>
          <Text style={styles.emptyText}>Your pantry is empty</Text>
          <Text style={styles.emptySubtext}>Add some ingredients to get started!</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        >
          {/* Summary Header */}
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Your Pantry</Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryCount}>{totalItems}</Text>
              <Text style={styles.summaryLabel}>items</Text>
            </View>
          </View>

          {/* Category Sections */}
          {sortedCategories.map(category => {
            const items = groupedItems[category];
            const meta = CATEGORY_META[category] || CATEGORY_META['Other'];
            const isExpanded = expandedCategories[category];

            return (
              <View key={category} style={styles.categorySection}>
                {/* Category Header (Tap to Expand/Collapse) */}
                <TouchableOpacity
                  style={[styles.categoryHeader, { borderLeftColor: meta.color }]}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryIcon}>{meta.icon}</Text>
                    <Text style={styles.categoryName}>{category}</Text>
                    <View style={[styles.categoryCount, { backgroundColor: meta.color + '20' }]}>
                      <Text style={[styles.categoryCountText, { color: meta.color }]}>
                        {items.length}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#7a8b7c"
                  />
                </TouchableOpacity>

                {/* Category Items */}
                {isExpanded && (
                  <View style={styles.categoryItems}>
                    {items.map(item => {
                      const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
                      return (
                        <View key={item.id} style={styles.itemCard}>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{displayName}</Text>
                            <Text style={styles.itemQuantity}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(item)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={() => navigation.navigate('AddItem')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Add Ingredient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.recipeButton]}
          onPress={() => navigation.navigate('RecipeSearch')}
          disabled={pantryItems.length === 0}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.buttonText}>Find Recipes</Text>
        </TouchableOpacity>
      </View>

      {/* Remove Quantity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
                value={removeQuantity}
                onChangeText={setRemoveQuantity}
                keyboardType="numeric"
                placeholder={`Enter amount in ${currentItem?.unit || 'units'}`}
                placeholderTextColor="#999"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalRemoveButton]}
                onPress={handleRemoveQuantity}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#7a8b7c',
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#7a8b7c',
  },
  listContent: {
    padding: 16,
  },
  // Summary Header
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3d4a3e',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: '#5a7559',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#c8dcc8',
    fontWeight: '600',
  },
  // Category Section
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3d4a3e',
  },
  categoryCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Category Items
  categoryItems: {
    marginTop: 2,
    paddingLeft: 8,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#e8e5df',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#7a8b7c',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fde8e8',
  },
  // Bottom Buttons
  buttonContainer: {
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e5df',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#5a7559',
  },
  recipeButton: {
    backgroundColor: '#3d7a9e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
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
});

export default PantryScreen;