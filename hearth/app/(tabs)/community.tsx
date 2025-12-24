import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useThemeColor } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import Colors from '@/constants/Colors';

export default function CommunityScreen() {
    const [mode, setMode] = useState<'friends' | 'search' | 'leaderboard'>('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { session } = useStore();
    const tintColor = useThemeColor({}, 'tint');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        if (session) {
            fetchFriends();
            fetchRequests();
            if (mode === 'leaderboard') fetchLeaderboard();
        }
    }, [session, mode]);

    const fetchFriends = async () => {
        if (!session) return;
        // Fetch accepted friendships where I am A or B
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                user_a_profile:user_a(id, username, avatar_url),
                user_b_profile:user_b(id, username, avatar_url)
            `)
            .or(`user_a.eq.${session.user.id},user_b.eq.${session.user.id}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching friends:', error);
        } else {
            // Process data to get the *other* person's profile
            const formatted = data.map((f: any) => {
                const isA = f.user_a_profile.id === session.user.id;
                return {
                    friendship_id: f.id,
                    profile: isA ? f.user_b_profile : f.user_a_profile
                };
            });
            setFriends(formatted);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, current_streak')
            .order('current_streak', { ascending: false })
            .limit(20);

        if (error) {
            console.error(error);
        } else {
            setLeaderboard(data || []);
        }
        setLoading(false);
    };

    const fetchRequests = async () => {
        if (!session) return;
        // Fetch pending requests SENT TO ME (user_b)
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                user_a_profile:user_a(id, username, avatar_url)
            `)
            .eq('user_b', session.user.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching requests:', error);
        } else {
            setRequests(data || []);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${searchQuery}%`)
            .neq('id', session?.user.id) // Don't find self
            .limit(10);

        if (error) {
            Toast.show({ type: 'error', text1: 'Search failed', text2: error.message });
        } else {
            setSearchResults(data || []);
        }
        setLoading(false);
    };

    const sendFriendRequest = async (userId: string) => {
        const { error } = await supabase
            .from('friendships')
            .insert({
                user_a: session?.user.id,
                user_b: userId,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                Toast.show({ type: 'info', text1: 'Request already sent', text2: 'Or you are already friends.' });
            } else {
                Toast.show({ type: 'error', text1: 'Failed to add', text2: error.message });
            }
        } else {
            Toast.show({ type: 'success', text1: 'Request Sent!' });
        }
    };

    const acceptRequest = async (friendshipId: string) => {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (error) {
            Toast.show({ type: 'error', text1: 'Failed to accept', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Friend Added!' });
            fetchRequests();
            fetchFriends();
        }
    };

    const renderUser = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{item.username}</ThemedText>
            </View>
            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: tintColor }]}
                onPress={() => sendFriendRequest(item.id)}
            >
                <FontAwesome name="user-plus" color="white" size={16} />
            </TouchableOpacity>
        </View>
    );

    const renderFriend = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <Image source={{ uri: item.profile?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{item.profile?.username}</ThemedText>
            </View>
            <View style={styles.onlineIndicator} />
        </View>
    );

    const renderRequest = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Image source={{ uri: item.user_a_profile?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatarSmall} />
                <ThemedText>{item.user_a_profile?.username} wants to add you.</ThemedText>
            </View>
            <TouchableOpacity onPress={() => acceptRequest(item.id)} style={[styles.actionBtn, { backgroundColor: Colors.cozy.grass }]}>
                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Accept</ThemedText>
            </TouchableOpacity>
        </View>
    );

    const renderLeaderboardItem = ({ item, index }: { item: any, index: number }) => (
        <View style={styles.userCard}>
            <ThemedText style={{ width: 30, fontWeight: 'bold', color: index < 3 ? Colors.cozy.flame : '#888' }}>#{index + 1}</ThemedText>
            <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{item.username}</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <FontAwesome name="fire" color={Colors.cozy.flame} size={14} />
                <ThemedText>{item.current_streak || 0}</ThemedText>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Community</ThemedText>
                <View style={styles.tabSwitch}>
                    <TouchableOpacity onPress={() => setMode('friends')} style={{ opacity: mode === 'friends' ? 1 : 0.5 }}>
                        <ThemedText type="defaultSemiBold">Friends</ThemedText>
                    </TouchableOpacity>
                    <View style={{ width: 1, height: 20, backgroundColor: 'gray' }} />
                    <TouchableOpacity onPress={() => setMode('leaderboard')} style={{ opacity: mode === 'leaderboard' ? 1 : 0.5 }}>
                        <ThemedText type="defaultSemiBold">Top</ThemedText>
                    </TouchableOpacity>
                    <View style={{ width: 1, height: 20, backgroundColor: 'gray' }} />
                    <TouchableOpacity onPress={() => setMode('search')} style={{ opacity: mode === 'search' ? 1 : 0.5 }}>
                        <ThemedText type="defaultSemiBold">Find</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {requests.length > 0 && (
                <View style={styles.requestsSection}>
                    <ThemedText type="subtitle" style={{ marginBottom: 10 }}>Pending Requests</ThemedText>
                    <FlatList data={requests} renderItem={renderRequest} keyExtractor={i => i.id} />
                </View>
            )}

            {mode === 'search' ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: tintColor }]}
                            placeholder="Search username..."
                            placeholderTextColor="#888"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity onPress={searchUsers} style={[styles.searchBtn, { backgroundColor: tintColor }]}>
                            <FontAwesome name="search" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
                        <FlatList
                            data={searchResults}
                            renderItem={renderUser}
                            keyExtractor={item => item.id}
                            ListEmptyComponent={<ThemedText style={{ textAlign: 'center', marginTop: 20, opacity: 0.5 }}>No users found.</ThemedText>}
                        />
                    )}
                </View>
            ) : mode === 'leaderboard' ? (
                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 10, padding: 10, backgroundColor: 'rgba(255,165,0,0.1)', borderRadius: 8 }}>
                        <ThemedText style={{ textAlign: 'center', fontSize: 12 }}>🔥 Determined by current streak days</ThemedText>
                    </View>
                    <FlatList
                        data={leaderboard}
                        renderItem={renderLeaderboardItem}
                        keyExtractor={item => item.id}
                        refreshing={loading}
                        onRefresh={fetchLeaderboard}
                    />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={friends}
                        renderItem={renderFriend}
                        keyExtractor={item => item.friendship_id}
                        ListEmptyComponent={<ThemedText style={{ textAlign: 'center', marginTop: 20, opacity: 0.5 }}>No friends yet. Go find some!</ThemedText>}
                    />
                </View>
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
    tabSwitch: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    requestsSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    searchBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 8,
        borderRadius: 10,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
    },
    avatarSmall: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ccc',
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    onlineIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E', // Green
    }
});
