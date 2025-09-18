// app/_layout.tsx - Root layout
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import WelcomeModal from '@/components/WelcomeModal';

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
    <>
      <Stack screenOptions={{ headerShown: false }}/>
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </>
  );
}