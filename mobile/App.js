import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { setAuthToken } from "./src/services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          await setAuthToken(storedToken);
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = async (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    await setAuthToken(newToken);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
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