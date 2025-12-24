import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ScrollView, View, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useThemeColor } from '@/components/Themed';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

export default function ProfileScreen() {
  const { session, userProfile, setUserProfile } = useStore();
  const [stats, setStats] = useState({ totalHours: 0, booksRead: 0 });
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Profile (refresh)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single();
    if (profile) setUserProfile(profile);

    // Fetch Sessions (for hours & photos)
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('start_time', { ascending: false });

    if (sessionData) {
      const totalSeconds = sessionData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
      const validPhotos = sessionData.filter(s => s.photo_log_url).map(s => ({ id: s.id, url: s.photo_log_url }));
      setPhotos(validPhotos);

      // Fetch Books Read Count
      const { count } = await supabase
        .from('shelves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id)
        .eq('status', 'read');

      setStats({
        totalHours: Math.floor(totalSeconds / 3600),
        booksRead: count || 0
      });
    }
    setLoading(false);
  };

  const renderPhoto = ({ item }: { item: any }) => (
    <Image source={{ uri: item.url }} style={styles.photoItem} contentFit="cover" />
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: userProfile?.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <ThemedText type="title" style={{ marginTop: 10 }}>{userProfile?.username || 'Wanderer'}</ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors.cozy.wood }]}>
            <ThemedText style={styles.badgeText}>{userProfile?.subscription_tier?.toUpperCase() || 'WANDERER'}</ThemedText>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <FontAwesome name="fire" size={24} color={Colors.cozy.flame} />
            <ThemedText type="subtitle">{userProfile?.current_streak || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
          </View>
          <View style={styles.statBox}>
            <FontAwesome name="hourglass" size={24} color={Colors.cozy.sky} />
            <ThemedText type="subtitle">{stats.totalHours}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Hours</ThemedText>
          </View>
          <View style={styles.statBox}>
            <FontAwesome name="book" size={24} color={Colors.cozy.grass} />
            <ThemedText type="subtitle">{stats.booksRead}</ThemedText>
            <ThemedText style={styles.statLabel}>Books Read</ThemedText>
          </View>
        </View>

        <Link href="/bingo" asChild>
          <TouchableOpacity style={[styles.bingoBtn, { backgroundColor: Colors.cozy.cream }]}>
            <ThemedText style={{ color: Colors.cozy.wood, fontWeight: 'bold' }}>Play Reading Bingo 🎲</ThemedText>
          </TouchableOpacity>
        </Link>

        {/* Photo Grid */}
        <ThemedText type="subtitle" style={{ marginTop: 30, marginBottom: 15 }}>Cozy Moments</ThemedText>
        {photos.length === 0 ? (
          <ThemedText style={{ opacity: 0.5, fontStyle: 'italic' }}>No photos yet. End a session to log one!</ThemedText>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map(p => (
              <View key={p.id} style={styles.photoWrapper}>
                <Image source={{ uri: p.url }} style={styles.photoItem} contentFit="cover" />
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  statBox: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoItem: {
    width: '100%',
    height: '100%',
  },
  bingoBtn: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  }
});
