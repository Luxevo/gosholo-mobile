import { supabase } from '@/lib/supabase';
import { useMobileUser } from '@/hooks/useMobileUser';
import { useFavorites } from '@/hooks/useFavorites';
import { useFollows } from '@/hooks/useFollows';
import { useLikes } from '@/hooks/useLikes';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OfferDetailModal from '@/components/OfferDetailModal';
import EventDetailModal from '@/components/EventDetailModal';
import BusinessDetailModal from '@/components/BusinessDetailModal';
import { SkeletonProfilePage, SkeletonProfileGrid } from '@/components/SkeletonCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_GAP * 3) / NUM_COLUMNS;

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  teal: 'rgb(1,111,115)',
  error: '#EF4444',
  border: '#DBDBDB',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

type TabType = 'saved' | 'liked' | 'following';

interface GridItem {
  id: string;
  image_url?: string | null;
  title?: string;
  name?: string;
  type: 'offer' | 'event' | 'commerce';
}

// Moved outside to prevent re-creation on every render
const ProfileHeader = ({ onSettingsPress }: { onSettingsPress: () => void }) => (
  <View style={styles.profileHeader}>
    <Image
      source={require('@/assets/images/darker-logo.png')}
      style={styles.profileLogo}
      resizeMode="contain"
    />
    <TouchableOpacity
      style={styles.gearButton}
      onPress={onSettingsPress}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <Ionicons name="settings-outline" size={24} color={COLORS.ink} />
    </TouchableOpacity>
  </View>
);

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile, refetch: refetchProfile } = useMobileUser();
  const { favorites, toggleFavorite, refetch: refetchFavorites } = useFavorites();
  const { follows, toggleFollow, refetch: refetchFollows } = useFollows();
  const { likes, refetch: refetchLikes } = useLikes();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [savedItems, setSavedItems] = useState<GridItem[]>([]);
  const [likedItems, setLikedItems] = useState<GridItem[]>([]);
  const [followedCommerces, setFollowedCommerces] = useState<GridItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modal states
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedCommerce, setSelectedCommerce] = useState<any>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCommerceModal, setShowCommerceModal] = useState(false);

  useEffect(() => {
    checkAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setAuthLoading(false);
        if (event === 'SIGNED_IN') {
          refetchProfile();
          refetchFavorites();
          refetchFollows();
          refetchLikes();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setAuthLoading(false);
  };

  // Fetch actual data for saved (favorites), liked, and following
  const fetchGridData = useCallback(async () => {
    if (!isAuthenticated) return;

    setDataLoading(true);
    try {
      // SAVED TAB: Combine favorite offers + favorite events
      const favoriteOfferIds = Array.from(favorites.offers);
      const favoriteEventIds = Array.from(favorites.events);

      const savedItemsArray: GridItem[] = [];

      if (favoriteOfferIds.length > 0) {
        const { data: offers } = await supabase
          .from('offers')
          .select('id, title, image_url')
          .in('id', favoriteOfferIds);
        if (offers) {
          savedItemsArray.push(...offers.map(o => ({ ...o, type: 'offer' as const })));
        }
      }

      if (favoriteEventIds.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select('id, title, image_url')
          .in('id', favoriteEventIds);
        if (events) {
          savedItemsArray.push(...events.map(e => ({ ...e, type: 'event' as const })));
        }
      }

      setSavedItems(savedItemsArray);

      // LIKED TAB: Combine liked offers + liked events
      const likedOfferIds = Array.from(likes.offers);
      const likedEventIds = Array.from(likes.events);

      const likedItemsArray: GridItem[] = [];

      if (likedOfferIds.length > 0) {
        const { data: offers } = await supabase
          .from('offers')
          .select('id, title, image_url')
          .in('id', likedOfferIds);
        if (offers) {
          likedItemsArray.push(...offers.map(o => ({ ...o, type: 'offer' as const })));
        }
      }

      if (likedEventIds.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select('id, title, image_url')
          .in('id', likedEventIds);
        if (events) {
          likedItemsArray.push(...events.map(e => ({ ...e, type: 'event' as const })));
        }
      }

      setLikedItems(likedItemsArray);

      // FOLLOWING TAB: Followed commerces
      const commerceIds = Array.from(follows);
      if (commerceIds.length > 0) {
        const { data: commerces } = await supabase
          .from('commerces')
          .select('id, name, image_url')
          .in('id', commerceIds);
        setFollowedCommerces(commerces?.map(c => ({ ...c, type: 'commerce' as const })) || []);
      } else {
        setFollowedCommerces([]);
      }
    } catch (error) {
      console.error('Error fetching grid data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, favorites, follows, likes]);

  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFavorites(), refetchFollows(), refetchLikes()]);
    await fetchGridData();
    setRefreshing(false);
  }, [refetchFavorites, refetchFollows, refetchLikes, fetchGridData]);

  const handleItemPress = async (item: GridItem) => {
    try {
      if (item.type === 'offer') {
        // Fetch offer
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('*')
          .eq('id', item.id)
          .single();

        if (offerError || !offerData) return;

        // Fetch commerce separately
        let commerceData = null;
        if (offerData.commerce_id) {
          const { data } = await supabase
            .from('commerces')
            .select('id, name, address, latitude, longitude, category_id')
            .eq('id', offerData.commerce_id)
            .single();
          commerceData = data;
        }

        setSelectedOffer({ ...offerData, commerces: commerceData });
        setShowOfferModal(true);
      } else if (item.type === 'event') {
        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', item.id)
          .single();

        if (eventError || !eventData) return;

        // Fetch commerce separately
        let commerceData = null;
        if (eventData.commerce_id) {
          const { data } = await supabase
            .from('commerces')
            .select('id, name, address, latitude, longitude, category_id')
            .eq('id', eventData.commerce_id)
            .single();
          commerceData = data;
        }

        setSelectedEvent({ ...eventData, commerces: commerceData });
        setShowEventModal(true);
      } else if (item.type === 'commerce') {
        const { data, error } = await supabase
          .from('commerces')
          .select('*')
          .eq('id', item.id)
          .single();
        if (!error && data) {
          setSelectedCommerce(data);
          setShowCommerceModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const currentGridData = useMemo(() => {
    switch (activeTab) {
      case 'saved':
        return savedItems;
      case 'liked':
        return likedItems;
      case 'following':
        return followedCommerces;
      default:
        return [];
    }
  }, [activeTab, savedItems, likedItems, followedCommerces]);

  const tabCounts = useMemo(() => ({
    saved: savedItems.length,
    liked: likedItems.length,
    following: followedCommerces.length,
  }), [savedItems, likedItems, followedCommerces]);

  const renderGridItem = ({ item }: { item: GridItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      {/* Image */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons
            name={item.type === 'commerce' ? 'storefront' : item.type === 'event' ? 'calendar' : 'pricetag'}
            size={24}
            color={COLORS.lightGray}
          />
        </View>
      )}
      {/* Type Badge */}
      <View style={[styles.typeBadge, item.type === 'event' ? styles.eventBadge : item.type === 'commerce' ? styles.commerceBadge : styles.offerBadge]}>
        <Ionicons
          name={item.type === 'commerce' ? 'storefront' : item.type === 'event' ? 'calendar' : 'pricetag'}
          size={10}
          color={COLORS.white}
        />
      </View>
      {/* Title */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || item.name || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'saved' ? 'bookmark-outline' : activeTab === 'liked' ? 'heart-outline' : 'people-outline'}
        size={48}
        color={COLORS.lightGray}
      />
      <Text style={styles.emptyText}>
        {activeTab === 'saved' && t('no_saved_items', 'No saved items')}
        {activeTab === 'liked' && t('no_liked_items', 'No liked items')}
        {activeTab === 'following' && t('no_following', 'Aucun commerce suivi')}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'saved' && t('tap_bookmark_to_save', 'Tap ⭐ to save offers and events')}
        {activeTab === 'liked' && t('tap_heart_to_like', 'Tap ❤️ to like offers and events')}
        {activeTab === 'following' && t('tap_follow_to_follow', 'Appuie sur Suivre pour suivre des commerces')}
      </Text>
    </View>
  );

  const handleSettingsPress = useCallback(() => {
    router.push('/settings' as any);
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ProfileHeader onSettingsPress={handleSettingsPress} />
        <SkeletonProfilePage />
      </SafeAreaView>
    );
  }

  // Not authenticated - show login/register options
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ProfileHeader onSettingsPress={handleSettingsPress} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.unauthContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="person-outline" size={64} color={COLORS.primary} />
            </View>
          </View>

          {/* Main Message */}
          <View style={styles.messageSection}>
            <Text style={styles.title}>{t('welcome_to_gosholo')}</Text>
            <Text style={styles.subtitle}>
              {t('login_to_access_features')}
            </Text>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login' as any)}
            >
              <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register' as any)}
            >
              <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
              <Text style={styles.registerButtonText}>{t('register')}</Text>
            </TouchableOpacity>
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>{t('soon_you_can')}</Text>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="heart" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{t('save_favorites')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{t('follow_businesses', 'Suivre tes commerces préférés')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{t('receive_alerts')}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated - show Instagram-style profile
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProfileHeader onSettingsPress={handleSettingsPress} />

      <FlatList
        data={currentGridData}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={
          <>
            {/* Profile Info Section - Instagram Style */}
            <View style={styles.profileSection}>
              {/* Avatar with ring */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(profile?.username || profile?.first_name || profile?.email || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats and Name */}
              <View style={styles.statsAndNameContainer}>
                {/* Full Name */}
                <Text style={styles.displayName}>
                  {profile?.first_name || profile?.username || t('user', 'Utilisateur')}
                </Text>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                  <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('saved')}>
                    <Text style={styles.statNumber}>{tabCounts.saved}</Text>
                    <Text style={styles.statLabel}>{t('my_favorites', 'Saved')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('liked')}>
                    <Text style={styles.statNumber}>{tabCounts.liked}</Text>
                    <Text style={styles.statLabel}>{t('my_likes', 'Liked')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem} onPress={() => setActiveTab('following')}>
                    <Text style={styles.statNumber}>{tabCounts.following}</Text>
                    <Text style={styles.statLabel}>{t('following')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                onPress={() => setActiveTab('saved')}
              >
                <Ionicons
                  name="bookmark"
                  size={24}
                  color={activeTab === 'saved' ? COLORS.ink : COLORS.lightGray}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
                onPress={() => setActiveTab('liked')}
              >
                <Ionicons
                  name="heart"
                  size={24}
                  color={activeTab === 'liked' ? COLORS.ink : COLORS.lightGray}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                onPress={() => setActiveTab('following')}
              >
                <Ionicons
                  name="people"
                  size={24}
                  color={activeTab === 'following' ? COLORS.ink : COLORS.lightGray}
                />
              </TouchableOpacity>
            </View>

          </>
        }
        ListEmptyComponent={dataLoading ? (
          <SkeletonProfileGrid count={4} />
        ) : renderEmptyState()}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {selectedOffer && (
        <OfferDetailModal
          visible={showOfferModal}
          offer={selectedOffer}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedOffer(null);
          }}
          isFavorite={favorites.offers.has(selectedOffer.id)}
          onFavoritePress={async () => {
            if (!selectedOffer) return;
            await toggleFavorite('offer', selectedOffer.id);
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          visible={showEventModal}
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          isFavorite={favorites.events.has(selectedEvent.id)}
          onFavoritePress={async () => {
            if (!selectedEvent) return;
            await toggleFavorite('event', selectedEvent.id);
          }}
        />
      )}

      {selectedCommerce && (
        <BusinessDetailModal
          visible={showCommerceModal}
          business={selectedCommerce}
          onClose={() => {
            setShowCommerceModal(false);
            setSelectedCommerce(null);
          }}
          isFollowing={follows.has(selectedCommerce.id)}
          onFollowPress={async () => {
            if (!selectedCommerce) return;
            await toggleFollow(selectedCommerce.id);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Header (logo + gear)
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 0,
    backgroundColor: COLORS.white,
  },
  profileLogo: {
    width: 95,
    height: 50,
  },
  gearButton: {
    padding: SPACING.xs,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerUsername: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  // Profile Section - Instagram Style
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
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statsAndNameContainer: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: SPACING.xl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.ink,
  },
  // Grid
  gridContainer: {
    paddingBottom: 100,
    paddingHorizontal: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  // Compact Cards
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: GRID_GAP,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.gray,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerBadge: {
    backgroundColor: COLORS.primary,
  },
  eventBadge: {
    backgroundColor: COLORS.teal,
  },
  commerceBadge: {
    backgroundColor: COLORS.ink,
  },
  cardContent: {
    padding: SPACING.sm,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.ink,
    lineHeight: 16,
  },
  loadingGrid: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  // Unauthenticated styles
  unauthContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xxl * 2,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  authButtonsContainer: {
    width: '100%',
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    gap: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  featuresSection: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    fontWeight: '500',
  },
});
