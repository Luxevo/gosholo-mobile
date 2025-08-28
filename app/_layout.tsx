// app/_layout.tsx - Root layout
import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  useEffect(() => {
    // Handle deep links from email confirmations
    const handleDeepLink = (url: string) => {
      if (url.includes('auth/callback')) {
        console.log('Auth callback deep link received:', url);
        
        // Parse hash fragments from Supabase URL
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const hashParams = url.substring(hashIndex + 1);
          const params = new URLSearchParams(hashParams);
          
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          
          if (access_token && refresh_token) {
            // Navigate to callback with parsed parameters
            router.push({
              pathname: '/(auth)/callback',
              params: {
                access_token,
                refresh_token,
                expires_at: params.get('expires_at'),
                expires_in: params.get('expires_in'),
                token_type: params.get('token_type'),
                type: params.get('type')
              }
            });
          }
        }
      }
    };

    // Listen for app launch via deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}/>
  );
}