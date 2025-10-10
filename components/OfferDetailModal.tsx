import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces } from '@/hooks/useCommerces';
import { Offer } from '@/lib/supabase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BusinessDetailModal from './BusinessDetailModal';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  inkMedium: '#374151',
  inkDim: '#6B7280',
  inkLight: '#9CA3AF',
  white: '#FFFFFF',
  bg: '#FFFFFF',
  bgMuted: '#F9FAFB',
  line: 'rgba(0,0,0,0.06)',
  overlay: 'rgba(17,24,39,0.75)',
  teal: 'rgb(1,111,115)',
  success: '#B2FD9D',
  lightBlue: '#5BC4DB',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

interface OfferDetailModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
  onFavoritePress?: () => void;
  onNavigateToMap?: (address: string, coordinates?: [number, number]) => void;
}

export default function OfferDetailModal({
  visible,
  offer,
  onClose,
  onFavoritePress,
  onNavigateToMap
}: OfferDetailModalProps) {
  const { t } = useTranslation();
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const { commerces } = useCommerces();
  
  if (!offer) return null;

  // Find the business from the useCommerces hook that matches the offer's commerce
  const business = offer.commerces ? commerces.find(c => c.id === offer.commerces?.id) || null : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    if (!offer.end_date) return null;
    const now = new Date();
    const end = new Date(offer.end_date);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: t('expired'), color: COLORS.inkLight };
    if (days === 0) return { text: t('ends_today'), color: COLORS.primary };
    if (days === 1) return { text: t('one_day_left'), color: COLORS.primary };
    if (days <= 7) return { text: t('days_left', { days }), color: COLORS.teal };
    return null;
  };

  const getOfferTypeText = (type: string) => {
    switch (type) {
      case 'in_store': return t('in_store_only');
      case 'online': return t('online_only');
      case 'both': return t('in_store_and_online');
      default: return type;
    }
  };

  const handleLocationPress = () => {
    if (!onNavigateToMap || !offer) return;
    
    let coordinates: [number, number] | undefined;
    let address: string | undefined;
    
    // 1. Priorité aux coordonnées directes de l'offre
    if (offer.latitude && offer.longitude) {
      coordinates = [offer.longitude, offer.latitude];
    }
    // 2. Sinon, coordonnées du commerce
    else if (offer.uses_commerce_location && offer.commerces?.longitude && offer.commerces?.latitude) {
      coordinates = [offer.commerces.longitude, offer.commerces.latitude];
    }
    // 3. Sinon, adresse personnalisée (géocodage)
    else if (offer.custom_location) {
      address = offer.custom_location;
    }
    
    if (coordinates || address) {
      onClose(); // Fermer le modal
      onNavigateToMap(address || '', coordinates); // Naviguer vers la carte
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            {offer.image_url ? (
              <>
                <Image
                  source={{ uri: offer.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroGradient} />
              </>
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <IconSymbol name="photo" size={64} color={COLORS.white} />
              </View>
            )}

            {/* Floating header buttons */}
            <SafeAreaView edges={['top']} style={styles.floatingHeader}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={onFavoritePress} activeOpacity={0.7}>
                <IconSymbol name="heart" size={20} color={COLORS.teal} />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Boost badge on image */}
            {offer.boosted && (
              <View style={styles.heroBoostBadge}>
                <IconSymbol name="star.fill" size={12} color={COLORS.success} />
                <Text style={styles.heroBoostText}>
                  {offer.boost_type === 'en_vedette' ? t('featured') : t('promoted')}
                </Text>
              </View>
            )}
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Business & Category */}
            <View style={styles.businessRow}>
              <TouchableOpacity
                style={styles.businessInfo}
                onPress={() => setBusinessModalVisible(true)}
                activeOpacity={0.7}
              >
                <IconSymbol name="storefront.fill" size={16} color={COLORS.teal} />
                <Text style={styles.businessName} numberOfLines={1}>
                  {offer.commerces?.name || t('business')}
                </Text>
              </TouchableOpacity>
              {offer.commerces?.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{offer.commerces.category}</Text>
                </View>
              )}
            </View>

            {/* Offer Title */}
            <Text style={styles.title}>{offer.title}</Text>

            {/* Description */}
            <Text style={styles.subtitle}>{offer.description}</Text>

            {/* Key Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <IconSymbol name="tag.fill" size={18} color={COLORS.primary} />
                <Text style={styles.infoCardLabel}>{t('type')}</Text>
                <Text style={styles.infoCardValue}>{getOfferTypeText(offer.offer_type)}</Text>
              </View>

              {getTimeRemaining() && (
                <View style={[styles.infoCard, styles.infoCardHighlight]}>
                  <IconSymbol name="clock.fill" size={18} color={getTimeRemaining()!.color} />
                  <Text style={styles.infoCardLabel}>{t('time_left')}</Text>
                  <Text style={[styles.infoCardValue, { color: getTimeRemaining()!.color }]}>
                    {getTimeRemaining()!.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Location Card */}
            {(offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location) && (
              <TouchableOpacity style={styles.locationCard} onPress={handleLocationPress} activeOpacity={0.7}>
                <View style={styles.locationHeader}>
                  <IconSymbol name="mappin.circle.fill" size={20} color={COLORS.teal} />
                  <Text style={styles.locationLabel}>{t('location')}</Text>
                  <IconSymbol name="chevron.right" size={16} color={COLORS.teal} style={styles.locationChevron} />
                </View>
                <Text style={styles.locationText}>
                  {offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location}
                </Text>
              </TouchableOpacity>
            )}

            {/* Validity Period */}
            {(offer.start_date || offer.end_date) && (
              <View style={styles.validityCard}>
                <View style={styles.validityRow}>
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>{t('valid_from')}</Text>
                    <Text style={styles.validityValue}>{offer.start_date ? formatDate(offer.start_date) : '—'}</Text>
                  </View>
                  <View style={styles.validitySeparator} />
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>{t('valid_until')}</Text>
                    <Text style={styles.validityValue}>{offer.end_date ? formatDate(offer.end_date) : '—'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Conditions */}
            {offer.condition && (
              <View style={styles.conditionsCard}>
                <View style={styles.conditionsHeader}>
                  <IconSymbol name="info.circle.fill" size={18} color={COLORS.inkDim} />
                  <Text style={styles.conditionsLabel}>{t('terms_conditions')}</Text>
                </View>
                <Text style={styles.conditionsText}>{offer.condition}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Business Detail Modal */}
      <BusinessDetailModal
        visible={businessModalVisible}
        business={business}
        onClose={() => setBusinessModalVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Hero section
  heroContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: COLORS.teal,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeText: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.teal,
    lineHeight: 28,
    marginTop: -2,
  },

  heroBoostBadge: {
    position: 'absolute',
    bottom: 35,
    left: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    gap: 4,
  },
  heroBoostText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.3,
  },

  // Content card
  contentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xxl,
  },

  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
    flexShrink: 1,
  },
  categoryPill: {
    backgroundColor: 'rgba(1, 111, 115, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(1, 111, 115, 0.3)',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.teal,
    letterSpacing: 0.3,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: SPACING.md,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.inkMedium,
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.bgMuted,
    padding: SPACING.lg,
    borderRadius: 16,
    gap: SPACING.xs,
  },
  infoCardHighlight: {
    backgroundColor: 'rgba(178, 253, 157, 0.15)',
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },

  // Location Card
  locationCard: {
    backgroundColor: 'rgba(178, 253, 157, 0.12)',
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(178, 253, 157, 0.35)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.teal,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.inkDim,
    lineHeight: 22,
  },
  locationChevron: {
    marginLeft: 'auto',
  },

  // Validity Card
  validityCard: {
    backgroundColor: 'rgba(1, 97, 103, 0.08)',
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(1, 97, 103, 0.2)',
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  validityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validityValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  validitySeparator: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(1, 97, 103, 0.3)',
    marginHorizontal: SPACING.lg,
  },

  // Conditions Card
  conditionsCard: {
    backgroundColor: 'rgba(255, 98, 51, 0.08)',
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 51, 0.25)',
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  conditionsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  conditionsText: {
    fontSize: 14,
    color: COLORS.inkMedium,
    lineHeight: 21,
  },
});