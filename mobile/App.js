import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView } from 'react-native';
import { useState } from 'react';

// Replace 'localhost' with your computer's local IP address if testing on a real device
// e.g., 'http://192.168.1.5:3000/api/recommend'
const API_URL = 'http://localhost:3000/api/recommend';

export default function App() {
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);

    const handleFindDinner = async () => {
        setLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            console.log('Fetching recommendation...');
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: 1 }), // Hardcoded user ID for PoC
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data received:', data);
            setRecommendation(data);
        } catch (err) {
            console.error(err);
            setError("Failed to connect to backend. Make sure the server is running and the IP address is correct.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pantry Pal 🥣</Text>
            <Text style={styles.subtitle}>PoC: Gap Analysis Demo</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Find Dinner Recommendation"
                    onPress={handleFindDinner}
                    disabled={loading}
                />
            </View>

            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {error && <Text style={styles.error}>{error}</Text>}

            {recommendation && (
                <ScrollView style={styles.resultContainer}>
                    <Text style={styles.cardTitle}>{recommendation.recipe.title}</Text>
                    <Text style={styles.matchScore}>Match Score: {recommendation.matchScore}%</Text>

                    <Text style={styles.sectionHeader}>Missing Ingredients:</Text>
                    {recommendation.missing.length > 0 ? (
                        recommendation.missing.map((item, index) => (
                            <Text key={index} style={styles.missingItem}>• {item}</Text>
                        ))
                    ) : (
                        <Text style={styles.successText}>You have everything!</Text>
                    )}

                    <Text style={styles.message}>{recommendation.message}</Text>
                </ScrollView>
            )}

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
    },
    buttonContainer: {
        marginBottom: 20,
        width: '100%',
    },
    error: {
        color: 'red',
        marginTop: 20,
        textAlign: 'center',
    },
    resultContainer: {
        marginTop: 20,
        width: '100%',
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        maxHeight: 300,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    matchScore: {
        fontSize: 18,
        color: '#2e7d32',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    missingItem: {
        fontSize: 16,
        color: '#d32f2f',
        marginLeft: 10,
        marginBottom: 2,
    },
    successText: {
        color: 'green',
        fontStyle: 'italic',
    },
    message: {
        marginTop: 15,
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#555',
    },
});
