import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocation } from '@/contexts/LocationContext';
import { getMapboxSearchService, type SearchSuggestion } from '@/utils/mapboxSearch';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  border: '#E5E5E5',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { setCustomLocation, resetToDeviceLocation, isCustomLocation, locationName } = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchService = useMemo(() => {
    return getMapboxSearchService(MAPBOX_ACCESS_TOKEN);
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!text.trim()) {
      setResults([]);
      return;
    }

    // Debounce search
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const suggestions = await searchService.getSuggestions(text, {
          types: 'place,locality,neighborhood,address',
          limit: 8,
        });
        setResults(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [searchService]);

  const handleSelectLocation = useCallback(async (suggestion: SearchSuggestion) => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      const result = await searchService.retrievePlace(suggestion.mapbox_id);

      if (result && result.coordinates) {
        // coordinates is [lng, lat]
        // Just use the city/place name for cleaner UI
        await setCustomLocation(
          result.coordinates,
          suggestion.name
        );
        onClose();
      }
    } catch (error) {
      console.error('Error retrieving location:', error);
    } finally {
      setLoading(false);
      setQuery('');
      setResults([]);
    }
  }, [searchService, setCustomLocation, onClose]);

  const handleUseCurrentLocation = useCallback(async () => {
    Keyboard.dismiss();
    await resetToDeviceLocation();
    onClose();
    setQuery('');
    setResults([]);
  }, [resetToDeviceLocation, onClose]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  const renderResultItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <IconSymbol name="mappin" size={18} color={COLORS.teal} />
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.place_formatted && (
          <Text style={styles.resultSubtext} numberOfLines={1}>
            {item.place_formatted}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('change_location')}</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol name="magnifyingglass" size={18} color={COLORS.lightGray} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder={t('search_city_placeholder')}
              placeholderTextColor={COLORS.lightGray}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color={COLORS.lightGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.7}
        >
          <View style={styles.currentLocationIcon}>
            <IconSymbol name="location.fill" size={20} color={COLORS.teal} />
          </View>
          <View style={styles.currentLocationText}>
            <Text style={styles.currentLocationTitle}>{t('use_current_location')}</Text>
            {isCustomLocation && (
              <Text style={styles.currentLocationSubtext}>{t('reset_to_gps')}</Text>
            )}
          </View>
          {!isCustomLocation && (
            <IconSymbol name="checkmark" size={18} color={COLORS.teal} />
          )}
        </TouchableOpacity>

        {/* Current Selected Location */}
        {isCustomLocation && (
          <View style={styles.selectedLocationBanner}>
            <IconSymbol name="mappin.circle.fill" size={16} color={COLORS.primary} />
            <Text style={styles.selectedLocationText}>
              {t('currently_viewing')}: {locationName}
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.teal} />
          </View>
        )}

        {/* Results List */}
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item, index) => item.mapbox_id || index.toString()}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            query.length > 0 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('no_results')}</Text>
                <Text style={styles.emptySubtext}>{t('search_try_another')}</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

// Location Pill Component - shows current location, tap to open picker
interface LocationPillProps {
  onPress: () => void;
  compact?: boolean;
}

export const LocationPill: React.FC<LocationPillProps> = ({ onPress, compact = false }) => {
  const { locationName, isCustomLocation, loading } = useLocation();

  return (
    <TouchableOpacity
      style={[
        styles.locationPill,
        isCustomLocation && styles.locationPillCustom,
        compact && styles.locationPillCompact
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol
        name={isCustomLocation ? "mappin.circle.fill" : "location.fill"}
        size={compact ? 16 : 14}
        color={isCustomLocation ? COLORS.primary : COLORS.teal}
      />
      <Text
        style={[
          styles.locationPillText,
          isCustomLocation && styles.locationPillTextCustom,
          compact && styles.locationPillTextCompact
        ]}
        numberOfLines={1}
      >
        {loading ? '...' : locationName}
      </Text>
      <IconSymbol name="chevron.down" size={12} color={COLORS.darkGray} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.ink,
    paddingVertical: SPACING.md,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.ink,
  },
  currentLocationSubtext: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  selectedLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 98, 51, 0.1)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  selectedLocationText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink,
  },
  resultSubtext: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: SPACING.xs,
  },
  // Location Pill styles
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
    maxWidth: 200,
  },
  locationPillCustom: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 98, 51, 0.05)',
  },
  locationPillCompact: {
    paddingHorizontal: SPACING.md,
    maxWidth: 140,
    alignSelf: undefined,
  },
  locationPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.ink,
    flexShrink: 1,
  },
  locationPillTextCustom: {
    color: COLORS.primary,
  },
  locationPillTextCompact: {
    fontSize: 12,
    maxWidth: 80,
  },
});
