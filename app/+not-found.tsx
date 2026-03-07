import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  const [showContent, setShowContent] = useState(false);

  // On cold start from deep links, Expo Router may land here before
  // _layout.tsx has saved the deep link data to AsyncStorage.
  // Retry a few times before giving up.
  useEffect(() => {
    let cancelled = false;

    const checkDeepLink = async () => {
      for (let i = 0; i < 6; i++) {
        if (cancelled) return;
        const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
        if (deepLinkData) {
          router.replace('/');
          return;
        }
        // Wait 300ms before retrying
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!cancelled) setShowContent(true);
    };
    checkDeepLink();

    return () => { cancelled = true; };
  }, []);

  if (!showContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6233" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
