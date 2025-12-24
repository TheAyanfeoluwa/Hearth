import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, View, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { Image as ExpoImage } from 'expo-image';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { searchBooks, OpenLibraryBook, getCoverUrl } from '@/lib/openLibrary';
import { BookSearchCard } from '@/components/BookSearchCard';
import { useThemeColor } from '@/components/Themed';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ShelfScreen() {
    const [mode, setMode] = useState<'shelf' | 'search'>('shelf');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [myBooks, setMyBooks] = useState<any[]>([]);
    const { session } = useStore();

    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        if (mode === 'shelf') {
            fetchMyShelf();
        }
    }, [mode]);

    const fetchMyShelf = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('shelves')
            .select(`
                *,
                book:books(*)
            `)
            .eq('user_id', session?.user.id);

        if (error) {
            console.error(error);
        } else {
            setMyBooks(data || []);
        }
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        const results = await searchBooks(searchQuery);
        // Filter out books without ISBNs because our DB requires ISBN PK
        const validResults = results.filter(b => b.isbn && b.isbn.length > 0);
        setSearchResults(validResults);
        setLoading(false);
    };

    const addToShelf = async (book: OpenLibraryBook) => {
        const isbn = book.isbn?.[0]; // Take first ISBN
        if (!isbn) return;

        // 1. Ensure Book is in 'books' table
        const { error: bookError } = await supabase.from('books').upsert({
            isbn: isbn,
            title: book.title,
            author: book.author_name?.[0] || 'Unknown',
            cover_url: getCoverUrl(book.cover_i, 'L'),
            total_pages: book.number_of_pages_median || 0,
        }, { onConflict: 'isbn' });

        if (bookError) {
            Toast.show({ type: 'error', text1: 'Error adding book info', text2: bookError.message });
            return;
        }

        // 2. Add to Shelf
        const { error: shelfError } = await supabase.from('shelves').insert({
            user_id: session?.user.id,
            book_isbn: isbn,
            status: 'tbr' // Default status
        });

        if (shelfError) {
            if (shelfError.code === '23505') { // Unique violation
                Toast.show({ type: 'info', text1: 'Already on shelf', text2: 'This book is already in your library.' });
            } else {
                Toast.show({ type: 'error', text1: 'Could not add to shelf', text2: shelfError.message });
            }
        } else {
            Toast.show({ type: 'success', text1: 'Book Added!', text2: `Added "${book.title}" to your shelf.` });
            setMode('shelf'); // Go back to shelf
        }
    };

    const renderMyBook = ({ item }: { item: any }) => (
        <View style={styles.myBookCard}>
            <ExpoImage source={{ uri: item.book.cover_url }} style={styles.myBookCover} contentFit="cover" />
            <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{item.book.title}</ThemedText>
                <ThemedText style={{ opacity: 0.7 }}>{item.book.author}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <ThemedText style={styles.statusText}>{item.status.toUpperCase()}</ThemedText>
                </View>
            </View>
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reading': return Colors.cozy.flame;
            case 'read': return Colors.cozy.grass;
            default: return 'gray';
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">
                    {mode === 'shelf' ? 'My Bookshelf' : 'Add New Book'}
                </ThemedText>
                <TouchableOpacity onPress={() => setMode(mode === 'shelf' ? 'search' : 'shelf')}>
                    <FontAwesome name={mode === 'shelf' ? 'plus' : 'times'} size={24} color={tintColor} />
                </TouchableOpacity>
            </View>

            {mode === 'search' && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={[styles.searchInput, { color: textColor, borderColor: tintColor }]}
                        placeholder="Search by title or author..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity onPress={handleSearch} style={[styles.searchButton, { backgroundColor: tintColor }]}>
                        <FontAwesome name="search" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={tintColor} style={{ marginTop: 50 }} />
            ) : (
                mode === 'shelf' ? (
                    <FlatList
                        data={myBooks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMyBook}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={<ThemedText style={{ textAlign: 'center', marginTop: 50, opacity: 0.5 }}>No books yet. Tap + to add one.</ThemedText>}
                    />
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item }) => <BookSearchCard book={item} onAdd={addToShelf} />}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    searchButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    myBookCard: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    myBookCover: {
        width: 50,
        height: 75,
        borderRadius: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold',
    }
});
