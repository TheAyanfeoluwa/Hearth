import { StyleSheet, Alert, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Campfire } from '@/components/Campfire';
import { ReadingTimer } from '@/components/Timer';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function CampfireScreen() {
  const { session } = useStore();

  const handleSessionEnd = async (seconds: number) => {
    // Here we would open the "Photo Log" modal
    // For now, just save basic session
    const { error } = await supabase.from('sessions').insert({
      user_id: session?.user.id,
      duration_seconds: seconds,
      start_time: new Date(Date.now() - seconds * 1000).toISOString(),
      end_time: new Date().toISOString(),
    });

    if (error) {
      Alert.alert('Error saving session', error.message);
    } else {
      Alert.alert('Session Saved', `You read for ${Math.floor(seconds / 60)} minutes.`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>The Campfire</ThemedText>

      <View style={styles.scene}>
        <Campfire />
        <View style={styles.presenceContainer}>
          <ThemedText style={{ opacity: 0.6 }}>Only you are here...</ThemedText>
          {/* Avatars would map here */}
        </View>
      </View>

      <ReadingTimer onStop={handleSessionEnd} />

      <ThemedText style={styles.quote}>"A book must be the axe for the frozen sea within us."</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  presenceContainer: {
    marginTop: 20,
    height: 60,
    justifyContent: 'center',
  },
  quote: {
    marginTop: 40,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontSize: 14,
    opacity: 0.6,
  }
});
