import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  id: string;
  text: string;
  place_name: string;
  type: 'commerce' | 'address';
  properties?: any;
  _suggestion?: any;
}

interface SearchOverlayProps {
  visible: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onSelectCommerce: (commerce: any) => void;
  onSelectAddress: (address: any) => void;
  commerceResults: any[];
  addressResults: SearchResult[];
  isSearching: boolean;
}

const COLORS = {
  white: '#FFFFFF',
  background: '#F8F9FA',
  primary: '#FF6233',
  teal: '#016167',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  border: '#E8EAED',
  darkGray: '#666666',
};

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  visible,
  initialQuery = '',
  onClose,
  onSearchChange,
  onSelectCommerce,
  onSelectAddress,
  commerceResults,
  addressResults,
  isSearching,
}) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const searchInputRef = useRef<TextInput>(null);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    onSearchChange(text);
  };

  const handleClear = () => {
    setQuery('');
    onSearchChange('');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (!visible) return null;

  const hasResults = commerceResults.length > 0 || addressResults.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SafeAreaView style={styles.safeArea}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <IconSymbol name="arrow.left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableWithoutFeedback onPress={() => searchInputRef.current?.focus()}>
            <View style={styles.searchBar}>
              <IconSymbol name="magnifyingglass" size={20} color={COLORS.textSecondary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                placeholder={t('search_placeholder_businesses')}
                placeholderTextColor={COLORS.textSecondary}
                returnKeyType="search"
                onSubmitEditing={dismissKeyboard}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('loading_offers')}...</Text>
            </View>
          ) : hasResults ? (
            <FlatList
              data={[
                // Local commerces first
                ...commerceResults.slice(0, 8).map((commerce) => ({
                  type: 'commerce',
                  data: commerce,
                  id: `commerce-${commerce.id}`,
                })),
                // Mapbox addresses second
                ...addressResults.slice(0, 8).map((result) => ({
                  type: 'address',
                  data: result,
                  id: `address-${result.id}`,
                })),
              ]}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={dismissKeyboard}
              renderItem={({ item }) => {
                if (item.type === 'commerce') {
                  const commerce = item.data;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.resultItem,
                        commerce.boosted && styles.resultItemBoosted
                      ]}
                      onPress={() => {
                        onSelectCommerce(commerce);
                        onClose();
                      }}
                    >
                      {commerce.image_url ? (
                        <Image
                          source={{ uri: commerce.image_url }}
                          style={styles.resultLogo}
                        />
                      ) : (
                        <View style={[
                          styles.resultIconContainer,
                          commerce.boosted && styles.resultIconContainerBoosted
                        ]}>
                          <IconSymbol
                            name="storefront.fill"
                            size={24}
                            color={commerce.boosted ? COLORS.primary : COLORS.teal}
                          />
                        </View>
                      )}
                      <View style={styles.resultTextContainer}>
                        <View style={styles.resultTitleRow}>
                          <Text style={[
                            styles.resultTitle,
                            commerce.boosted && styles.resultTitleBoosted
                          ]} numberOfLines={1}>
                            {commerce.name}
                          </Text>
                          {commerce.boosted && (
                            <View style={styles.boostedBadge}>
                              <IconSymbol name="star.fill" size={10} color={COLORS.white} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {commerce.category ? (i18n.language === 'fr' ? commerce.category.name_fr : commerce.category.name_en) : 'Commerce'} • {commerce.address}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  );
                } else {
                  const address = item.data;
                  return (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => {
                        onSelectAddress(address);
                        onClose();
                      }}
                    >
                      <View style={styles.resultIconContainer}>
                        <IconSymbol
                          name={address.properties?.feature_type === 'address' ? 'mappin.circle.fill' : 'building.2.fill'}
                          size={24}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={styles.resultTextContainer}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {address.text}
                        </Text>
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {address.place_name}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  );
                }
              }}
              contentContainerStyle={styles.resultsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : query.length > 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="magnifyingglass" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>{t('no_offers_title')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('search_try_another')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="magnifyingglass" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>{t('search_title')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('search_subtitle')}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    zIndex: 2000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    padding: 0,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  resultsList: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 76,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resultItemBoosted: {
    backgroundColor: 'rgba(255, 98, 51, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  resultIconContainerBoosted: {
    backgroundColor: 'rgba(255, 98, 51, 0.1)',
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitleBoosted: {
    color: COLORS.primary,
  },
  boostedBadge: {
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
