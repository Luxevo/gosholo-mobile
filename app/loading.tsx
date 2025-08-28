import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#FFFFFF' 
    }}>
      <ActivityIndicator size="large" color="#FF6233" />
      <Text style={{ 
        marginTop: 16, 
        fontSize: 16, 
        color: '#666', 
        fontWeight: '500' 
      }}>
        Loading...
      </Text>
    </View>
  );
}