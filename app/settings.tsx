import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AvatarPicker, AvatarDisplay, AvatarId } from '@/components/AvatarPicker';
import { supabase } from '@/lib/supabase';
import { useMobileUser } from '@/hooks/useMobileUser';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  border: '#E5E5E5',
  primary: '#FF6233',
  success: '#10B981',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { profile, updateProfile, refetch: refetchProfile } = useMobileUser();
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile editing state
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setSelectedAvatar((profile.avatar_url as AvatarId) || null);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const usernameChanged = username !== (profile.username || '');
      const avatarChanged = selectedAvatar !== (profile.avatar_url || null);
      setHasChanges(usernameChanged || avatarChanged);
    }
  }, [username, selectedAvatar, profile]);

  const handleSaveProfile = async () => {
    if (!profile) {
      Alert.alert(t('error'), 'No profile found');
      return;
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      Alert.alert(t('error'), t('invalid_username'));
      return;
    }

    setSavingProfile(true);
    try {
      // Check if username is taken (if changed)
      if (username && username !== profile.username) {
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', profile.id)
          .maybeSingle();

        if (checkError) {
          console.error('Username check error:', checkError);
        }

        if (existing) {
          Alert.alert(t('error'), t('username_taken'));
          setSavingProfile(false);
          return;
        }
      }

      // Update profile using the hook's updateProfile function
      await updateProfile({
        username: username || null,
        avatar_url: selectedAvatar || null,
      });

      // Refetch to ensure profile screen gets updated data
      await refetchProfile();

      setHasChanges(false);
      Alert.alert(t('success'), t('profile_updated', 'Profile updated successfully'));
    } catch (err: any) {
      console.error('Save profile error:', err);
      const errorMessage = err?.message || t('profile_update_failed', 'Failed to update profile');
      Alert.alert(t('error'), errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await supabase.auth.signOut();
              router.replace('/(tabs)');
            } catch (err) {
              console.error('Logout error:', err);
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account'),
      t('delete_account_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Get profile info for logging
                const { data: profile } = await supabase
                  .from('mobile_user_profiles')
                  .select('username, email')
                  .eq('id', user.id)
                  .single();

                // Log deletion for records
                await supabase.from('deleted_accounts').insert({
                  user_id: user.id,
                  email: profile?.email || user.email,
                  username: profile?.username,
                });

                // Delete user data from related tables
                await supabase.from('user_favorite_offers').delete().eq('user_id', user.id);
                await supabase.from('user_favorite_events').delete().eq('user_id', user.id);
                await supabase.from('user_favorite_commerces').delete().eq('user_id', user.id);
                await supabase.from('mobile_user_profiles').delete().eq('id', user.id);

                // Delete from auth.users via Edge Function
                await supabase.functions.invoke('delete-user');

                // Sign out and redirect
                await supabase.auth.signOut();
                router.replace('/(tabs)');
              }
            } catch (err) {
              console.error('Delete account error:', err);
              Alert.alert(t('error'), t('delete_account_error'));
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tab_profile', 'Profile')}</Text>

            <View style={styles.settingsGroup}>
              {/* Avatar Picker */}
              <View style={styles.avatarSection}>
                <View style={styles.currentAvatarRow}>
                  <AvatarDisplay avatarId={selectedAvatar} size={60} />
                  <Text style={styles.avatarHint}>{t('choose_avatar')}</Text>
                </View>
                <View style={styles.avatarPickerContainer}>
                  <AvatarPicker
                    selectedAvatar={selectedAvatar}
                    onSelect={setSelectedAvatar}
                  />
                </View>
              </View>

              <View style={styles.separator} />

              {/* Username Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('username')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t('enter_username')}
                  placeholderTextColor={COLORS.lightGray}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                <Text style={styles.inputHint}>{t('username_hint')}</Text>
              </View>

              {/* Save Button */}
              {hasChanges && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                      <Text style={styles.saveButtonText}>{t('apply', 'Save')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <LanguageSwitcher />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account', 'Account')}</Text>

          <View style={styles.settingsGroup}>
            {/* Change Password */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/change-password' as any)}
            >
              <Ionicons name="key-outline" size={22} color={COLORS.ink} />
              <Text style={styles.settingLabel}>{t('change_password')}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Ionicons name="mail-outline" size={22} color={COLORS.ink} />
              <Text style={styles.settingLabel}>{t('forgot_password')}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Logout */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.ink} />
              {loggingOut ? (
                <ActivityIndicator size="small" color={COLORS.ink} style={styles.settingLabel} />
              ) : (
                <Text style={styles.settingLabel}>{t('logout')}</Text>
              )}
              <View style={styles.spacer} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.ink} />
              <Text style={styles.settingLabel}>{t('delete_account', 'Delete Account')}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  settingsGroup: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.ink,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.lg + 22 + SPACING.md,
  },
  spacer: {
    width: 20,
  },
  avatarSection: {
    padding: SPACING.lg,
  },
  currentAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatarHint: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  avatarPickerContainer: {
    marginTop: SPACING.sm,
  },
  inputSection: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.ink,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: SPACING.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
