import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import Colors from '@/constants/Colors';
import { useThemeColor } from './Themed';

interface TimerProps {
    onStop: (seconds: number) => void;
}

export function ReadingTimer({ onStop }: TimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else if (!isActive && intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const stopTimer = () => {
        setIsActive(false);
        onStop(seconds);
        setSeconds(0);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <ThemedText style={[styles.timerText, { fontVariant: ['tabular-nums'] }]}>
                {formatTime(seconds)}
            </ThemedText>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.button, { borderColor: tintColor }]}
                    onPress={toggleTimer}
                >
                    <ThemedText style={{ color: tintColor, fontWeight: 'bold' }}>
                        {isActive ? 'PAUSE' : 'START'}
                    </ThemedText>
                </TouchableOpacity>

                {seconds > 0 && !isActive && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: Colors.cozy.ember, borderColor: Colors.cozy.ember }]}
                        onPress={stopTimer}
                    >
                        <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>
                            FINISH
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    timerText: {
        fontSize: 64,
        fontWeight: '200', // Thin minimalist look
        letterSpacing: 2,
        marginBottom: 20,
        fontFamily: 'SpaceMono' // Monospace for timer alignment if available, else standard
    },
    controls: {
        flexDirection: 'row',
        gap: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 30,
        borderWidth: 2,
    }
});
