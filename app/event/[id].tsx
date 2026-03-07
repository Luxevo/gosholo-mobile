import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function EventDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    const handle = async () => {
      if (id) {
        await AsyncStorage.setItem('@gosholo_deep_link', JSON.stringify({ type: 'event', id }));
      }
      router.replace('/');
    };
    handle();
  }, [id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6233" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
