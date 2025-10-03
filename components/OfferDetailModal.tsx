import { IconSymbol } from '@/components/ui/IconSymbol';
import { Offer } from '@/lib/supabase';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  teal: '#016167',
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
}

export default function OfferDetailModal({
  visible,
  offer,
  onClose,
  onFavoritePress
}: OfferDetailModalProps) {
  if (!offer) return null;

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

    if (days < 0) return { text: 'Expired', color: COLORS.inkLight };
    if (days === 0) return { text: 'Ends Today', color: COLORS.primary };
    if (days === 1) return { text: '1 Day Left', color: COLORS.primary };
    if (days <= 7) return { text: `${days} Days Left`, color: COLORS.teal };
    return null;
  };

  const getOfferTypeText = (type: string) => {
    switch (type) {
      case 'in_store': return 'In-Store Only';
      case 'online': return 'Online Only';
      case 'both': return 'In-Store & Online';
      default: return type;
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
          bounces={false}
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
                <IconSymbol name="xmark" size={18} color={COLORS.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={onFavoritePress} activeOpacity={0.7}>
                <IconSymbol name="heart" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Boost badge on image */}
            {offer.boosted && (
              <View style={styles.heroBoostBadge}>
                <IconSymbol name="star.fill" size={12} color={COLORS.success} />
                <Text style={styles.heroBoostText}>
                  {offer.boost_type === 'en_vedette' ? 'Featured' : 'Promoted'}
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
              <View style={styles.businessInfo}>
                <IconSymbol name="storefront.fill" size={16} color={COLORS.teal} />
                <Text style={styles.businessName} numberOfLines={1}>
                  {offer.commerces?.name || 'Business'}
                </Text>
              </View>
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
                <Text style={styles.infoCardLabel}>Type</Text>
                <Text style={styles.infoCardValue}>{getOfferTypeText(offer.offer_type)}</Text>
              </View>

              {getTimeRemaining() && (
                <View style={[styles.infoCard, styles.infoCardHighlight]}>
                  <IconSymbol name="clock.fill" size={18} color={getTimeRemaining()!.color} />
                  <Text style={styles.infoCardLabel}>Time Left</Text>
                  <Text style={[styles.infoCardValue, { color: getTimeRemaining()!.color }]}>
                    {getTimeRemaining()!.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Location Card */}
            {(offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location) && (
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <IconSymbol name="mappin.circle.fill" size={20} color={COLORS.teal} />
                  <Text style={styles.locationLabel}>Location</Text>
                </View>
                <Text style={styles.locationText}>
                  {offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location}
                </Text>
              </View>
            )}

            {/* Validity Period */}
            {(offer.start_date || offer.end_date) && (
              <View style={styles.validityCard}>
                <View style={styles.validityRow}>
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>Valid From</Text>
                    <Text style={styles.validityValue}>{offer.start_date ? formatDate(offer.start_date) : '—'}</Text>
                  </View>
                  <View style={styles.validitySeparator} />
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>Valid Until</Text>
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
                  <Text style={styles.conditionsLabel}>Terms & Conditions</Text>
                </View>
                <Text style={styles.conditionsText}>{offer.condition}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
    height: 240,
    backgroundColor: COLORS.teal,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.teal,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  heroBoostBadge: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.xl,
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
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.line,
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
    backgroundColor: COLORS.bgMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkDim,
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
    backgroundColor: COLORS.bgMuted,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
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
    color: COLORS.ink,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.inkDim,
    lineHeight: 22,
  },

  // Validity Card
  validityCard: {
    backgroundColor: COLORS.bgMuted,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
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
    color: COLORS.inkLight,
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
    backgroundColor: COLORS.line,
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