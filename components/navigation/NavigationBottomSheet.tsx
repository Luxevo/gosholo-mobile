import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ManeuverIcon } from './ManeuverIcon';
import { useTranslation } from 'react-i18next';

interface RouteAlternative {
  distance: number;
  duration: number;
  description?: string;
  trafficLevel?: 'low' | 'moderate' | 'heavy';
}

interface NavigationBottomSheetProps {
  // Current route info
  distance: number; // meters
  duration: number; // seconds
  arrivalTime: string;
  routingProfile: 'driving-traffic' | 'driving' | 'walking' | 'cycling';

  // Alternative routes
  alternatives?: RouteAlternative[];

  // Upcoming steps
  upcomingSteps?: Array<{
    maneuver: {
      type: string;
      modifier?: string;
      instruction: string;
    };
    distance: number;
  }>;

  // Actions
  onClose?: () => void;
  onChangeProfile?: () => void;
  onSelectAlternative?: (index: number) => void;
  onShowSteps?: () => void;
}

const COLORS = {
  white: '#FFFFFF',
  backgroundLight: '#F8F9FA',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  navigationBlue: '#4285F4',
  green: '#34A853',
  yellow: '#FBBC04',
  red: '#EA4335',
  border: '#E8EAED',
};

export const NavigationBottomSheet: React.FC<NavigationBottomSheetProps> = ({
  distance,
  duration,
  arrivalTime,
  routingProfile,
  alternatives = [],
  upcomingSteps = [],
  onClose,
  onChangeProfile,
  onSelectAlternative,
  onShowSteps,
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

  // Get traffic color
  const getTrafficColor = (level?: 'low' | 'moderate' | 'heavy'): string => {
    switch (level) {
      case 'low': return COLORS.green;
      case 'moderate': return COLORS.yellow;
      case 'heavy': return COLORS.red;
      default: return COLORS.navigationBlue;
    }
  };

  // Get routing profile icon
  const getProfileIcon = (): string => {
    switch (routingProfile) {
      case 'driving-traffic':
      case 'driving':
        return 'car.fill';
      case 'walking':
        return 'figure.walk';
      case 'cycling':
        return 'bicycle';
      default:
        return 'car.fill';
    }
  };

  return (
    <View style={styles.container}>
      {/* Main ETA Card */}
      <View style={styles.etaCard}>
        <View style={styles.etaContent}>
          {/* Arrival Time */}
          <View style={styles.etaMain}>
            <Text style={styles.arrivalTime}>{arrivalTime}</Text>
            <Text style={styles.etaLabel}>{t('nav_arrival')}</Text>
          </View>

          {/* Duration */}
          <View style={styles.etaDivider} />
          <View style={styles.etaDetail}>
            <Text style={styles.etaValue}>{formatDuration(duration)}</Text>
            <Text style={styles.etaLabel}>{t('nav_duration')}</Text>
          </View>

          {/* Distance */}
          <View style={styles.etaDivider} />
          <View style={styles.etaDetail}>
            <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
            <Text style={styles.etaLabel}>{t('nav_distance')}</Text>
          </View>

          {/* Profile Icon */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onChangeProfile}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={getProfileIcon() as any}
              size={24}
              color={COLORS.navigationBlue}
            />
          </TouchableOpacity>

          {/* Close Button */}
          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Alternative Routes */}
      {alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <Text style={styles.sectionTitle}>{t('nav_route_options')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alternativesScroll}
          >
            {alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeCard}
                onPress={() => onSelectAlternative?.(index)}
                activeOpacity={0.7}
              >
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeLabel}>
                    {t('nav_route')} {index + 2}
                  </Text>
                  <View
                    style={[
                      styles.trafficIndicator,
                      { backgroundColor: getTrafficColor(alt.trafficLevel) }
                    ]}
                  />
                </View>
                <Text style={styles.alternativeDuration}>
                  {formatDuration(alt.duration)}
                </Text>
                <Text style={styles.alternativeDistance}>
                  {formatDistance(alt.distance)}
                </Text>
                {alt.description && (
                  <Text style={styles.alternativeDesc} numberOfLines={1}>
                    {alt.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Upcoming Steps */}
      {upcomingSteps.length > 0 && (
        <View style={styles.upcomingSection}>
          <View style={styles.upcomingHeader}>
            <Text style={styles.sectionTitle}>{t('nav_upcoming')}</Text>
            {onShowSteps && (
              <TouchableOpacity onPress={onShowSteps} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>{t('nav_see_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingSteps.slice(0, 3).map((step, index) => (
            <View key={index} style={styles.upcomingStep}>
              <ManeuverIcon
                type={step.maneuver.type}
                modifier={step.maneuver.modifier}
                size="small"
                color={COLORS.textSecondary}
              />
              <View style={styles.upcomingStepText}>
                <Text style={styles.upcomingInstruction} numberOfLines={1}>
                  {step.maneuver.instruction}
                </Text>
                <Text style={styles.upcomingDistance}>
                  {formatDistance(step.distance)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: '60%',
  },

  // ETA Card
  etaCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaMain: {
    flex: 1,
  },
  arrivalTime: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  etaDetail: {
    alignItems: 'center',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileButton: {
    marginLeft: 16,
    padding: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
  },
  closeButton: {
    marginLeft: 8,
    padding: 8,
  },

  // Alternatives
  alternativesSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  alternativesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  alternativeCard: {
    width: 140,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  trafficIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alternativeDuration: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  alternativeDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  alternativeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Upcoming Steps
  upcomingSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navigationBlue,
  },
  upcomingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  upcomingStepText: {
    flex: 1,
  },
  upcomingInstruction: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  upcomingDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
