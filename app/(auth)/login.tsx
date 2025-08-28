import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

  export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');

    const handleLogin = async () => {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          Alert.alert('Login Error', error.message);
          return;
        }

        if (data?.session) {
          // Login successful - root layout will handle navigation
          console.log('Login successful');
        }
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleForgotPassword = () => {
      Alert.alert('Forgot Password', 'Password reset functionality would be implemented here');
    };

    const handleSignUp = () => {
      router.push('/(auth)/register');
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
            {/* Logo and Illustration Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/darker-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              </View>
            
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Discover exclusive offers, new events, and the best local eats in your city.
              </Text>
            </View>

                      {/* Login Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Log In'}
                </Text>
              </TouchableOpacity>

              {/* Social Login */}
              <View style={styles.socialContainer}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.orText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>
                
                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.googleText}>G</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-apple" size={24} color="#000" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.facebookText}>f</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20, // Extra padding at bottom for keyboard
    },
      content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: '100%', // Ensure content takes full height
  },
      logoSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
      logo: {
    width:300,
    height: 100,
  },
    logoGo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#B2FD9D',
    },
    logoSholo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#016167',
    },
    illustration: {
      width: '100%',
      height: 140,
    },
    welcomeSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#016167',
      marginBottom: 6,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    form: {
      marginBottom: 24,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
      color: '#016167',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#000000',
      backgroundColor: 'transparent',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 20,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: '#FF6233',
      fontWeight: '500',
    },
    loginButton: {
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FF6233',
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      width: '100%',
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: '#E5E7EB',
    },
    orText: {
      marginHorizontal: 16,
      color: '#9CA3AF',
      fontSize: 14,
    },
    socialContainer: {
      marginBottom: 24,
      alignItems: 'center',
    },
    socialButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },
    socialButton: {
      width: 48,
      height: 48,
      borderWidth: 1,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },
    googleText: {
      color: '#4285F4',
      fontSize: 18,
      fontWeight: 'bold',
    },
    facebookText: {
      color: '#1877F2',
      fontSize: 18,
      fontWeight: 'bold',
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    signUpText: {
      fontSize: 14,
      color: '#666666',
    },
    signUpLink: {
      fontSize: 14,
      color: '#FF6233',
      fontWeight: '600',
    },
  }); 