import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ConfettiCannon from 'react-native-confetti-cannon';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import Colors from '@/constants/Colors';
import { useThemeColor } from '@/components/Themed';

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const CELL_SIZE = (width - 60) / GRID_SIZE;

const TASKS = [
    "Read 30 mins", "Read outside", "Read at night",
    "Read a new genre", "Read 50 pages", "Finish a book",
    "Read with tea", "Read in bed", "Read aloud"
];

// Helper to check for win
const checkWin = (grid: boolean[]) => {
    // Rows
    for (let i = 0; i < 3; i++) {
        if (grid[i * 3] && grid[i * 3 + 1] && grid[i * 3 + 2]) return true;
    }
    // Cols
    for (let i = 0; i < 3; i++) {
        if (grid[i] && grid[i + 3] && grid[i + 6]) return true;
    }
    // Diagonals
    if (grid[0] && grid[4] && grid[8]) return true;
    if (grid[2] && grid[4] && grid[6]) return true;

    return false;
};

export default function BingoScreen() {
    const { session } = useStore();
    const [cardId, setCardId] = useState<string | null>(null);
    const [gridState, setGridState] = useState<boolean[]>(Array(9).fill(false));
    const [loading, setLoading] = useState(true);
    const [won, setWon] = useState(false);
    const [celebrating, setCelebrating] = useState(false);

    const tintColor = useThemeColor({}, 'tint');

    useEffect(() => {
        if (session) fetchCard();
    }, [session]);

    const fetchCard = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bingo_cards')
            .select('*')
            .eq('user_id', session?.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setCardId(data.id);
            setGridState(data.grid_data.checked || Array(9).fill(false));
            if (checkWin(data.grid_data.checked || [])) setWon(true);
        } else {
            createCard();
        }
        setLoading(false);
    };

    const createCard = async () => {
        const initialState = Array(9).fill(false);
        const { data, error } = await supabase
            .from('bingo_cards')
            .insert({
                user_id: session?.user.id,
                season_id: 'season_1',
                grid_data: { checked: initialState, tasks: TASKS } // Store tasks too later if randomized
            })
            .select()
            .single();

        if (data) {
            setCardId(data.id);
            setGridState(initialState);
        }
    };

    const toggleSquare = async (index: number) => {
        const newState = [...gridState];
        newState[index] = !newState[index];
        setGridState(newState);

        // Save to DB
        await supabase
            .from('bingo_cards')
            .update({ grid_data: { checked: newState, tasks: TASKS } })
            .eq('id', cardId);

        // Check win
        if (!won && checkWin(newState)) {
            setWon(true);
            setCelebrating(true);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Reading Bingo', headerBackTitle: 'Profile' }} />

            <View style={styles.header}>
                <ThemedText type="title">Weekly Challenge</ThemedText>
                <ThemedText style={{ opacity: 0.7 }}>Complete a row to win!</ThemedText>
            </View>

            {loading ? <ActivityIndicator size="large" /> : (
                <View style={[styles.grid, { borderColor: tintColor }]}>
                    {gridState.map((checked, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.cell,
                                {
                                    width: CELL_SIZE,
                                    height: CELL_SIZE,
                                    backgroundColor: checked ? Colors.cozy.grass : 'transparent',
                                    borderColor: tintColor
                                }
                            ]}
                            onPress={() => toggleSquare(index)}
                        >
                            <ThemedText style={[styles.cellText, checked && { color: 'white', fontWeight: 'bold' }]}>
                                {TASKS[index]}
                            </ThemedText>
                            {checked && <View style={styles.checkIcon}><FontAwesome name="check" size={16} color="white" /></View>}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {won && (
                <View style={styles.winMessage}>
                    <ThemedText type="subtitle" style={{ color: Colors.cozy.flame }}>BINGO! 🎉</ThemedText>
                    <ThemedText>You're on fire!</ThemedText>
                </View>
            )}

            {celebrating && (
                <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} onAnimationEnd={() => setCelebrating(false)} />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    header: {
        marginTop: 20,
        marginBottom: 40,
        alignItems: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 2,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    cell: {
        borderWidth: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    cellText: {
        fontSize: 12,
        textAlign: 'center',
    },
    checkIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    winMessage: {
        marginTop: 40,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
    }
});
