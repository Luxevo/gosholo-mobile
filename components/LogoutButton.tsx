import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function LogoutButton() {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
            // Root layout will handle navigation automatically
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        backgroundColor: '#FF6233',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        margin: 16,
      }}
    >
      <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
        Logout
      </Text>
    </TouchableOpacity>
  );
}