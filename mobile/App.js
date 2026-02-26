import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { setAuthToken } from './src/services/api';

export default function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken || "");
    setUser(newUser || null);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setToken("");
    setUser(null);
  };

  // If logged in, show the app
  if (token && user) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppNavigator token={token} user={user} onLogout={handleLogout} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Login/Register screen
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
    backgroundColor: "#0f172a"
  }
});