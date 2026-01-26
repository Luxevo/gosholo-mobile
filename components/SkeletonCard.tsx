import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';

const COLORS = {
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  bg: '#FFFFFF',
  line: 'rgba(0,0,0,0.08)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

const RAD = {
  md: 12,
  lg: 16,
  pill: 999,
};

// Shared shimmer hook
const useShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });
};

// Skeleton Search Bar
export const SkeletonSearchBar: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={styles.searchContainer}>
      <Animated.View style={[styles.searchBar, { opacity }]} />
    </View>
  );
};

// Skeleton Categories
export const SkeletonCategories: React.FC = () => {
  const opacity = useShimmer();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={styles.categoriesContent}
    >
      {[80, 100, 70, 90, 85, 75].map((width, index) => (
        <Animated.View
          key={index}
          style={[styles.categoryChip, { opacity, width }]}
        />
      ))}
    </ScrollView>
  );
};

// Skeleton Filters
export const SkeletonFilters: React.FC = () => {
  const opacity = useShimmer();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {[70, 55, 60, 55, 50].map((width, index) => (
        <Animated.View
          key={index}
          style={[styles.filterChip, { opacity, width }]}
        />
      ))}
    </ScrollView>
  );
};

// Skeleton Card
interface SkeletonCardProps {
  type?: 'offer' | 'event';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ type = 'offer' }) => {
  const opacity = useShimmer();

  return (
    <View style={styles.card}>
      {/* Media skeleton */}
      <Animated.View style={[styles.media, { opacity }]} />

      {/* Bottom bar skeleton */}
      <View style={styles.bar}>
        <Animated.View style={[styles.barItem, { opacity, width: 90 }]} />
        <Animated.View style={[styles.barItem, { opacity, width: 70 }]} />
      </View>

      {/* Content skeleton */}
      <View style={styles.body}>
        <View style={styles.contentSection}>
          {/* Business name */}
          <Animated.View style={[styles.skeletonLine, { opacity, width: '45%', height: 14 }]} />

          {/* Category chip */}
          <Animated.View style={[styles.skeletonChip, { opacity }]} />

          {/* Title */}
          <Animated.View style={[styles.skeletonLine, { opacity, width: '85%', height: 20, marginTop: SPACING.sm }]} />
          <Animated.View style={[styles.skeletonLine, { opacity, width: '60%', height: 20, marginTop: SPACING.xs }]} />

          {/* Description */}
          <Animated.View style={[styles.skeletonLine, { opacity, width: '100%', height: 13, marginTop: SPACING.md }]} />
          <Animated.View style={[styles.skeletonLine, { opacity, width: '80%', height: 13, marginTop: SPACING.xs }]} />
        </View>

        {/* Actions skeleton */}
        <View style={styles.actions}>
          <Animated.View style={[styles.skeletonButton, { opacity }]} />
          <View style={styles.actionButtons}>
            <Animated.View style={[styles.skeletonIconBtn, { opacity }]} />
            <Animated.View style={[styles.skeletonIconBtn, { opacity }]} />
            <Animated.View style={[styles.skeletonIconBtn, { opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Full Skeleton Page (search + categories + filters + cards)
export const SkeletonPage: React.FC<{ count?: number; type?: 'offer' | 'event' }> = ({
  count = 2,
  type = 'offer'
}) => {
  return (
    <View style={styles.pageContainer}>
      <SkeletonSearchBar />
      <SkeletonCategories />
      <SkeletonFilters />
      <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} type={type} />
        ))}
      </View>
    </View>
  );
};

// Just the list of cards (for backward compatibility)
export const SkeletonList: React.FC<{ count?: number; type?: 'offer' | 'event' }> = ({
  count = 3,
  type = 'offer'
}) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} type={type} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  // Search bar
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    height: 48,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.pill,
  },
  // Categories
  categoriesContainer: {
    marginTop: SPACING.xs,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    height: 36,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.pill,
  },
  // Filters
  filtersContainer: {
    marginTop: SPACING.md,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  filterChip: {
    height: 32,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.pill,
  },
  // Cards list
  listContainer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  // Card
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RAD.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.line,
    width: Platform.OS === 'android' ? 340 : 356,
    alignSelf: 'center',
  },
  media: {
    aspectRatio: 4 / 5,
    backgroundColor: COLORS.skeleton,
  },
  bar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 340 * (4/5) - 40 : 356 * (4/5) - 40,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  barItem: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: RAD.md,
  },
  body: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    justifyContent: 'space-between',
  },
  contentSection: {
    minHeight: 140,
  },
  skeletonLine: {
    backgroundColor: COLORS.skeleton,
    borderRadius: 6,
  },
  skeletonChip: {
    width: 80,
    height: 26,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.md,
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  skeletonButton: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.pill,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  skeletonIconBtn: {
    width: 40,
    height: 40,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.skeleton,
  },
});
