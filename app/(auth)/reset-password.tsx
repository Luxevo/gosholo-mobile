import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  error: '#EF4444',
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

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ new?: string; confirm?: string }>({});
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return minLength && hasUppercase && hasLowercase && hasNumber;
  };

  const handleResetPassword = async () => {
    // Reset errors
    setErrors({});

    // Validate new password
    if (!validatePassword(newPassword)) {
      setErrors(prev => ({ ...prev, new: t('password_requirements') }));
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirm: t('passwords_not_match') }));
      return;
    }

    setLoading(true);

    try {
      // Update to new password (user already has session from recovery link)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert(t('error'), t('password_update_failed'));
        return;
      }

      // Success
      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(t('error'), t('password_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>{t('success')}</Text>
          <Text style={styles.successText}>{t('password_updated')}</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.continueButtonText}>{t('start_exploring')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>{t('reset_password_title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>{t('reset_password_subtitle')}</Text>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('new_password')}</Text>
            <View style={[styles.inputContainer, errors.new && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('enter_new_password')}
                placeholderTextColor={COLORS.lightGray}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={COLORS.lightGray}
                />
              </TouchableOpacity>
            </View>
            {errors.new && <Text style={styles.errorText}>{errors.new}</Text>}
            <Text style={styles.hint}>{t('password_hint')}</Text>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('confirm_new_password')}</Text>
            <View style={[styles.inputContainer, errors.confirm && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('confirm_password_placeholder')}
                placeholderTextColor={COLORS.lightGray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={COLORS.lightGray}
                />
              </TouchableOpacity>
            </View>
            {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>{t('update_password')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  placeholder: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.darkGray,
    lineHeight: 22,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: 16,
    color: COLORS.ink,
  },
  eyeButton: {
    padding: SPACING.lg,
  },
  hint: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.ink,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  continueButton: {
    backgroundColor: COLORS.ink,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
