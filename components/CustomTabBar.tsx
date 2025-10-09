import { ButtonSvg } from '@/components/ButtonSvg';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaPadding } from '@/hooks/useSafeAreaPadding';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACTIVE_TAB_COLOR = 'rgb(1,111,115)';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getTabBarPadding } = useSafeAreaPadding();
  const { t } = useTranslation();

  const getIconName = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'index':
        return 'house.fill';
      case 'offers':
        return 'tag.fill';
      case 'compass':
        return 'location';
      case 'events':
        return 'calendar';
      case 'profile':
        return 'person.fill';
      default:
        return 'questionmark';
    }
  };

  const getTabTitle = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return t('tab_home');
      case 'offers':
        return t('tab_offers');
      case 'compass':
        return '';
      case 'events':
        return t('tab_events');
      case 'profile':
        return t('tab_profile');
      default:
        return routeName;
    }
  };

  return (
    <View style={[
      styles.tabBar, 
      { 
        backgroundColor: colors.background,
        paddingBottom: getTabBarPadding(),
      }
    ]}>
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
                  color={isFocused ? ACTIVE_TAB_COLOR : colors.tabIconDefault}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? ACTIVE_TAB_COLOR : colors.tabIconDefault,
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
    minHeight: 80,
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