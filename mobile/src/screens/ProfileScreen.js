import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { getUserPreferences, updateUserPreferences } from '../services/api';

// Map display key to what the backend dietary_flags table stores
const FLAG_MAP = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  glutenFree: 'Gluten-Free',
  dairyFree: 'Dairy-Free',
  nutAllergy: 'Nut-Allergy',
  seafoodAllergy: 'Seafood-Allergy',
};

const ProfileScreen = ({ navigation, route }) => {
  const { user } = route.params;

  const [preferences, setPreferences] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutAllergy: false,
    seafoodAllergy: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await getUserPreferences();
        const saved = data.flags || [];
        const updated = { ...preferences };
        for (const [key, backendName] of Object.entries(FLAG_MAP)) {
          updated[key] = saved.includes(backendName);
        }
        setPreferences(updated);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

useLayoutEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Favorites')}
        style={{
          marginRight: 16,
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <Ionicons
          name="heart"
          size={20}        
          color="red"
          style={{ marginTop: 1 }}  
        />
        <Text
          style={{
            marginLeft: 6,
            color: 'white',
            fontWeight: '600',
            fontSize: 17
          }}
        >
          Favorites
        </Text>
      </TouchableOpacity>
    ),
  });
}, [navigation]);

  const togglePreference = useCallback(async (key) => {
    if (saving) return;

    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);

    // Convert to backend flag names
    const activeFlags = Object.entries(updated)
      .filter(([, val]) => val)
      .map(([k]) => FLAG_MAP[k]);

    setSaving(true);
    try {
      await updateUserPreferences(activeFlags);
    } catch (err) {
      console.error('Failed to save preference:', err);
      // Revert on failure
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [preferences, saving]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onLogout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }
      ]
    );
  };

  const PreferenceItem = ({ title, description, prefKey, value }) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceIcon}>
        <Text style={styles.iconText}>✨</Text>
      </View>
      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => togglePreference(prefKey)}
        trackColor={{ false: '#d1d5db', true: '#86b88a' }}
        thumbColor={value ? '#5a7559' : '#f4f3f4'}
        disabled={saving}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>✨</Text>
          </View>
          <Text style={styles.headerTitle}>Dietary Profile</Text>
          <Text style={styles.headerSubtitle}>
            Set your dietary preferences and we'll personalize recipe suggestions just for you
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          {loading ? (
            <ActivityIndicator size="large" color="#5a7559" style={{ marginVertical: 32 }} />
          ) : (
            <>
              <PreferenceItem
                title="Vegetarian"
                description="No meat or fish"
                prefKey="vegetarian"
                value={preferences.vegetarian}
              />
              <PreferenceItem
                title="Vegan"
                description="No animal products"
                prefKey="vegan"
                value={preferences.vegan}
              />
              <PreferenceItem
                title="Gluten-Free"
                description="No wheat, barley, or rye"
                prefKey="glutenFree"
                value={preferences.glutenFree}
              />
              <PreferenceItem
                title="Dairy-Free"
                description="No milk or cheese products"
                prefKey="dairyFree"
                value={preferences.dairyFree}
              />
              <PreferenceItem
                title="Nut Allergy"
                description="No nuts or nut products"
                prefKey="nutAllergy"
                value={preferences.nutAllergy}
              />
              <PreferenceItem
                title="Seafood Allergy"
                description="No fish or shellfish"
                prefKey="seafoodAllergy"
                value={preferences.seafoodAllergy}
              />
            </>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0'
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#e8e5df'
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5a7559',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  profileEmoji: {
    fontSize: 40
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#5a6b5c',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20
  },
  userInfo: {
    padding: 24,
    alignItems: 'center'
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#5a6b5c'
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  preferenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0ede8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  iconText: {
    fontSize: 24
  },
  preferenceText: {
    flex: 1
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3d4a3e',
    marginBottom: 2
  },
  preferenceDesc: {
    fontSize: 13,
    color: '#7a8b7c'
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ProfileScreen;