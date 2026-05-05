import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CookingHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);

  const getCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return null;

      const user = JSON.parse(userData);
      return user.id;
    } catch (error) {
      console.log('Failed to get current user', error);
      return null;
    }
  };

  const getCookingHistoryKey = async () => {
    const userId = await getCurrentUserId();
    return userId ? `cooking_history_${userId}` : null;
  };

  useEffect(() => {
    loadHistory();

    const unsubscribe = navigation.addListener('focus', loadHistory);
    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    try {
      const storageKey = await getCookingHistoryKey();

      if (!storageKey) {
        setHistory([]);
        return;
      }

      const data = await AsyncStorage.getItem(storageKey);

      if (data) {
        setHistory(JSON.parse(data));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.log('History load error', error);
      setHistory([]);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Remove all cooking history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            const storageKey = await getCookingHistoryKey();

            if (storageKey) {
              await AsyncStorage.removeItem(storageKey);
            }

            setHistory([]);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('RecipeDetail', {
          recipe: item
        })
      }
    >
      <Image
        source={{ uri: item.image }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.title}>
          {item.title}
        </Text>

        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>
          🍳 Recently Cooked
        </Text>

        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No cooking history yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flex:1,
    padding:15,
    backgroundColor:"#f5f5f5"
  },

  headerRow:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:15
  },

  header:{
    fontSize:22,
    fontWeight:"bold",
    color:"#2c3e50"
  },

  clearText:{
    color:"#e74c3c",
    fontWeight:"600"
  },

  card:{
    flexDirection:"row",
    backgroundColor:"white",
    borderRadius:10,
    marginBottom:12,
    overflow:"hidden",
    elevation:2
  },

  image:{
    width:90,
    height:90
  },

  info:{
    flex:1,
    padding:12,
    justifyContent:"center"
  },

  title:{
    fontSize:16,
    fontWeight:"bold",
    color:"#2c3e50"
  },

  date:{
    marginTop:5,
    color:"#7f8c8d"
  },

  emptyContainer:{
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },

  emptyText:{
    color:"#888",
    fontSize:16
  }
});

export default CookingHistoryScreen;