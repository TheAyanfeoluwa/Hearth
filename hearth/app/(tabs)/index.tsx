import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Soundscape } from '@/components/Soundscape';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { useThemeColor } from '@/components/Themed';
import { useCampfirePresence } from '@/hooks/useCampfirePresence';
import Colors from '@/constants/Colors';

export default function CampfireScreen() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentBook, setCurrentBook] = useState<string | null>("The Hobbit");
  const [showModal, setShowModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { session } = useStore();
  const { presenceUsers } = useCampfirePresence();
  const tintColor = useThemeColor({}, 'tint');

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  useEffect(() => {
    fetchActiveBook();
  }, []);

  const fetchActiveBook = async () => {
    if (!session) return;

    // Find the most recently updated 'reading' book
    const { data, error } = await supabase
      .from('shelves')
      .select('*, book:books(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'reading')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (data && data.book) {
      setCurrentBook(data.book.title);
    } else {
      setCurrentBook("No book selected");
    }
  };

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

  const handleEnd = () => {
    setIsActive(false);
    if (seconds > 5) { // 5s threshold for testing
      setShowModal(true);
    } else {
      setSeconds(0);
      Toast.show({ type: 'info', text1: 'Session too short', text2: 'Read a bit longer to log it!' });
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setTempImage(result.assets[0].uri);
    }
  };

  const finishSession = async () => {
    setUploading(true);
    let photoUrl = null;

    if (tempImage && session) {
      try {
        const response = await fetch(tempImage);
        const blob = await response.blob();
        const ext = tempImage.substring(tempImage.lastIndexOf('.') + 1);
        const fileName = `${session.user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('session_photos')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) {
          // If bucket doesn't exist, this fails. 
          // Ideally we handle this gracefully
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('session_photos')
          .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
      } catch (e: any) {
        console.error(e);
        // Continue saving session even if photo fails, but warn user
        Toast.show({ type: 'error', text1: 'Photo upload failed', text2: 'Saving session without photo.' });
      }
    }

    const { error } = await supabase.from('sessions').insert({
      user_id: session?.user.id,
      duration_seconds: seconds,
      photo_log_url: photoUrl
    });

    if (error) {
      Toast.show({ type: 'error', text1: 'Failed to save session', text2: error.message });
    } else {
      Toast.show({ type: 'success', text1: 'Session Saved!', text2: photoUrl ? 'With photo log!' : '' });
    }

    setUploading(false);
    setShowModal(false);
    setSeconds(0);
    setTempImage(null);
  };

  // Color palette for user avatars
  const avatarColors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFD93D', '#A8E6CF', '#FFB6C1'];

  // Reusable Modal Component to avoid duplication
  const SessionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showModal}
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle">Session Complete!</ThemedText>
          <ThemedText style={{ marginBottom: 20 }}>You read for {Math.floor(seconds / 60)} minutes.</ThemedText>

          <TouchableOpacity onPress={pickImage} style={styles.photoPlaceholder}>
            {tempImage ? (
              <Image source={{ uri: tempImage }} style={styles.previewImage} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <FontAwesome name="camera" size={32} color="#888" />
                <ThemedText style={{ fontSize: 12, marginTop: 8 }}>Add Photo Log</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={finishSession}
            disabled={uploading}
          >
            {uploading ? <ActivityIndicator color="white" /> : <ThemedText style={styles.saveButtonText}>Save to Journal</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 16 }}>
            <ThemedText style={{ opacity: 0.6 }}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );

  if (isDesktop) {
    return (
      <ThemedView style={[styles.container, styles.desktopContainer]}>
        <View style={styles.leftPanel}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.appName}>Hearth</ThemedText>
            <ThemedText style={styles.tagline}>Gather round, read together</ThemedText>
          </View>

          <View style={styles.desktopControlsContainer}>
            {currentBook && (
              <View style={styles.bookInfo}>
                <FontAwesome name="book" size={16} color={tintColor} />
                <ThemedText style={styles.bookText}>Reading: {currentBook}</ThemedText>
              </View>
            )}

            <View style={styles.timerContainer}>
              <ThemedText style={styles.timer}>{formatTime(seconds)}</ThemedText>
            </View>

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
          </View>

          <Soundscape />
        </View>

        <View style={styles.rightPanel}>
          <View style={[styles.campfireContainer, { height: 600, width: 600 }]}>
            <Image
              source={require('@/assets/images/hearth_flame_character.png')}
              style={{ width: 250, height: 250 }}
              contentFit="contain"
            />
            {presenceUsers.map((user, index) => {
              const angle = (index * 2 * Math.PI) / Math.max(presenceUsers.length, 1);
              const radius = 220;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const initial = user.username?.[0]?.toUpperCase() || '?';
              const color = avatarColors[index % avatarColors.length];

              return (
                <View
                  key={user.user_id}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: user.avatar_url ? '#fff' : color,
                      left: '50%',
                      top: '50%',
                      transform: [{ translateX: x }, { translateY: y }]
                    }
                  ]}
                >
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <ThemedText style={styles.avatarText}>{initial}</ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        <SessionModal />
      </ThemedView>
    );
  }

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
          const angle = (index * 2 * Math.PI) / Math.max(presenceUsers.length, 1);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const initial = user.username?.[0]?.toUpperCase() || '?';
          const color = avatarColors[index % avatarColors.length];

          return (
            <View
              key={user.user_id}
              style={[
                styles.avatar,
                {
                  backgroundColor: user.avatar_url ? '#fff' : color,
                  left: `50%`,
                  top: `50%`,
                  transform: [
                    { translateX: x },
                    { translateY: y },
                  ]
                }
              ]}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <ThemedText style={styles.avatarText}>{initial}</ThemedText>
              )}
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

      {/* Soundscape */}
      <Soundscape />

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

      <SessionModal />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 60,
  },
  leftPanel: {
    flex: 1,
    maxWidth: 400,
    justifyContent: 'center',
    paddingRight: 40,
    gap: 40,
  },
  rightPanel: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopControlsContainer: {
    alignItems: 'center',
    gap: 20,
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
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
    marginLeft: -20, // Center the absolute positioned element
    marginTop: -20,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
