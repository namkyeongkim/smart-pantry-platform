import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [user, setUser] = useState({ username: "Guest" });

  const handleLogout = async () => {
    setUser({ username: "Guest" });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppNavigator token={null} user={user} onLogout={handleLogout} />
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