import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  white: '#FFFFFF',
  lightGreen: '#B2FD9D',
  teal: 'rgb(1,111,115)',
};

interface PromoBannerProps {
  onPress: () => void;
}

export function PromoBanner({ onPress }: PromoBannerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.banner}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <View style={styles.content}>
          <Text style={styles.heading}>{t('promo_heading')}</Text>
          <Text style={styles.subtext}>{t('promo_subtext')}</Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>{t('see_deals')}</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <IconSymbol name="tag.fill" size={60} color="rgba(255, 255, 255, 0.3)" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  banner: {
    backgroundColor: COLORS.teal,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 140,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.95,
    lineHeight: 18,
    marginBottom: 4,
  },
  button: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
  },
  iconContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -30 }, { rotate: '-15deg' }],
  },
});
