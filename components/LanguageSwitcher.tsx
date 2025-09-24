import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  teal: '#016167',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

interface LanguageSwitcherProps {
  style?: any;
}

export default function LanguageSwitcher({ style }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <View style={styles.titleIcon}>
          <Ionicons name="language" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.titleText}>{t('language')}</Text>
      </View>

      <View style={styles.languageOptions}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              currentLanguage === lang.code && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageName,
                currentLanguage === lang.code && styles.languageNameActive,
              ]}
            >
              {lang.name}
            </Text>
            {currentLanguage === lang.code && (
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.teal,
  },
  languageOptions: {
    gap: SPACING.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  flag: {
    fontSize: 24,
    marginRight: SPACING.lg,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.ink,
  },
  languageNameActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});