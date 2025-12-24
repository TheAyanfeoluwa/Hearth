import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { useThemeColor } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function CampfireScreen() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentBook, setCurrentBook] = useState<string | null>("The Hobbit"); // Placeholder
  const { session } = useStore();
  const tintColor = useThemeColor({}, 'tint');

  // Timer logic
  React.useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEnd = async () => {
    setIsActive(false);
    if (seconds > 0) {
      const { error } = await supabase.from('sessions').insert({
        user_id: session?.user.id,
        duration_seconds: seconds,
      });
      if (error) {
        Toast.show({ type: 'error', text1: 'Failed to save session', text2: error.message });
      } else {
        Toast.show({ type: 'success', text1: 'Session Saved!', text2: `You read for ${Math.floor(seconds / 60)} minutes.` });
      }
    }
    setSeconds(0);
  };

  // Mock presence data (in reality, this would come from Supabase Realtime)
  const presenceUsers = [
    { id: 1, initial: 'A', color: '#FF6B6B' },
    { id: 2, initial: 'B', color: '#4ECDC4' },
    { id: 3, initial: 'C', color: '#95E1D3' },
    { id: 4, initial: 'D', color: '#FFD93D' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.appName}>Hearth</ThemedText>
        <ThemedText style={styles.tagline}>Gather round, read together</ThemedText>
      </View>

      {/* Flame + Presence Circle */}
      <View style={styles.campfireContainer}>
        <Image
          source={require('@/assets/images/hearth_flame_character.png')}
          style={styles.flameImage}
          contentFit="contain"
        />

        {/* Presence avatars positioned around the flame */}
        {presenceUsers.map((user, index) => {
          // Position avatars in a circle around the flame
          const angle = (index * 2 * Math.PI) / presenceUsers.length;
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <View
              key={user.id}
              style={[
                styles.avatar,
                {
                  backgroundColor: user.color,
                  left: `50%`,
                  top: `50%`,
                  transform: [
                    { translateX: x },
                    { translateY: y },
                  ]
                }
              ]}
            >
              <ThemedText style={styles.avatarText}>{user.initial}</ThemedText>
            </View>
          );
        })}
      </View>

      {/* Current Book */}
      {currentBook && (
        <View style={styles.bookInfo}>
          <FontAwesome name="book" size={16} color={tintColor} />
          <ThemedText style={styles.bookText}>Reading: {currentBook}</ThemedText>
        </View>
      )}

      {/* Timer */}
      <View style={styles.timerContainer}>
        <ThemedText style={styles.timer}>{formatTime(seconds)}</ThemedText>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => setIsActive(!isActive)}
        >
          <FontAwesome name={isActive ? "pause" : "play"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endButton, { backgroundColor: tintColor }]}
          onPress={handleEnd}
        >
          <ThemedText style={styles.endButtonText}>End</ThemedText>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    opacity: 0.7,
  },
  campfireContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  flameImage: {
    width: 150,
    height: 150,
  },
  avatar: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  bookText: {
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButton: {
    paddingHorizontal: 32,
    width: 'auto',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
