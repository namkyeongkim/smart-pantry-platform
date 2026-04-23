import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { setAuthToken, setAuthExpiredHandler } from "./src/services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore saved login session when app starts
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) {
          await setAuthToken(storedToken);
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Auto logout when JWT expires
    setAuthExpiredHandler(async () => {
      try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        await setAuthToken(null);

        setToken(null);
        setUser(null);

        Alert.alert("Session Expired", "Please log in again.");
      } catch (error) {
        console.log("Error clearing expired session:", error);
      }
    });
  }, []);

  // Called after successful login
  const handleLoginSuccess = async (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    await setAuthToken(newToken);
  };

  // Manual logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await setAuthToken(null);

      setToken(null);
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