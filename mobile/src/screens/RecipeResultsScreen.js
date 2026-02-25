import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const RecipeResultsScreen = ({ route, navigation }) => {
  const { recipes } = route.params;

  const renderRecipe = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('CookRecipe', { recipe: item })}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.recipeImage} />
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{item.title}</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>⏱️ {item.readyInMinutes} min</Text>
          <Text style={styles.metaText}>🍽️ {item.servings} servings</Text>
        </View>

        {item.usedIngredientCount !== undefined && (
          <View style={styles.ingredientsStatus}>
            <View style={styles.statusBar}>
              <View
                style={[
                  styles.statusBarFill,
                  {
                    width: `${
                      (item.usedIngredientCount /
                        (item.usedIngredientCount + item.missedIngredientCount)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.statusText}>
              You have {item.usedIngredientCount} of{' '}
              {item.usedIngredientCount + item.missedIngredientCount} ingredients
            </Text>
          </View>
        )}

        {item.missedIngredientCount > 0 && (
          <View style={styles.missingBadge}>
            <Text style={styles.missingText}>
              Missing: {item.missedIngredientCount} ingredients
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for you!
        </Text>
      </View>

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
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
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
    backgroundColor: '#27ae60',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  missingBadge: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  missingText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RecipeResultsScreen;