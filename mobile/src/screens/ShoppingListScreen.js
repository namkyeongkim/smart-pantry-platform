import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getShoppingList,
  deleteShoppingListItem,
  addPantryItem,
} from '../services/api';

const ShoppingListScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedList, setSelectedList] = useState([]);
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('pieces');
  const [isSharedPantry, setIsSharedPantry] = useState(false);

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      const data = await getShoppingList();
      setItems(data);
    } catch (error) {
      console.log(
        'Shopping list load error:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'Failed to load shopping list.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadShoppingList();
    }, [])
  );

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  // Split combined ingredient names into separate pantry items.
  const splitIngredientName = (name) => {
    return String(name || '')
      .toLowerCase()
      .split(/,| and /gi)
      .map((part) => part.trim())
      .filter(Boolean);
  };

  // Guess a default unit to make the input faster for the user.
  const getDefaultUnit = (name) => {
    const lower = String(name || '').toLowerCase();

    const gramItems = ['salt', 'pepper', 'sugar', 'flour', 'cocoa', 'powder'];
    if (gramItems.some((k) => lower.includes(k))) return 'grams';

    const liquidItems = ['oil', 'milk', 'water', 'vinegar', 'soy sauce'];
    if (liquidItems.some((k) => lower.includes(k))) return 'ml';

    return 'pieces';
  };

  const openInputModal = (shared = false) => {
    const chosen = items.filter((item) => selectedItems.includes(item.id));

    if (chosen.length === 0) {
      Alert.alert('No Items Selected', 'Select items first.');
      return;
    }

    setIsSharedPantry(shared);
    setSelectedList(chosen);
    setCurrentIndex(0);
    setQuantityInput('1');
    setUnitInput(getDefaultUnit(chosen[0].ingredient_name));
    setModalVisible(true);
  };

  const handleAddCurrentItem = async () => {
    const currentItem = selectedList[currentIndex];
    if (!currentItem) return;

    const quantity = parseFloat(quantityInput);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    try {
      const splitNames = splitIngredientName(currentItem.ingredient_name);

      // Add the selected shopping list item to either personal or shared pantry.
      for (const name of splitNames) {
        await addPantryItem(
          {
            name,
            quantity,
            unit: unitInput.trim() || 'pieces',
          },
          isSharedPantry
        );
      }

      await deleteShoppingListItem(currentItem.id);

      const nextIndex = currentIndex + 1;

      if (nextIndex < selectedList.length) {
        const nextItem = selectedList[nextIndex];

        setCurrentIndex(nextIndex);
        setQuantityInput('1');
        setUnitInput(getDefaultUnit(nextItem.ingredient_name));
      } else {
        const processedIds = selectedList.map((item) => item.id);

        setItems((prev) =>
          prev.filter((item) => !processedIds.includes(item.id))
        );

        setSelectedItems([]);
        setModalVisible(false);

        Alert.alert(
          'Success',
          isSharedPantry
            ? 'Selected items were added to shared pantry.'
            : 'Selected items were added to your pantry.',
          [
            {
              text: 'Back to Recipe',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.log(
        'Add to pantry error:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'Failed to add item to pantry.');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteShoppingListItem(id);

      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    } catch (error) {
      console.log(
        'Shopping list delete error:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <View style={[styles.itemCard, isSelected && styles.selectedCard]}>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => toggleSelectItem(item.id)}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? '#27ae60' : '#7f8c8d'}
          />
        </TouchableOpacity>

        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.ingredient_name}</Text>
          {(item.quantity || item.unit) && (
            <Text style={styles.itemMeta}>
              {item.quantity ? item.quantity : ''} {item.unit ? item.unit : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const currentItem = selectedList[currentIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping List</Text>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No items</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.button, styles.myPantryButton]}
              onPress={() => openInputModal(false)}
            >
              <Text style={styles.buttonText}>Add to My Pantry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.sharedPantryButton]}
              onPress={() => openInputModal(true)}
            >
              <Text style={styles.buttonText}>Add to Shared Pantry</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isSharedPantry ? 'Add to Shared Pantry' : 'Add to My Pantry'}
              </Text>

              <Text style={styles.modalSubtitle}>
                {currentItem
                  ? `${currentIndex + 1} of ${selectedList.length}: ${
                      currentItem.ingredient_name
                    }`
                  : ''}
              </Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={unitInput}
                  onChangeText={setUnitInput}
                  placeholder="grams / ml / pieces"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  onPress={handleAddCurrentItem}
                >
                  <Text style={styles.confirmModalText}>
                    {currentIndex === selectedList.length - 1
                      ? 'Finish'
                      : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  itemMeta: {
    marginTop: 4,
    color: '#7f8c8d',
    fontSize: 13,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  myPantryButton: {
    backgroundColor: '#27ae60',
  },
  sharedPantryButton: {
    backgroundColor: '#2980b9',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#dcdcdc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#ecf0f1',
  },
  confirmModalButton: {
    backgroundColor: '#27ae60',
  },
  cancelModalText: {
    color: '#2c3e50',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmModalText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ShoppingListScreen;