import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

export default function ShelfScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">My Bookshelf</ThemedText>
            <ThemedText>Coming soon: Books & Leaderboard</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 10,
    },
});
