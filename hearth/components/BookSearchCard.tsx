import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './ui/ThemedText';
import { ThemedView } from './ui/ThemedView';
import { OpenLibraryBook, getCoverUrl } from '@/lib/openLibrary';
import Colors from '@/constants/Colors';
import { useThemeColor } from './Themed';

interface BookCardProps {
    book: OpenLibraryBook;
    onAdd: (book: OpenLibraryBook) => void;
}

export function BookSearchCard({ book, onAdd }: BookCardProps) {
    const coverUrl = getCoverUrl(book.cover_i);
    const tintColor = useThemeColor({}, 'tint');

    return (
        <View style={styles.container}>
            <Image
                source={coverUrl ? { uri: coverUrl } : require('@/assets/images/icon.png')}
                style={styles.cover}
                contentFit="cover"
            />
            <View style={styles.info}>
                <ThemedText type="defaultSemiBold" numberOfLines={2}>{book.title}</ThemedText>
                <ThemedText style={styles.author} numberOfLines={1}>
                    {book.author_name?.join(', ') || 'Unknown Author'}
                </ThemedText>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: tintColor }]}
                    onPress={() => onAdd(book)}
                >
                    <ThemedText style={styles.addButtonText}>Add to Shelf</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        gap: 12,
    },
    cover: {
        width: 60,
        height: 90,
        borderRadius: 4,
        backgroundColor: '#ccc',
    },
    info: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    author: {
        opacity: 0.7,
        fontSize: 14,
    },
    addButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
