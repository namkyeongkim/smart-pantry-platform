import React, { useState } from 'react';
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
} from 'react-native';
import { addPantryItem } from '../services/api';

const AddItemScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [saving, setSaving] = useState(false);

  const units = ['pieces', 'grams', 'kg', 'ml', 'liters', 'cups', 'tbsp', 'tsp'];

  const handleSave = async () => {
    // Validation
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
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit: unit,
      });
      Alert.alert('Success', 'Ingredient added!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredient. Make sure backend is running!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Ingredient Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Tomatoes, Rice, Chicken"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g., 5"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

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

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Ingredient'}
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  unitButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  unitButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddItemScreen;