import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const COLORS = {
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search restaurants, cuisines, or events...',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={COLORS.darkGray}
        />
        <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
});
