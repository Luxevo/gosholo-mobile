import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  primary: '#FF6233',
  teal: '#016167',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  error: '#EF4444',
  success: '#10B981',
  green: '#B2FD9D',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUsername = (value: string): boolean => {
    // Username: 3-20 chars, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value);
  };

  const handleRegister = async () => {
    setError(null);

    // Validate all fields
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('fill_all_fields'));
      return;
    }

    if (!validateUsername(username.trim())) {
      setError(t('invalid_username'));
      return;
    }

    if (!validateEmail(email.trim())) {
      setError(t('invalid_email'));
      return;
    }

    if (!validatePassword(password)) {
      setError(t('password_requirements'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwords_not_match'));
      return;
    }

    setLoading(true);

    try {
      // Create user with username in metadata (triggers profile creation)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
          },
          emailRedirectTo: 'gosholomobile://auth/callback',
        },
      });

      if (signUpError) {
        // Check for specific errors
        if (signUpError.message?.includes('Username already exists')) {
          throw new Error(t('username_taken'));
        }
        throw signUpError;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically logged in
          router.replace('/(tabs)');
        } else {
          // Email confirmation required
          Alert.alert(
            t('success'),
            t('check_email_confirmation'),
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('User already registered')) {
        setError(t('email_already_registered'));
      } else if (err.message?.includes('Username already exists')) {
        setError(t('username_taken'));
      } else {
        setError(err.message || t('registration_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/darker-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('create_account')}</Text>
          <Text style={styles.subtitle}>{t('register_subtitle')}</Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('username')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_username')}
                  placeholderTextColor={COLORS.lightGray}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                {username.length > 0 && (
                  <Ionicons
                    name={validateUsername(username) ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={validateUsername(username) ? COLORS.success : COLORS.error}
                  />
                )}
              </View>
              <Text style={styles.hint}>{t('username_hint')}</Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('email')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_email')}
                  placeholderTextColor={COLORS.lightGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {email.length > 0 && (
                  <Ionicons
                    name={validateEmail(email) ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={validateEmail(email) ? COLORS.success : COLORS.error}
                  />
                )}
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_password')}
                  placeholderTextColor={COLORS.lightGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.lightGray}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>{t('password_hint')}</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('confirm_password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('confirm_password_placeholder')}
                  placeholderTextColor={COLORS.lightGray}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.lightGray}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorHint}>{t('passwords_not_match')}</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>{t('register')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('already_have_account')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.loginLink}>{t('login')}</Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 100,
    height: 100,
    transform: [{ scale: 1.4 }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.ink,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  hint: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: SPACING.xs,
  },
  errorHint: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});
