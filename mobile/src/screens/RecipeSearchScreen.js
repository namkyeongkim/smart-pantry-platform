import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { searchRecipes } from '../services/api';

const RecipeSearchScreen = ({ navigation }) => {

  // Offline state
  const [offline, setOffline] = useState(false);

  // Search inputs
  const [cuisine, setCuisine] = useState('');
  const [maxCookTime, setMaxCookTime] = useState('60');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const [searching, setSearching] = useState(false);

  // Cuisine options
  const cuisines = [
    'Italian',
    'Mexican',
    'Asian',
    'American',
    'Indian',
    'Mediterranean'
  ];

  // Check connection when screen loads
  useEffect(() => {
    checkConnection();
  }, []);

  // Try API request to detect offline mode
  const checkConnection = async () => {

    try {

      await searchRecipes({
        maxCookTime: 60
      });

    } catch (error) {

      setOffline(true);

    }

  };

  // If offline → show offline screen
  if (offline) {

    return (

      <View style={styles.centerContent}>

        <Text style={styles.emptyText}>
          Unable to search recipes
        </Text>

        <Text style={styles.emptySubtext}>
          Please connect to the internet
        </Text>

      </View>

    );

  }

  // Handle search
  const handleSearch = async () => {

    if (!maxCookTime || parseInt(maxCookTime) <= 0) {

      Alert.alert(
        'Error',
        'Please enter valid cooking time'
      );

      return;

    }

    setSearching(true);

    try {

      const preferences = {

        cuisine: cuisine || undefined,

        maxCookTime: parseInt(maxCookTime),

        dietaryRestrictions:
          dietaryRestrictions || undefined,

      };

      const results = await searchRecipes(preferences);

      if (results.length === 0) {

        Alert.alert(
          'No Results',
          'No recipes found matching your criteria. Try different preferences!'
        );

      } else {

        navigation.navigate('RecipeResults', {
          recipes: results
        });

      }

    } catch (error) {

      Alert.alert(
        'Error',
        'Failed to search recipes. Make sure backend is running!'
      );

    } finally {

      setSearching(false);

    }

  };

  return (

    <ScrollView style={styles.container}>

      <View style={styles.content}>

        <Text style={styles.sectionTitle}>
          What are you in the mood for?
        </Text>

        {/* Cuisine selection */}
        <Text style={styles.label}>
          Cuisine Type (Optional)
        </Text>

        <View style={styles.cuisineContainer}>

          {cuisines.map((c) => (

            <TouchableOpacity
              key={c}
              style={[
                styles.cuisineButton,
                cuisine === c && styles.cuisineButtonSelected,
              ]}
              onPress={() =>
                setCuisine(cuisine === c ? '' : c)
              }
            >

              <Text
                style={[
                  styles.cuisineButtonText,
                  cuisine === c &&
                    styles.cuisineButtonTextSelected,
                ]}
              >

                {c}

              </Text>

            </TouchableOpacity>

          ))}

        </View>

        {/* Cook time input */}
        <Text style={styles.label}>
          Maximum Cook Time (minutes) *
        </Text>

        <TextInput
          style={styles.input}
          value={maxCookTime}
          onChangeText={setMaxCookTime}
          placeholder="e.g., 30"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        {/* Dietary restrictions */}
        <Text style={styles.label}>
          Dietary Restrictions (Optional)
        </Text>

        <TextInput
          style={styles.input}
          value={dietaryRestrictions}
          onChangeText={setDietaryRestrictions}
          placeholder="e.g., vegetarian, gluten-free, vegan"
          placeholderTextColor="#999"
        />

        {/* Search button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            searching && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={searching}
        >

          <Text style={styles.searchButtonText}>

            {searching
              ? 'Searching...'
              : '🔍 Search Recipes'}

          </Text>

        </TouchableOpacity>

        {/* Info box */}
        <View style={styles.infoBox}>

          <Text style={styles.infoText}>
            💡 We&apos;ll find recipes based on what&apos;s in your pantry!
          </Text>

        </View>

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
    padding: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 20,
  },

  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  cuisineButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  cuisineButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },

  cuisineButtonText: {
    fontSize: 15,
    color: '#2c3e50',
  },

  cuisineButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },

  searchButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },

  searchButtonDisabled: {
    backgroundColor: '#95a5a6',
  },

  searchButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },

  infoText: {
    fontSize: 15,
    color: '#2c3e50',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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

});

export default RecipeSearchScreen;