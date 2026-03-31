import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, StyleSheet } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { setAuthToken } from "./src/services/api";

export default function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  // Check if token already exists (auto login)
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user");

        if (savedToken) {
          setAuthToken(savedToken);
          setToken(savedToken);
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log("Error loading saved login:", error);
      }
    };

    checkLogin();
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken || "");
    setUser(newUser || null);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      setAuthToken(null);
      setToken("");
      setUser(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // If logged in → show main app
  if (token) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppNavigator token={token} user={user} onLogout={handleLogout} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // If not logged in → show login
  return (
    <SafeAreaView style={styles.screen}>
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#5a7559", 
  },
});