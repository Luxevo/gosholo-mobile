import LanguageSwitcher from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
  const [loggingOut, setLoggingOut] = useState(false);

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
      t('delete_account', 'Delete Account'),
      t('delete_account_confirm', 'Are you sure you want to delete your account? This action cannot be undone.'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete', 'Delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('contact_support', 'Contact Support'),
              t('delete_account_support', 'To delete your account, please contact support at support@gosholo.com')
            );
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
});
