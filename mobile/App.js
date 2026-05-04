import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { setAuthToken, setAuthExpiredHandler } from "./src/services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if a saved token exists (auto login)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user");

        // Restore session if token exists
        if (savedToken && savedUser) {
          await setAuthToken(savedToken);
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Handle token expiration globally
    setAuthExpiredHandler(async () => {
      try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        setToken("");
        setUser(null);

        Alert.alert("Session Expired", "Please log in again.");
      } catch (error) {
        console.log("Error clearing expired session:", error);
      }
    });
  }, []);

  const handleLoginSuccess = async (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    await setAuthToken(newToken);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      await setAuthToken(null);
      setToken("");
      setUser(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : token ? (
        <AppNavigator token={token} user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#5a7559",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});