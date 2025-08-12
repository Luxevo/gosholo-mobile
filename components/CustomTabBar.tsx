import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ButtonSvg } from '@/components/ButtonSvg';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconName = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'index':
        return focused ? 'house.fill' : 'house';
      case 'offers':
        return focused ? 'tag.fill' : 'tag';
      case 'compass':
        return 'location';
      case 'events':
        return focused ? 'calendar' : 'calendar';
      case 'profile':
        return focused ? 'person.fill' : 'person';
      default:
        return 'questionmark';
    }
  };

  const getTabTitle = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'offers':
        return 'Offers';
      case 'compass':
        return '';
      case 'events':
        return 'Events';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCompass = route.name === 'compass';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={[
              styles.tabItem,
              isCompass && styles.compassTab,
            ]}
          >
            {isCompass ? (
              <ButtonSvg width={82} height={82} />
            ) : (
              <>
                <IconSymbol
                  name={getIconName(route.name, isFocused)}
                  size={isFocused ? 26 : 22}
                  color={isFocused ? '#FF6B35' : colors.tabIconDefault}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? '#FF6B35' : colors.tabIconDefault,
                      fontWeight: isFocused ? '600' : '400',
                    },
                  ]}
                >
                  {getTabTitle(route.name)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compassTab: {
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: -20,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});