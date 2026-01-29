import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

export interface Filter {
  id: string;
  label: string;
  icon?: string;
}

interface FiltersSectionProps {
  filters: Filter[];
  selectedFilter: string | null;
  onFilterPress: (filterId: string) => void;
  renderPrefix?: () => React.ReactNode;
}

export function FiltersSection({
  filters,
  selectedFilter,
  onFilterPress,
  renderPrefix,
}: FiltersSectionProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPrefix && renderPrefix()}
        {filters.map((filter) => {
          const isSelected = filter.id === selectedFilter;
          const isFiltersButton = filter.id === 'filters';

          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                isSelected && styles.selectedFilterChip,
              ]}
              onPress={() => onFilterPress(filter.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {isFiltersButton && (
                <IconSymbol
                  name="line.3.horizontal.decrease.circle"
                  size={14}
                  color={isSelected ? COLORS.teal : COLORS.darkGray}
                  style={styles.filterIcon}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.selectedFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.teal,
    borderWidth: 2,
  },
  filterIcon: {
    // Icon styling if needed
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  selectedFilterText: {
    color: COLORS.teal,
  },
});
