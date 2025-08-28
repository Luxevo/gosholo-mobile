// app/_layout.tsx - Root layout
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Auto-navigate based on session state
    if (!isLoading) {
      if (session) {
        // User is logged in, redirect to main app
        router.replace('/(tabs)');
      } else {
        // User is not logged in, redirect to login
        router.replace('/(auth)/login');
      }
    }
  }, [session, isLoading]);

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

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="loading" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}/>
  );
}