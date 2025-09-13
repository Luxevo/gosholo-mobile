// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'magnifyingglass': 'search',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'person.fill': 'person',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'gearshape': 'settings',
  'camera.fill': 'camera-alt',
  'crown.fill': 'star',
  'checkmark.shield.fill': 'verified',
  'pencil': 'edit',
  'tag.fill': 'local-offer',
  'calendar': 'event',
  'creditcard.fill': 'credit-card',
  'line.3.horizontal': 'menu',
  'location': 'location-on',
  'location.fill': 'location-on',
  'fork.knife': 'restaurant',
  'clock': 'access-time',
  'globe': 'public',
  'slider.horizontal.3': 'tune',
  'star.fill': 'star',
  'bookmark': 'bookmark-border',
  'bookmark.fill': 'bookmark',
  'percent': 'percent',
  'flame': 'local-fire-department',
  'flame.fill': 'local-fire-department',
  'cup.and.saucer': 'local-cafe',
  'cup.and.saucer.fill': 'local-cafe',
  'hammer': 'build',
  'hammer.fill': 'build',
  'person.2.fill': 'group',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
