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
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
};

interface CompactLanguageSwitcherProps {
  style?: any;
}

export default function CompactLanguageSwitcher({ style }: CompactLanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const languages = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={[styles.container, style]}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            currentLanguage === lang.code && styles.languageButtonActive,
          ]}
          onPress={() => handleLanguageChange(lang.code)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, currentLanguage === lang.code && styles.labelActive]}>
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  languageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  labelActive: {
    color: COLORS.white,
  },
});