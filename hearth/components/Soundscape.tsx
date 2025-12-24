import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from './ui/ThemedText';
import { useStore } from '@/store';

type SoundType = 'fire' | 'rain' | 'off';

export function Soundscape() {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentSound, setCurrentSound] = useState<SoundType>('off');
    const { isSoundOn } = useStore();

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const playSound = async (type: SoundType) => {
        // Stop current sound if playing
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }

        if (type === 'off') {
            setCurrentSound('off');
            return;
        }

        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                type === 'fire'
                    ? require('@/assets/sounds/fire.mp3')
                    : require('@/assets/sounds/rain.mp3'),
                { shouldPlay: true, isLooping: true, volume: 0.3 }
            );
            setSound(newSound);
            setCurrentSound(type);
        } catch (error) {
            console.error('Error loading sound:', error);
        }
    };

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>Atmosphere</ThemedText>
            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.button, currentSound === 'fire' && styles.activeButton]}
                    onPress={() => playSound('fire')}
                >
                    <FontAwesome name="fire" size={20} color={currentSound === 'fire' ? '#FF6B35' : '#888'} />
                    <ThemedText style={[styles.buttonText, currentSound === 'fire' && styles.activeText]}>
                        Fire
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, currentSound === 'rain' && styles.activeButton]}
                    onPress={() => playSound('rain')}
                >
                    <FontAwesome name="tint" size={20} color={currentSound === 'rain' ? '#4A90E2' : '#888'} />
                    <ThemedText style={[styles.buttonText, currentSound === 'rain' && styles.activeText]}>
                        Rain
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, currentSound === 'off' && styles.activeButton]}
                    onPress={() => playSound('off')}
                >
                    <FontAwesome name="volume-off" size={20} color={currentSound === 'off' ? '#666' : '#888'} />
                    <ThemedText style={[styles.buttonText, currentSound === 'off' && styles.activeText]}>
                        Silent
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    label: {
        fontSize: 12,
        opacity: 0.6,
        marginBottom: 8,
        textAlign: 'center',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    buttonText: {
        fontSize: 12,
        opacity: 0.6,
    },
    activeText: {
        opacity: 1,
        fontWeight: 'bold',
    },
});
