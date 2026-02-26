import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { setAuthToken } from '../services/api';

import HomeScreen from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import AddItemScreen from '../screens/AddItemScreen';
import RecipeSearchScreen from '../screens/RecipeSearchScreen';
import RecipeResultsScreen from '../screens/RecipeResultsScreen';
import CookRecipeScreen from '../screens/CookRecipeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';

const Stack = createStackNavigator();

const AppNavigator = ({ token, user, onLogout }) => {
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  // Custom header for Home screen
  const HomeHeader = ({ navigation }) => (
    <View style={styles.homeHeader}>
      <View style={styles.headerTop}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🧺</Text>
          <Text style={styles.logoText}>PANTRY</Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Pantry')}
          >
            <Text style={styles.navButtonText}>🗄️ Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('RecipeSearch')}
          >
            <Text style={styles.navButtonText}>🔍 Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.profileButton]}
            onPress={() => navigation.navigate('Profile', { user })}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#5a7559',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            header: () => <HomeHeader navigation={navigation} />
          })}
        />

        <Stack.Screen
          name="Profile"
          options={({ navigation }) => ({
            title: 'Diet Profile',
            headerStyle: {
              backgroundColor: '#5a7559',
            },
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('Favorites')}
              >
                <Text style={{ fontSize: 22 }}>❤️</Text>
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
        </Stack.Screen>

        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            title: 'My Favorites',
            headerStyle: {
              backgroundColor: '#5a7559',
            },
          }}
        />

        <Stack.Screen
          name="Pantry"
          component={PantryScreen}
          options={{ title: `${user?.username || 'My'} Pantry` }}
        />

        <Stack.Screen
          name="AddItem"
          component={AddItemScreen}
          options={{ title: 'Add Ingredient' }}
        />

        <Stack.Screen
          name="RecipeSearch"
          component={RecipeSearchScreen}
          options={{ title: 'Find Recipes' }}
        />

        <Stack.Screen
          name="RecipeResults"
          component={RecipeResultsScreen}
          options={{ title: 'Recipe Results' }}
        />

        <Stack.Screen
          name="CookRecipe"
          component={CookRecipeScreen}
          options={{ title: 'Cook Recipe' }}
        />

        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  homeHeader: {
    backgroundColor: '#5a7559',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  profileButton: {
    backgroundColor: '#4a6549',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  profileButtonText: {
    fontSize: 20,
  },
});

export default AppNavigator;