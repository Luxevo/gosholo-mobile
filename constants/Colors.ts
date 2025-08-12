/**
 * App color theme with brand colors for the food delivery app
 */

export const AppColors = {
  primary: '#FF6233',      // Orange - main brand color
  teal: '#016167',         // Dark teal - secondary brand color
  green: '#B2FD9D',        // Light green - accent color
  blue: '#5BC4DB',         // Light blue - accent color
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#E5E5E5',
};

const tintColorLight = AppColors.primary;
const tintColorDark = AppColors.white;

export const Colors = {
  light: {
    text: AppColors.black,
    background: AppColors.white,
    tint: tintColorLight,
    icon: AppColors.darkGray,
    tabIconDefault: AppColors.darkGray,
    tabIconSelected: tintColorLight,
    primary: AppColors.primary,
    secondary: AppColors.teal,
    accent: AppColors.green,
    accentBlue: AppColors.blue,
    surface: AppColors.gray,
    border: AppColors.lightGray,
  },
  dark: {
    text: AppColors.white,
    background: AppColors.black,
    tint: tintColorDark,
    icon: AppColors.darkGray,
    tabIconDefault: AppColors.darkGray,
    tabIconSelected: tintColorDark,
    primary: AppColors.primary,
    secondary: AppColors.teal,
    accent: AppColors.green,
    accentBlue: AppColors.blue,
    surface: '#2A2A2A',
    border: '#444444',
  },
};
