import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  const [showContent, setShowContent] = useState(false);

  // Check if this is a deep link redirect — if so, go to the splash screen
  // and let the normal flow handle it
  useEffect(() => {
    const checkDeepLink = async () => {
      const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
      if (deepLinkData) {
        router.replace('/');
        return;
      }
      // Delay showing "not found" to allow auth redirects to process
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    };
    checkDeepLink();
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
