import { IconSymbol } from '@/components/ui/IconSymbol';
import type { OfferWithCommerce } from '@/hooks/useOffers';
import React, { memo, useMemo } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  inkDim: '#4B5563',
  bg: '#FFFFFF',
  bgMuted: '#F6F7F9',
  line: 'rgba(0,0,0,0.08)',
  teal: '#016167',
  success: '#B2FD9D',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.55)',
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

interface OfferCardProps {
  offer: OfferWithCommerce;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = memo(({ offer, onPress, onFavoritePress }) => {
  const getDiscountText = (title: string) => {
    const discountMatch = title.match(/(\d+)%/);
    if (discountMatch) return `${discountMatch[1]}% OFF`;
    if (title.toLowerCase().includes('free')) return 'FREE';
    if (title.toLowerCase().includes('buy 1 get 1')) return 'BOGO';
    if (title.toLowerCase().includes('2 for')) return '2 FOR 1';
    return title.toUpperCase();
  };

  const getTimeLeft = () => {
    if (!offer.end_date) return null;
    const end = new Date(offer.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hrs = Math.ceil(diff / (1000 * 3600));
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (hrs <= 0) return 'EXPIRED';
    if (hrs < 24) return `Ends in ${hrs}h`;
    if (days <= 7) return `Ends in ${days}d`;
    return null;
  };

  const getPriceLevel = () => {
    switch (offer.commerces?.category) {
      case 'Restaurant': return '$$';
      case 'Café': return '$';
      case 'Épicerie': return '$';
      default: return '$$';
    }
  };

  const locationText = offer.custom_location || offer.commerces?.address || 'Location not specified';
  const conditionText = offer.condition || null;
  const discount = getDiscountText(offer.title);
  const timeLeft = getTimeLeft();
  const isExpired = timeLeft === 'EXPIRED';

  const offerTypeLabel = useMemo(() => {
    switch (offer.offer_type) {
      case 'both': return 'Online & In-Store';
      case 'online': return 'Online Only';
      case 'in_store': return 'In-Store Only';
      default: return offer.offer_type || 'Offer';
    }
  }, [offer.offer_type]);

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        isExpired && styles.cardDisabled,
        offer.boosted && styles.cardBoosted
      ]}
      onPress={onPress}
      disabled={isExpired}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${discount} at ${offer.commerces?.name || 'Business'}`}
    >
      {/* Media */}
      <View style={styles.media}>
        {offer.image_url ? (
          <ImageBackground source={{ uri: offer.image_url }} style={styles.mediaBg} imageStyle={styles.mediaImg}>
            <View style={styles.mediaOverlay} />
          </ImageBackground>
        ) : (
          <View style={[styles.mediaBg, styles.mediaPlaceholder]}>
            <IconSymbol name="fork.knife" size={32} color={COLORS.white} />
          </View>
        )}

        {/* Top overlay */}
        <View style={styles.mediaTop}>
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
          
          {offer.boosted && (
            <View style={styles.boostBadge}>
              <IconSymbol name="star.fill" size={12} color="#FFD700" />
              <Text style={styles.boostText}>
                {offer.boost_type === 'en_vedette' ? 'Featured' : 'Promoted'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom bar */}
        <View style={styles.bar}>
          <Text style={styles.barText} numberOfLines={1}>{locationText}</Text>
          {!!timeLeft && (
            <View style={[styles.timePill, isExpired && styles.timePillExpired]}>
              <Text style={[styles.timeText, isExpired && styles.timeTextExpired]}>{timeLeft}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {offer.commerces?.name || 'Business'}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {offer.commerces?.category} • {offerTypeLabel}
            </Text>
            {!!conditionText && <Text style={styles.condition} numberOfLines={1}>{conditionText}</Text>}
          </View>

          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{getPriceLevel()}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={[styles.primaryBtn, isExpired && styles.primaryBtnDisabled]} onPress={onPress}>
          <Text style={[styles.primaryText, isExpired && styles.primaryTextDisabled]}>
            {isExpired ? 'Expired' : 'Claim Offer'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RAD.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  cardDisabled: { opacity: 0.6 },
  
  cardBoosted: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  media: { position: 'relative', aspectRatio: 16 / 6, backgroundColor: COLORS.bgMuted },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },

  mediaTop: {
    position: 'absolute',
    top: SPACING.sm, left: SPACING.sm, right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  discountPill: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RAD.pill,
  },
  discountText: { fontSize: 12, fontWeight: '700', color: COLORS.teal },

  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RAD.pill,
    gap: 4,
  },
  boostText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#FFD700' 
  },

  favBtn: {
    width: 32, height: 32,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  bar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barText: { fontSize: 12, fontWeight: '500', color: COLORS.white },

  timePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    borderRadius: RAD.pill,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePillExpired: { backgroundColor: COLORS.inkDim },
  timeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  timeTextExpired: { color: COLORS.white },

  body: { padding: SPACING.md, gap: SPACING.sm, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  condition: { fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' },

  featuredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RAD.md,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  featuredText: { fontSize: 10, fontWeight: '600', color: COLORS.white, marginLeft: 4 },

  pricePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    borderRadius: RAD.pill,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceText: { fontSize: 12, fontWeight: '600', color: COLORS.teal },

  primaryBtn: {
    backgroundColor: COLORS.white,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.lg,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  primaryBtnDisabled: { backgroundColor: COLORS.bgMuted },
  primaryText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  primaryTextDisabled: { color: COLORS.inkDim },
});
