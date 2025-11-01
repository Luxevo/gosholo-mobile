import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ManeuverIcon } from './ManeuverIcon';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTranslation } from 'react-i18next';

interface NavigationBannerProps {
  currentStep: {
    maneuver: {
      type: string;
      modifier?: string;
      instruction: string;
    };
    distance: number;
    name?: string;
  };
  estimatedArrival?: string;
}

const COLORS = {
  navigationGreen: '#016167', // Brand teal (primary navigation color)
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.95)',
};

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
  currentStep,
  estimatedArrival,
}) => {
  const { t, i18n } = useTranslation();
  const isMetric = true; // Can be changed based on user preference

  // Format distance based on language and units
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} ${t('meters_short')}`; // "m"
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km} ${t('kilometers_short')}`; // "km"
    }
  };

  // Get distance instruction prefix
  const getDistancePrefix = (meters: number): string => {
    if (meters < 50) {
      return t('nav_now'); // "Maintenant" / "Now"
    } else if (meters < 100) {
      return t('nav_in'); // "Dans" / "In"
    } else {
      return t('nav_in'); // "Dans" / "In"
    }
  };

  const distanceText = useMemo(() => {
    const prefix = getDistancePrefix(currentStep.distance);
    const distance = formatDistance(currentStep.distance);
    return `${prefix} ${distance}`;
  }, [currentStep.distance, i18n.language]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Maneuver Icon */}
        <View style={styles.iconContainer}>
          <ManeuverIcon
            type={currentStep.maneuver.type}
            modifier={currentStep.maneuver.modifier}
            size="large"
            color={COLORS.white}
          />
        </View>

        {/* Instruction Content - Google style (no distance here) */}
        <View style={styles.textContainer}>
          <Text style={styles.instructionText} numberOfLines={2}>
            {currentStep.maneuver.instruction}
          </Text>
          {currentStep.name && (
            <Text style={styles.streetName} numberOfLines={1}>
              {currentStep.name}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 1000,
    backgroundColor: COLORS.navigationGreen,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  streetName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
