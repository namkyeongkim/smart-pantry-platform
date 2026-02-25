import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { cookRecipe } from '../services/api';

const CookRecipeScreen = ({ route, navigation }) => {
  const { recipe } = route.params;
  const [cooking, setCooking] = useState(false);

  const handleCookRecipe = async () => {
    Alert.alert(
      'Confirm Cooking',
      'This will deduct ingredients from your pantry. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cook It!',
          onPress: async () => {
            setCooking(true);
            try {
              await cookRecipe(recipe.id);
              Alert.alert(
                'Success! 🎉',
                `${recipe.title} cooked successfully! Your pantry has been updated.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Pantry'),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to update pantry. Please try again.');
            } finally {
              setCooking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.image} />
        )}

        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>⏱️ {recipe.readyInMinutes} min</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>🍽️ {recipe.servings} servings</Text>
          </View>
        </View>

        {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Ingredients You Have:</Text>
            {recipe.usedIngredients.map((ing, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>• {ing.original}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Missing Ingredients:</Text>
            <View style={styles.warningBox}>
              {recipe.missedIngredients.map((ing, index) => (
                <Text key={index} style={styles.missingText}>
                  • {ing.original}
                </Text>
              ))}
              <Text style={styles.warningNote}>
                Note: You'll need to buy these ingredients first!
              </Text>
            </View>
          </View>
        )}

        {recipe.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Instructions:</Text>
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
          </View>
        )}

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Important:</Text>
          <Text style={styles.warningText}>
            Clicking "Confirm Cooking" will automatically deduct the ingredients you
            have from your pantry inventory.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cookButton, cooking && styles.cookButtonDisabled]}
          onPress={handleCookRecipe}
          disabled={cooking}
        >
          <Text style={styles.cookButtonText}>
            {cooking ? 'Updating Pantry...' : '✓ Confirm Cooking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    padding: 15,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metaBadge: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  ingredientItem: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  ingredientText: {
    fontSize: 15,
    color: '#155724',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  missingText: {
    fontSize: 15,
    color: '#856404',
    marginBottom: 5,
  },
  warningNote: {
    fontSize: 13,
    color: '#856404',
    fontStyle: 'italic',
    marginTop: 10,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2c3e50',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  cookButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cookButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  cookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CookRecipeScreen;