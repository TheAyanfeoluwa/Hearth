import React, { useState } from 'react';
import { StyleSheet, TextInput, Image, View, Alert, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/components/Themed';
import { useStore } from '@/store';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const setSession = useStore((state) => state.setSession);

    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    async function signInWithEmail() {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.message
            });
            setLoading(false);
        } else {
            Toast.show({
                type: 'success',
                text1: 'Welcome Home',
                text2: 'Gather round the fire...'
            });
            setSession(data.session);
            // Navigate to home logic is handled by auth state usually, 
            // but we can manually replace route for now
            router.replace('/(tabs)');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Welcome Back', headerTransparent: true }} />

            {/* Placeholder for Logo/Illustration */}
            <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>Hearth</ThemedText>
                <ThemedText style={styles.subtitle}>Gather 'round the fire.</ThemedText>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={[styles.input, { color: textColor, borderColor: tintColor }]}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="Email@example.com"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                />
                <TextInput
                    style={[styles.input, { color: textColor, borderColor: tintColor }]}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: tintColor }]}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    <ThemedText style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.linkButton}>
                    <ThemedText style={styles.linkText}>Don't have an account? Sign Up</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        opacity: 0.8,
    },
    form: {
        gap: 16,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        fontSize: 14,
        opacity: 0.7,
    }
});
