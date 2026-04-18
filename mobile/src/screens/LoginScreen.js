import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView
} from 'react-native';

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
const API_BASE_URL = rawApiBaseUrl.startsWith('//') ? rawApiBaseUrl.slice(2) : rawApiBaseUrl;

const LoginScreen = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const heading = useMemo(() => {
        return mode === "login" ? "Welcome!" : "Create Account";
    }, [mode]);

    const resetAuthState = () => {
        setError("");
        setMessage("");
    };

    const toggleMode = () => {
        resetAuthState();
        setMode((current) => (current === "login" ? "register" : "login"));
    };

    const onSubmit = async () => {
        resetAuthState();

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        // Password validation for registration
        if (mode === "register") {
            if (!username.trim()) {
                setError("Username is required.");
                return;
            }

            if (username.trim().length < 3) {
                setError("Username must be at least 3 characters.");
                return;
            }

            if (password.length < 8) {
                setError("Password must be at least 8 characters long.");
                return;
            }

            if (!/(?=.*[a-z])/.test(password)) {
                setError("Password must contain at least one lowercase letter.");
                return;
            }

            if (!/(?=.*[A-Z])/.test(password)) {
                setError("Password must contain at least one uppercase letter.");
                return;
            }

            if (!/(?=.*\d)/.test(password)) {
                setError("Password must contain at least one number.");
                return;
            }
        } else {
            // Login validation (simpler)
            if (!password.trim()) {
                setError("Password is required.");
                return;
            }
        }

        setLoading(true);

        try {
            const endpoint = mode === "login" ? "/api/users/login" : "/api/users/register";
            const payload =
                mode === "login"
                    ? { email: email.trim(), password }
                    : { username: username.trim(), email: email.trim(), password };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Request failed");
            }

            if (mode === "register") {
                setMessage("Account created successfully! Please sign in.");
                setMode("login");
                setPassword("");
                return;
            }

            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            onLoginSuccess(data.token, data.user);
        } catch (submitError) {
            setError(submitError.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🍳</Text>
                    <Text style={styles.appTitle}>Pantry Manager</Text>
                    <Text style={styles.subtitle}>{heading}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.card}>
                    {mode === "register" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                autoCapitalize="none"
                                onChangeText={setUsername}
                                placeholder="Enter your username"
                                placeholderTextColor="#94a3b8"
                                style={styles.input}
                                value={username}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            value={email}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry
                            style={styles.input}
                            value={password}
                        />

                        {mode === "register" && (
                            <View style={styles.passwordHints}>
                                <Text style={styles.hintTitle}>Password must contain:</Text>
                                <Text style={styles.hintText}>• At least 8 characters</Text>
                                <Text style={styles.hintText}>• One uppercase letter (A-Z)</Text>
                                <Text style={styles.hintText}>• One lowercase letter (a-z)</Text>
                                <Text style={styles.hintText}>• One number (0-9)</Text>
                            </View>
                        )}
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>❌ {error}</Text>
                        </View>
                    ) : null}

                    {message ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>✅ {message}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        disabled={loading}
                        onPress={onSubmit}
                        style={[styles.button, loading && styles.buttonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {mode === "login" ? "Sign In" : "Create Account"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled={loading}
                        onPress={toggleMode}
                        style={styles.switchContainer}
                    >
                        <Text style={styles.switchText}>
                            {mode === "login"
                                ? "Don't have an account? "
                                : "Already have an account? "}
                            <Text style={styles.switchTextBold}>
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#5a7559"
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40
    },
    header: {
        alignItems: "center",
        marginBottom: 32
    },
    logo: {
        fontSize: 64,
        marginBottom: 8
    },
    appTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 4
    },
    subtitle: {
        fontSize: 18,
        color: "#dfe7df",
        fontWeight: "500"
    },
    card: {
        backgroundColor: "#f4f7f4",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8
    },
    inputContainer: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2f3e2f",
        marginBottom: 8
    },
    input: {
        borderWidth: 2,
        borderColor: "#9fb79e",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: "#ffffff",
        color: "#2c3e2c"
    },
    passwordHints: {
        backgroundColor: "#eef5ee",
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#5a7559"
    },
    hintTitle: {
        color: "#2f3e2f",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 6
    },
    hintText: {
        color: "#556b55",
        fontSize: 12,
        marginBottom: 2
    },
    button: {
        backgroundColor: "#5a7559",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#5a7559",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonDisabled: {
        backgroundColor: "#64748b",
        shadowOpacity: 0
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 16
    },
    switchContainer: {
        marginTop: 24,
        alignItems: "center"
    },
    switchText: {
        color: "#5a7559",
        fontSize: 14
    },
    switchTextBold: {
        color: "#5a7559",
        fontWeight: "700"
    },
    errorContainer: {
        backgroundColor: "#fee2e2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444"
    },
    errorText: {
        color: "#991b1b",
        fontSize: 14
    },
    successContainer: {
        backgroundColor: "#d1fae5",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#10b981"
    },
    successText: {
        color: "#065f46",
        fontSize: 14
    }
});

export default LoginScreen;
