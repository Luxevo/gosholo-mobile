import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTranslation } from 'react-i18next';

interface SimpleNavigationBarProps {
  duration: number; // seconds
  distance: number; // meters
  arrivalTime: string; // HH:MM format
  hasAlternatives?: boolean;
  onShowAlternatives?: () => void;
  onClose: () => void;
}

const COLORS = {
  background: '#016167', // Brand teal for navigation background
  text: '#B2FD9D', // Brand green for duration text
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  exitButton: '#FF6233', // Brand primary orange for exit
  white: '#FFFFFF',
};

export const SimpleNavigationBar: React.FC<SimpleNavigationBarProps> = ({
  duration,
  distance,
  arrivalTime,
  hasAlternatives = false,
  onShowAlternatives,
  onClose,
}) => {
  const { t } = useTranslation();

  // Format duration (seconds to readable format)
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ${t('hours_short')} ${minutes} ${t('minutes_short')}`;
    }
    return `${minutes} ${t('minutes_short')}`;
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} ${t('meters_short')}`;
    }
    return `${(meters / 1000).toFixed(1)} ${t('kilometers_short')}`;
  };

  return (
    <View style={styles.container}>
      {/* Drag Handle */}
      <View style={styles.dragHandle} />

      <View style={styles.content}>
        {/* Left: ETA and Info */}
        <View style={styles.leftSection}>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
          <Text style={styles.details}>
            {formatDistance(distance)} · {arrivalTime}
          </Text>
        </View>

        {/* Middle: Alternatives Button */}
        {hasAlternatives && onShowAlternatives && (
          <TouchableOpacity
            style={styles.alternativesButton}
            onPress={onShowAlternatives}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.triangle.branch" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Right: Exit Button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.exitText}>{t('nav_exit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 32, // Safe area for home indicator
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leftSection: {
    flex: 1,
  },
  duration: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  details: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  alternativesButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: COLORS.exitButton,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  exitText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
