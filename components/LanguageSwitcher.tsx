import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
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

interface LanguageSwitcherProps {
  style?: any;
}

export default function LanguageSwitcher({ style }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;

  const languages = [
    { code: 'en', name: 'English', flag: require('../assets/images/flags/canada.png') },
    { code: 'fr', name: 'Français', flag: require('../assets/images/flags/quebec.png') },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <View style={styles.titleIcon}>
          <Ionicons name="language" size={20} color={COLORS.teal} />
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
            <Image source={lang.flag} style={styles.flag} />
            <Text
              style={[
                styles.languageName,
                currentLanguage === lang.code && styles.languageNameActive,
              ]}
            >
              {lang.name}
            </Text>
            {currentLanguage === lang.code && (
              <Ionicons name="checkmark" size={20} color={COLORS.teal} />
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
    borderColor: COLORS.teal,
  },
  flag: {
    width: 26,
    height: 18,
    marginRight: SPACING.lg,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.ink,
  },
  languageNameActive: {
    color: COLORS.teal,
    fontWeight: '600',
  },
});