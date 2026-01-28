import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, ScrollView, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const NUM_COLUMNS = 2;
const PROFILE_CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / NUM_COLUMNS;

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
      {/* Media skeleton with overlay bar */}
      <View style={styles.mediaContainer}>
        <Animated.View style={[styles.media, { opacity }]} />

        {/* Bottom bar skeleton - location only */}
        <View style={styles.bar}>
          <Animated.View style={[styles.barItem, { opacity, width: 140 }]} />
        </View>
      </View>

      {/* Content skeleton */}
      <View style={styles.body}>
        <View style={styles.contentSection}>
          {/* Business name */}
          <View style={styles.businessSection}>
            <Animated.View style={[styles.skeletonLine, { opacity, width: '45%', height: 14 }]} />
            {/* Category chip */}
            <Animated.View style={[styles.skeletonChip, { opacity }]} />
          </View>

          {/* Title - 2 lines */}
          <Animated.View style={[styles.skeletonLine, { opacity, width: '90%', height: 18, marginTop: SPACING.sm }]} />
          <Animated.View style={[styles.skeletonLine, { opacity, width: '55%', height: 18, marginTop: SPACING.xs }]} />

          {/* Description - 2 lines */}
          <Animated.View style={[styles.skeletonLine, { opacity, width: '100%', height: 13, marginTop: SPACING.md }]} />
          <Animated.View style={[styles.skeletonLine, { opacity, width: '75%', height: 13, marginTop: SPACING.xs }]} />
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

// Profile Grid Card Skeleton
export const SkeletonProfileCard: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={styles.profileCard}>
      {/* Image placeholder */}
      <Animated.View style={[styles.profileCardImage, { opacity }]} />
      {/* Title placeholder */}
      <View style={styles.profileCardContent}>
        <Animated.View style={[styles.skeletonLine, { opacity, width: '80%', height: 12 }]} />
        <Animated.View style={[styles.skeletonLine, { opacity, width: '50%', height: 12, marginTop: SPACING.xs }]} />
      </View>
    </View>
  );
};

// Profile Header Skeleton (avatar + stats)
export const SkeletonProfileHeader: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={styles.profileSection}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
      </View>

      {/* Stats and Name */}
      <View style={styles.statsAndNameContainer}>
        {/* Display name */}
        <Animated.View style={[styles.skeletonLine, { opacity, width: 100, height: 16, marginBottom: SPACING.md }]} />

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Animated.View style={[styles.skeletonLine, { opacity, width: 24, height: 17 }]} />
            <Animated.View style={[styles.skeletonLine, { opacity, width: 40, height: 12, marginTop: 4 }]} />
          </View>
          <View style={styles.statItem}>
            <Animated.View style={[styles.skeletonLine, { opacity, width: 24, height: 17 }]} />
            <Animated.View style={[styles.skeletonLine, { opacity, width: 40, height: 12, marginTop: 4 }]} />
          </View>
          <View style={styles.statItem}>
            <Animated.View style={[styles.skeletonLine, { opacity, width: 24, height: 17 }]} />
            <Animated.View style={[styles.skeletonLine, { opacity, width: 50, height: 12, marginTop: 4 }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Profile Tab Switcher Skeleton
export const SkeletonProfileTabs: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tab}>
        <Animated.View style={[styles.tabIconSkeleton, { opacity }]} />
      </View>
      <View style={styles.tab}>
        <Animated.View style={[styles.tabIconSkeleton, { opacity }]} />
      </View>
      <View style={styles.tab}>
        <Animated.View style={[styles.tabIconSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

// Profile Grid Skeleton (multiple cards)
export const SkeletonProfileGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.profileGridContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonProfileCard key={index} />
      ))}
    </View>
  );
};

// Full Profile Page Skeleton
export const SkeletonProfilePage: React.FC = () => {
  return (
    <View style={styles.pageContainer}>
      <SkeletonProfileHeader />
      <SkeletonProfileTabs />
      <SkeletonProfileGrid count={4} />
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
    marginTop: SPACING.sm,
    marginBottom: Platform.OS === 'android' ? 4 : SPACING.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    width: Platform.OS === 'android' ? 340 : 356,
    alignSelf: 'center',
  },
  mediaContainer: {
    position: 'relative',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
  },
  media: {
    flex: 1,
    backgroundColor: COLORS.skeleton,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barItem: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
  },
  body: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    justifyContent: 'space-between',
  },
  contentSection: {
    gap: SPACING.sm,
    minHeight: 140,
  },
  businessSection: {
    marginBottom: SPACING.xs,
  },
  skeletonLine: {
    backgroundColor: COLORS.skeleton,
    borderRadius: 6,
  },
  skeletonChip: {
    width: 70,
    height: 22,
    backgroundColor: COLORS.skeleton,
    borderRadius: RAD.md,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
  // Profile Skeleton Styles
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  avatarContainer: {
    marginRight: SPACING.lg,
  },
  avatarSkeleton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.skeleton,
  },
  statsAndNameContainer: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: SPACING.xl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tabIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: COLORS.skeleton,
  },
  profileGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_GAP,
    paddingTop: SPACING.sm,
    gap: GRID_GAP,
  },
  profileCard: {
    width: PROFILE_CARD_WIDTH,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  profileCardImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.skeleton,
  },
  profileCardContent: {
    padding: SPACING.sm,
  },
});
