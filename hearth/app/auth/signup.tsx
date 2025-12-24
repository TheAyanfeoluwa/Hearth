import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Alert, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/components/Themed';
import { useStore } from '@/store';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const setSession = useStore((state) => state.setSession);

    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    async function signUpWithEmail() {
        if (!username) {
            Toast.show({
                type: 'error',
                text1: 'Username Required',
                text2: 'Please enter a username to continue.'
            });
            return;
        }
        setLoading(true);

        // Pass username in metadata so the Trigger can pick it up
        const { data: { session, user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                },
            },
        });

        if (error) {
            Toast.show({
                type: 'error',
                text1: 'Sign Up Failed',
                text2: error.message
            });
            setLoading(false);
            return;
        }

        if (session) {
            setSession(session);
            router.replace('/(tabs)');
        } else {
            Toast.show({
                type: 'success',
                text1: 'Check your email!',
                text2: 'We sent you a verification link.'
            });
            setLoading(false);
        }
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Join the Circle', headerTransparent: true }} />

            <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>New Ember</ThemedText>
                <ThemedText style={styles.subtitle}>Begin your reading journey.</ThemedText>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={[styles.input, { color: textColor, borderColor: tintColor }]}
                    onChangeText={(text) => setUsername(text)}
                    value={username}
                    placeholder="Username"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                />
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
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    <ThemedText style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
                    <ThemedText style={styles.linkText}>Already have an account? Sign in</ThemedText>
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
        fontSize: 40,
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
