// app/_layout.tsx - Root layout
import WelcomeModal from '@/components/WelcomeModal';
import i18n from '@/i18n';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

export default function RootLayout() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal after app loads
  useEffect(() => {
    // Show modal after a short delay to ensure app is loaded
    setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1000);
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <Stack screenOptions={{ headerShown: false }}/>
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </I18nextProvider>
  );
}