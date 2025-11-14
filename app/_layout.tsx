// app/_layout.tsx - Root layout
import WelcomeModal from '@/components/WelcomeModal';
import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

const WELCOME_MODAL_KEY = '@gosholo_welcome_seen';

export default function RootLayout() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal only if user hasn't seen it before
  useEffect(() => {
    const checkWelcomeModal = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem(WELCOME_MODAL_KEY);
        if (!hasSeenWelcome) {
          // Show modal after a short delay to ensure app is loaded
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking welcome modal:', error);
      }
    };

    checkWelcomeModal();
  }, []);

  const handleCloseWelcomeModal = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_MODAL_KEY, 'true');
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Error saving welcome modal state:', error);
      setShowWelcomeModal(false);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 400,
        }}
      />
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </I18nextProvider>
  );
}