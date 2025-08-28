import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMobileUser } from '@/hooks/useMobileUser';
import { supabase } from '@/lib/supabase';
  
export default function ProfileScreen() {
  const { profile, loading, error } = useMobileUser();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    
    Alert.prompt(
      'Change Password',
      'Enter your new password:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsChangingPassword(false),
        },
        {
          text: 'Update',
          onPress: async (newPassword) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert('Error', 'Password must be at least 6 characters');
              setIsChangingPassword(false);
              return;
            }

            try {
              const { error } = await supabase.auth.updateUser({
                password: newPassword
              });

              if (error) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Success', 'Password updated successfully');
              }
            } catch (err) {
              console.error('Password update error:', err);
              Alert.alert('Error', 'Failed to update password');
            } finally {
              setIsChangingPassword(false);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', 'Failed to logout');
            }
            // Root layout will handle navigation
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6233" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Text style={styles.errorDetails}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{profile?.username || 'Unknown'}</Text>
            <Text style={styles.email}>{profile?.email || 'No email'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#016167" />
            <Text style={styles.menuText}>Change Password</Text>
            {isChangingPassword && <ActivityIndicator size="small" color="#FF6233" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart-outline" size={20} color="#016167" />
            <Text style={styles.menuText}>My Favorites</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6233" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#016167',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6233',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6233',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#016167',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666666',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#016167',
    marginLeft: 12,
  },
  comingSoon: {
    fontSize: 12,
    color: '#FF6233',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutText: {
    color: '#FF6233',
  },
}); 