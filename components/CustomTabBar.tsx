import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaPadding } from '@/hooks/useSafeAreaPadding';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACTIVE_TAB_COLOR = 'rgb(1,111,115)';
const VISIBLE_TABS = ['index', 'offers', 'compass', 'events', 'ai'];

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

  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'storefront.fill';
      case 'offers':
        return 'tag.fill';
      case 'compass':
        return 'map.fill';
      case 'events':
        return 'calendar';
      case 'ai':
        return 'sparkles';
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
        return t('tab_map', 'Map');
      case 'events':
        return t('tab_events');
      case 'ai':
        return 'AI';
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
      {state.routes.filter((r: any) => VISIBLE_TABS.includes(r.name)).map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);

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
            style={styles.tabItem}
          >
            <IconSymbol
              name={getIconName(route.name)}
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 80,
    paddingTop: 8,
    paddingHorizontal: 16,
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
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
