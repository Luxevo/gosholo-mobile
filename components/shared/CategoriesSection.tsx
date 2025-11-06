import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  teal: 'rgb(1,111,115)',
  green: '#10B981',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

export interface Category {
  id: string;
  label: string;
  icon?: string;
}

interface CategoriesSectionProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryPress: (categoryId: string) => void;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  title?: string;
}

export function CategoriesSection({
  categories,
  selectedCategory,
  onCategoryPress,
  showSeeAll = true,
  onSeeAllPress,
  title,
}: CategoriesSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title || t('categories')}</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={onSeeAllPress} accessibilityRole="button">
            <Text style={styles.seeAllText}>{t('see_all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = category.id === selectedCategory;
          const isAll = category.id === 'all';

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isAll && styles.allCategoryChip,
                isSelected && styles.selectedCategoryChip,
              ]}
              onPress={() => onCategoryPress(category.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {category.icon && (
                <IconSymbol
                  name={category.icon as any}
                  size={16}
                  color={isSelected ? COLORS.white : COLORS.darkGray}
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText,
                ]}
              >
                {category.label}
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
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  allCategoryChip: {
    // All categories now use pill shape by default
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  categoryIcon: {
    // Icon styling if needed
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
});
