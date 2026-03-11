import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecipeDetail } from '../services/api';

const RecipeDetailScreen = ({ route, navigation }) => {

  const { recipe } = route.params;

  const [fullRecipe, setFullRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const recipeId = recipe.recipe_id || recipe.id;


  useEffect(() => {

    const loadDetail = async () => {

      setLoading(true);

      try {

        // Check if a customized version of this recipe exists in local storage
        const savedRecipe = await AsyncStorage.getItem(`recipe_${recipeId}`);

        if (savedRecipe) {

          // Load the customized recipe
          setFullRecipe(JSON.parse(savedRecipe));

        } else {

          // Otherwise load the original recipe from the API
          const data = await getRecipeDetail(recipeId);
          setFullRecipe(data);

        }

      } catch (error) {

        // If API fails, switch to offline mode
        console.log('Offline mode');
        setOffline(true);
        setFullRecipe(recipe);

      } finally {

        setLoading(false);

      }

    };

    loadDetail();

  }, [recipe]);


  // Reset recipe to original version
  const revertRecipe = async () => {

    try {

      // Remove customized recipe from local storage
      await AsyncStorage.removeItem(`recipe_${recipeId}`);

      // Restore original recipe
      setFullRecipe(recipe);

    } catch (error) {

      console.log('Revert failed', error);

    }

  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!fullRecipe) {
    return (
      <View style={styles.center}>
        <Text>Failed to load recipe.</Text>
      </View>
    );
  }


  return (

    <ScrollView style={styles.container}>

      <View style={styles.content}>

        {/* Recipe Image */}
        {fullRecipe.image && (
          <Image
            source={{ uri: fullRecipe.image }}
            style={styles.image}
          />
        )}

        {/* Recipe Title */}
        <Text style={styles.title}>{fullRecipe.title}</Text>

        {/* Recipe Meta Info */}
        <View style={styles.metaContainer}>

          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              ⏱️ {fullRecipe.readyInMinutes} min
            </Text>
          </View>

          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              🍽️ {fullRecipe.servings} servings
            </Text>
          </View>

        </View>


        {/* INGREDIENTS SECTION */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>🛒 Ingredients</Text>

            <View style={{flexDirection:'row', gap:10}}>

              {/* Navigate to edit ingredients screen */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditIngredients', {
                    ingredients: fullRecipe.extendedIngredients || [],
                    onSave: async (updated) => {

                      const updatedRecipe = {
                        ...fullRecipe,
                        extendedIngredients: updated
                      };

                      // Update UI
                      setFullRecipe(updatedRecipe);

                      // Save customized recipe locally
                      await AsyncStorage.setItem(
                        `recipe_${recipeId}`,
                        JSON.stringify(updatedRecipe)
                      );

                    }
                  })
                }
              >
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>

              {/* Reset recipe */}
              <TouchableOpacity onPress={revertRecipe}>
                <Text style={styles.resetButton}>Reset</Text>
              </TouchableOpacity>

            </View>

          </View>


          {/* Ingredient List */}
          {(fullRecipe.extendedIngredients || []).map((ing, index) => {

            const name =
              typeof ing === 'string'
                ? ing
                : ing.original || ing.name;

            return (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>• {name}</Text>
              </View>
            );

          })}

        </View>



        {/* INSTRUCTIONS SECTION */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>📝 Instructions</Text>

            <View style={{flexDirection:'row', gap:10}}>

              {/* Navigate to edit instructions */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditInstructions', {
                    instructions: fullRecipe.instructions || '',
                    onSave: async (updated) => {

                      const updatedRecipe = {
                        ...fullRecipe,
                        instructions: updated
                      };

                      setFullRecipe(updatedRecipe);

                      await AsyncStorage.setItem(
                        `recipe_${recipeId}`,
                        JSON.stringify(updatedRecipe)
                      );

                    }
                  })
                }
              >
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>

              {/* Reset instructions */}
              <TouchableOpacity onPress={revertRecipe}>
                <Text style={styles.resetButton}>Reset</Text>
              </TouchableOpacity>

            </View>

          </View>


          {/* Instruction Steps */}
          {fullRecipe.analyzedInstructions?.length > 0 ? (

            fullRecipe.analyzedInstructions[0].steps.map((step, index) => (

              <View key={index} style={styles.stepCard}>

                <Text style={styles.stepLabel}>
                  STEP {index + 1}
                </Text>

                <Text style={styles.stepDescription}>
                  {step.step}
                </Text>

              </View>

            ))

          ) : fullRecipe.instructions ? (

            fullRecipe.instructions
              .replace(/<[^>]*>/g, '')
              .split('. ')
              .filter(Boolean)
              .map((sentence, index) => (

                <View key={index} style={styles.stepCard}>

                  <Text style={styles.stepLabel}>
                    STEP {index + 1}
                  </Text>

                  <Text style={styles.stepDescription}>
                    {sentence.trim()}.
                  </Text>

                </View>

              ))

          ) : (

            <Text style={styles.stepDescription}>
              No instructions available.
            </Text>

          )}

        </View>


        {/* Start Cooking Button */}
        {!offline && (

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('CookRecipe', {
                recipe: fullRecipe,
              })
            }
          >

            <Text style={styles.buttonText}>
              🍳 Start Cooking
            </Text>

          </TouchableOpacity>

        )}

      </View>

    </ScrollView>

  );
};


const styles = StyleSheet.create({

  container:{ flex:1, backgroundColor:'#f5f5f5' },

  content:{ padding:15 },

  image:{
    width:'100%',
    height:250,
    borderRadius:12,
    marginBottom:15
  },

  title:{
    fontSize:24,
    fontWeight:'bold',
    marginBottom:15
  },

  metaContainer:{
    flexDirection:'row',
    gap:10,
    marginBottom:20
  },

  metaBadge:{
    backgroundColor:'#ecf0f1',
    paddingHorizontal:15,
    paddingVertical:8,
    borderRadius:8
  },

  section:{ marginBottom:20 },

  sectionHeader:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:10
  },

  sectionTitle:{
    fontSize:18,
    fontWeight:'bold'
  },

  editButton:{
    color:'#27ae60',
    fontWeight:'600'
  },

  resetButton:{
    color:'#e74c3c',
    fontWeight:'600'
  },

  ingredientItem:{
    backgroundColor:'#d4edda',
    padding:10,
    borderRadius:8,
    marginBottom:5
  },

  ingredientText:{
    color:'#155724'
  },

  stepCard:{
    backgroundColor:'white',
    padding:16,
    borderRadius:12,
    marginBottom:14
  },

  stepLabel:{
    fontWeight:'bold',
    color:'#27ae60',
    marginBottom:6
  },

  stepDescription:{
    fontSize:16,
    lineHeight:24
  },

  button:{
    backgroundColor:'#27ae60',
    padding:18,
    borderRadius:10,
    alignItems:'center'
  },

  buttonText:{
    color:'white',
    fontSize:18,
    fontWeight:'bold'
  },

  center:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  }

});

export default RecipeDetailScreen;