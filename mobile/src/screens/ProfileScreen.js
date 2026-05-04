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
  ActivityIndicator,
  TextInput
} from 'react-native';
import {
  getUserPreferences,
  updateUserPreferences,
  getActiveSharedPantry,
  createSharedPantry,
  joinSharedPantry,
  leaveSharedPantry
} from '../services/api';

// Map display key to what the backend dietary_flags table stores
const FLAG_MAP = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  glutenFree: 'Gluten-Free',
  dairyFree: 'Dairy-Free',
  nutAllergy: 'Nut-Allergy',
  seafoodAllergy: 'Seafood-Allergy',
};

const ProfileScreen = ({ navigation, route, onLogout }) => {
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

  const [activePantry, setActivePantry] = useState(null);
  const [pantryNameInput, setPantryNameInput] = useState('');
  const [pantryCodeInput, setPantryCodeInput] = useState('');

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
    const loadSharedPantry = async () => {
      try {
        const p = await getActiveSharedPantry();
        setActivePantry(p);
      } catch (err) {
        console.error('Failed to load shared pantry:', err);
      }
    };
    loadPreferences();
    loadSharedPantry();
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

  const handleCreatePantry = async () => {
    if (!pantryNameInput) return Alert.alert('Error', 'Please enter a name for the pantry');
    try {
      const res = await createSharedPantry(pantryNameInput);
      setActivePantry({ name: pantryNameInput, code: res.code });
      setPantryNameInput('');
      Alert.alert('Success', `Shared pantry created! Your invite code is ${res.code}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create shared pantry');
    }
  };

  const handleJoinPantry = async () => {
    if (!pantryCodeInput) return Alert.alert('Error', 'Please enter an invite code');
    try {
      const res = await joinSharedPantry(pantryCodeInput);
      setActivePantry({ name: res.name, code: pantryCodeInput });
      setPantryCodeInput('');
      Alert.alert('Success', `Joined ${res.name}!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join shared pantry');
    }
  };

  const handleLeavePantry = async () => {
    try {
      await leaveSharedPantry();
      setActivePantry(null);
      Alert.alert('Success', 'Left shared pantry');
    } catch (err) {
      Alert.alert('Error', 'Failed to leave shared pantry');
    }
  };

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
            Set your dietary preferences and we&apos;ll personalize recipe suggestions just for you
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

        {/* Shared Pantry Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shared Pantry</Text>
          <View style={styles.card}>
            {activePantry ? (
              <View>
                <Text style={styles.preferenceTitle}>Currently in: {activePantry.name}</Text>
                <Text style={styles.preferenceDesc}>Invite Code: {activePantry.code}</Text>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeavePantry}>
                  <Text style={styles.leaveButtonText}>Leave Shared Pantry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.preferenceTitle}>Create a Shared Pantry</Text>
                <View style={{flexDirection: 'row', marginTop: 8}}>
                  <TextInput
                    style={styles.input}
                    placeholder="Pantry Name"
                    value={pantryNameInput}
                    onChangeText={setPantryNameInput}
                  />
                  <TouchableOpacity style={styles.actionButton} onPress={handleCreatePantry}>
                    <Text style={styles.actionButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.preferenceTitle, {marginTop: 16}]}>Join a Shared Pantry</Text>
                <View style={{flexDirection: 'row', marginTop: 8}}>
                  <TextInput
                    style={styles.input}
                    placeholder="Invite Code"
                    value={pantryCodeInput}
                    onChangeText={setPantryCodeInput}
                  />
                  <TouchableOpacity style={styles.actionButton} onPress={handleJoinPantry}>
                    <Text style={styles.actionButtonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3d4a3e',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f9fafb'
  },
  actionButton: {
    backgroundColor: '#5a7559',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  leaveButton: {
    backgroundColor: '#fde8e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  leaveButtonText: {
    color: '#dc2626',
    fontWeight: '600'
  }
});

export default ProfileScreen;