import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ManeuverIconProps {
  type: string;
  modifier?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const COLORS = {
  primary: '#4285F4',
  white: '#FFFFFF',
  dark: '#202124',
};

export const ManeuverIcon: React.FC<ManeuverIconProps> = ({
  type,
  modifier,
  size = 'medium',
  color = COLORS.white
}) => {
  const getArrow = (): string => {
    // Simple directional arrows based on turn type
    const maneuverType = `${type}${modifier ? `-${modifier}` : ''}`;

    switch (maneuverType) {
      // Left turns
      case 'turn-left':
      case 'turn-sharp left':
      case 'turn-slight left':
      case 'fork-left':
      case 'off ramp-left':
      case 'on ramp-left':
      case 'merge-left':
        return '←';

      // Right turns
      case 'turn-right':
      case 'turn-sharp right':
      case 'turn-slight right':
      case 'fork-right':
      case 'off ramp-right':
      case 'on ramp-right':
      case 'merge-right':
        return '→';

      // Straight/Continue
      case 'continue':
      case 'new name':
      case 'depart':
        return '↑';

      // U-turn
      case 'uturn':
      case 'uturn-left':
        return '↶';
      case 'uturn-right':
        return '↷';

      // Roundabout
      case 'roundabout':
      case 'roundabout-left':
      case 'roundabout-right':
      case 'rotary':
        return '⟲';

      // Arrive
      case 'arrive':
      case 'arrive-left':
      case 'arrive-right':
        return '📍';

      // Default - straight
      default:
        return '↑';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 56;
      default:
        return 48;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.arrow, { fontSize: getFontSize(), color }]}>
        {getArrow()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontWeight: 'bold',
  },
});
