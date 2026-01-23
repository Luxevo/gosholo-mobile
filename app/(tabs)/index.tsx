import BusinessDetailModal from '@/components/BusinessDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Commerce, useCommerces } from '@/hooks/useCommerces';
import { useFollows } from '@/hooks/useFollows';
import { matchesSearch } from '@/utils/searchUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16px padding on each side + 16px gap

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

interface Section {
  title: string;
  data: Commerce[][];
  isFeatured?: boolean;
}

type SectionData = Section;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { commerces, loading, error, refetch } = useCommerces();
  const { isFollowing, toggleFollow } = useFollows();
  const [selectedBusiness, setSelectedBusiness] = useState<Commerce | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCity, setUserCity] = useState('');

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (address.city) {
            setUserCity(address.city);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      }
    })();
  }, []);

  // Filter commerces by search
  const filteredCommerces = useMemo(() => {
    if (!searchQuery.trim()) return commerces;

    const query = searchQuery.trim();
    return commerces.filter((commerce) =>
      matchesSearch(commerce.name, query) ||
      matchesSearch(commerce.address, query) ||
      matchesSearch(commerce.category?.name_fr, query) ||
      matchesSearch(commerce.category?.name_en, query)
    );
  }, [commerces, searchQuery]);

  // Group businesses into sections: Featured first, then by letter
  const sections = useMemo(() => {
    const result: Section[] = [];

    // Separate boosted and regular businesses
    const boosted = filteredCommerces.filter(c => c.boosted);
    const regular = filteredCommerces.filter(c => !c.boosted);

    // Sort regular businesses alphabetically
    const sortedRegular = [...regular].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );

    // Add featured section if there are boosted businesses
    if (boosted.length > 0) {
      // Sort boosted alphabetically too
      const sortedBoosted = [...boosted].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
      // Group into pairs for 2-column layout
      const pairs: Commerce[][] = [];
      for (let i = 0; i < sortedBoosted.length; i += 2) {
        pairs.push(sortedBoosted.slice(i, i + 2));
      }
      result.push({
        title: '⭐',
        data: pairs,
        isFeatured: true,
      });
    }

    // Group regular businesses by first letter
    const letterGroups: { [key: string]: Commerce[] } = {};

    sortedRegular.forEach(commerce => {
      const firstChar = (commerce.name || '').charAt(0).toUpperCase();
      // Handle numbers and special characters
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';

      if (!letterGroups[letter]) {
        letterGroups[letter] = [];
      }
      letterGroups[letter].push(commerce);
    });

    // Sort letters and create sections
    const sortedLetters = Object.keys(letterGroups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    sortedLetters.forEach(letter => {
      const businesses = letterGroups[letter];
      // Group into pairs for 2-column layout
      const pairs: Commerce[][] = [];
      for (let i = 0; i < businesses.length; i += 2) {
        pairs.push(businesses.slice(i, i + 2));
      }
      result.push({
        title: letter,
        data: pairs,
      });
    });

    return result;
  }, [filteredCommerces]);


  const handleBusinessPress = (business: Commerce) => {
    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  const handleFollowPress = async () => {
    if (!selectedBusiness) return;
    const result = await toggleFollow(selectedBusiness.id);
    if (result.needsLogin) {
      Alert.alert(
        t('login_required'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNavigateToMap = (address: string, coordinates?: [number, number]) => {
    setShowBusinessModal(false);
    if (coordinates) {
      router.push({
        pathname: '/compass',
        params: {
          destinationLng: coordinates[0].toString(),
          destinationLat: coordinates[1].toString(),
          destinationName: address,
        },
      });
    }
  };

  const handleQuickFollow = async (commerceId: string) => {
    const result = await toggleFollow(commerceId);
    if (result.needsLogin) {
      Alert.alert(
        t('login_required'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    }
  };

  const renderBusinessCard = (item: Commerce) => {
    const categoryName = item.category
      ? (i18n.language === 'fr' ? item.category.name_fr : item.category.name_en)
      : null;

    return (
      <TouchableOpacity
        style={styles.businessCard}
        onPress={() => handleBusinessPress(item)}
        activeOpacity={0.7}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.businessImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.businessImagePlaceholder}>
            <Ionicons name="business-outline" size={32} color={COLORS.lightGray} />
          </View>
        )}
        <View style={styles.businessInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={2}>{item.name}</Text>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing(item.id) && styles.followButtonActive,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleQuickFollow(item.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFollowing(item.id) ? 'checkmark' : 'add'}
                size={12}
                color={isFollowing(item.id) ? COLORS.white : COLORS.teal}
              />
            </TouchableOpacity>
          </View>
          {categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1}>{categoryName}</Text>
            </View>
          )}
          {item.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.darkGray} />
              <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            </View>
          )}
        </View>
        {item.boosted && (
          <View style={styles.boostedBadge}>
            <Ionicons name="star" size={10} color={COLORS.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item }: { item: Commerce[] }) => (
    <View style={styles.row}>
      {item.map((business, index) => (
        <View key={business.id} style={index === 0 ? styles.cardLeft : styles.cardRight}>
          {renderBusinessCard(business)}
        </View>
      ))}
      {/* Add empty space if odd number */}
      {item.length === 1 && <View style={styles.cardRight} />}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, section.isFeatured && styles.featuredHeader]}>
      {section.isFeatured ? (
        <View style={styles.featuredTitleRow}>
          <Ionicons name="star" size={16} color={COLORS.primary} />
          <Text style={styles.featuredTitle}>{t('featured', 'En vedette')}</Text>
        </View>
      ) : (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.businessCountRow}>
        <Text style={styles.businessCount}>
          {filteredCommerces.length} {t('businesses')}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="business-outline" size={48} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>{t('no_results')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {loading && commerces.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loading')}...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.primary} />
          <Text style={styles.errorText}>{t('something_wrong')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>{t('try_again')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          {/* Header */}
          <AppHeader location={userCity} />

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('search_placeholder_businesses')}
          />

          <SectionList<Commerce[], SectionData>
            sections={sections}
            renderItem={renderRow}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item, index) => item.map(c => c.id).join('-') + index}
            stickySectionHeadersEnabled={true}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            style={styles.sectionList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        </View>
      )}

      <BusinessDetailModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={() => {
          setShowBusinessModal(false);
          setSelectedBusiness(null);
        }}
        onNavigateToMap={handleNavigateToMap}
        isFollowing={selectedBusiness ? isFollowing(selectedBusiness.id) : false}
        onFollowPress={handleFollowPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listWrapper: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  businessCountRow: {
    alignItems: 'flex-start',
  },
  businessCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 4,
  },
  sectionHeader: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  featuredHeader: {
    backgroundColor: 'rgba(255, 98, 51, 0.05)',
    borderBottomColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.teal,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  cardLeft: {
    width: CARD_WIDTH,
  },
  cardRight: {
    width: CARD_WIDTH,
  },
  businessCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  businessImage: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.gray,
  },
  businessImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    padding: SPACING.sm,
    height: 85,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    minHeight: 32,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addressText: {
    fontSize: 10,
    color: COLORS.darkGray,
    flex: 1,
  },
  boostedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: COLORS.white,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  followButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  sectionList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.ink,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
