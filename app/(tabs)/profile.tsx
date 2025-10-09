import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  teal: 'rgb(1,111,115)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Icon Section */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="person-outline" size={64} color={COLORS.primary} />
          </View>
        </View>

        {/* Main Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>{t('profile_coming_soon')}</Text>
          <Text style={styles.subtitle}>
            {t('profile_subtitle')}
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>{t('soon_you_can')}</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{t('save_favorites')}</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="bookmark" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{t('create_wishlist')}</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{t('get_recommendations')}</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{t('receive_alerts')}</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="person-circle" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{t('customize_preferences')}</Text>
          </View>
        </View>

        {/* Language Switcher */}
        <LanguageSwitcher style={styles.languageSwitcher} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xxl * 2,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  featuresSection: {
    width: '100%',
    marginBottom: SPACING.xxl * 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    fontWeight: '500',
  },
  bottomMessage: {
    paddingHorizontal: SPACING.lg,
  },
  bottomText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  languageSwitcher: {
    width: '100%',
    marginTop: SPACING.xxl,
  },
}); 