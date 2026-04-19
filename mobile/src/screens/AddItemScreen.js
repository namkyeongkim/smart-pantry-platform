import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { addPantryItem, getIngredientSuggestions } from '../services/api';

const AddItemScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [saving, setSaving] = useState(false);

  // Autocomplete state
  const [allIngredients, setAllIngredients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFromList, setSelectedFromList] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const units = ['pieces', 'grams', 'kg', 'ml', 'liters', 'cups', 'tbsp', 'tsp'];

  // Load ingredient suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await getIngredientSuggestions();
        setAllIngredients(data);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    loadSuggestions();
  }, []);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!name.trim() || name.trim().length < 1) return [];
    const search = name.toLowerCase().trim();
    const matches = allIngredients.filter(ing =>
      ing.name.toLowerCase().includes(search)
    );
    // Sort: starts-with first, then includes
    matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(search) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(search) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    });
    return matches.slice(0, 15);
  }, [name, allIngredients]);

  // Group suggestions by category
  const groupedSuggestions = useMemo(() => {
    const groups = {};
    filteredSuggestions.forEach(ing => {
      const cat = ing.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    // Flatten into a list with category headers
    const items = [];
    Object.keys(groups).sort().forEach(cat => {
      items.push({ type: 'header', category: cat, key: `header-${cat}` });
      groups[cat].forEach(ing => {
        items.push({ type: 'item', ...ing, key: `item-${ing.name}` });
      });
    });
    return items;
  }, [filteredSuggestions]);

  const handleSelectSuggestion = (ingredient) => {
    setName(ingredient.name);
    setUnit(ingredient.unit || 'pieces');
    setSelectedFromList(true);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleNameChange = (text) => {
    setName(text);
    setSelectedFromList(false);
    setShowSuggestions(text.trim().length >= 1);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter ingredient name');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    setSaving(true);
    try {
      await addPantryItem({
        name: name.trim().toLowerCase(),
        quantity: parseFloat(quantity),
        unit: unit,
      });
      Alert.alert('Success', `${name.trim()} added to pantry!`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredient. Make sure backend is running!');
    } finally {
      setSaving(false);
    }
  };

  const renderSuggestionItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      );
    }

    // Capitalize first letter for display
    const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionLeft}>
          <Text style={styles.suggestionName}>{displayName}</Text>
          <Text style={styles.suggestionUnit}>{item.unit}</Text>
        </View>
        <Text style={styles.suggestionArrow}>+</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Ingredient Name with Autocomplete */}
          <Text style={styles.label}>Ingredient Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, showSuggestions && filteredSuggestions.length > 0 && styles.inputActive]}
              value={name}
              onChangeText={handleNameChange}
              onFocus={() => name.trim().length >= 1 && setShowSuggestions(true)}
              placeholder="Start typing to search..."
              placeholderTextColor="#999"
              autoCorrect={false}
            />
            {selectedFromList && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>✓ Matches recipes</Text>
              </View>
            )}
          </View>

          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsTitle}>
                  📋 Suggestions ({filteredSuggestions.length})
                </Text>
                <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.suggestionsList}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {groupedSuggestions.map((item) => (
                  <View key={item.key}>
                    {renderSuggestionItem({ item })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* No match hint */}
          {showSuggestions && name.trim().length >= 2 && filteredSuggestions.length === 0 && (
            <View style={styles.noMatchContainer}>
              <Text style={styles.noMatchText}>
                No matching ingredient found — you can still add "{name.trim()}" as a custom item
              </Text>
            </View>
          )}

          {/* Quantity */}
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g., 500"
            keyboardType="numeric"
            placeholderTextColor="#999"
            onFocus={() => setShowSuggestions(false)}
          />

          {/* Unit Selection */}
          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitContainer}>
            {units.map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitButton,
                  unit === u && styles.unitButtonSelected,
                ]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    unit === u && styles.unitButtonTextSelected,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary Preview */}
          {name.trim() && quantity && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Adding:</Text>
              <Text style={styles.previewText}>
                {quantity} {unit} of {name.trim()}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : '✓ Add to Pantry'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0',
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 8,
    marginTop: 18,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e0ddd8',
    color: '#2c3e50',
  },
  inputActive: {
    borderColor: '#5a7559',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  matchBadge: {
    position: 'absolute',
    right: 12,
    top: 14,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  // Suggestions dropdown
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#5a7559',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 250,
    overflow: 'hidden',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f0ede8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd8',
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#5a6b5c',
    fontWeight: '600',
  },
  closeText: {
    fontSize: 13,
    color: '#5a7559',
    fontWeight: '600',
  },
  suggestionsList: {
    maxHeight: 210,
  },
  categoryHeader: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f8f6f3',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a8b7c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0ede8',
  },
  suggestionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestionName: {
    fontSize: 15,
    color: '#3d4a3e',
    fontWeight: '500',
  },
  suggestionUnit: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0ede8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  suggestionArrow: {
    fontSize: 20,
    color: '#5a7559',
    fontWeight: '600',
  },
  noMatchContainer: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f9a825',
  },
  noMatchText: {
    fontSize: 13,
    color: '#5d4037',
    lineHeight: 18,
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  unitButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0ddd8',
  },
  unitButtonSelected: {
    backgroundColor: '#5a7559',
    borderColor: '#5a7559',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#3d4a3e',
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  previewContainer: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  previewText: {
    fontSize: 14,
    color: '#1b5e20',
    fontWeight: '700',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#5a7559',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AddItemScreen;