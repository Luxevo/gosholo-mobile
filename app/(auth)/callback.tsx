import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback received with params:', params);
        
        // If we have auth tokens in the URL params, exchange them for a session
        if (params.access_token && params.refresh_token) {
          console.log('Setting session with tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
          });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          
          console.log('Session set successfully:', data);
        }
        
        // Check if user is now authenticated after email confirmation
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/(auth)/login');
          return;
        }

        if (session) {
          // Email confirmed and user is authenticated - root layout will handle navigation
          console.log('Email confirmed and authenticated');
        } else {
          // Email confirmed but user needs to login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        // On error, silently redirect to login
        router.replace('/(auth)/login');
      }
    };

    handleAuthCallback();
  }, [params]);

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#FFFFFF' // Clean white background, no content visible
    }}>
      {/* Hidden processing - user won't see anything */}
    </View>
  );
}