import { IconSymbol } from '@/components/ui/IconSymbol';
import type { OfferWithCommerce } from '@/hooks/useOffers';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  inkDim: '#4B5563',
  bg: '#FFFFFF',
  bgMuted: '#F6F7F9',
  line: 'rgba(0,0,0,0.08)',
  teal: 'rgb(1,111,115)',
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

const OfferCardComponent: React.FC<OfferCardProps> = ({ offer, onPress, onFavoritePress }) => {
  const { t } = useTranslation();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${offer.title}${offer.commerces?.name ? `\n${offer.commerces.name}` : ''}${offer.description ? `\n${offer.description}` : ''}`,
        title: offer.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getTimeLeft = () => {
    if (!offer.end_date) return null;
    const end = new Date(offer.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hrs = Math.ceil(diff / (1000 * 3600));
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (hrs <= 0) return t('expired_caps');
    if (hrs < 24) return t('ends_in_hours', { hours: hrs });
    if (days <= 7) return t('ends_in_days', { days });
    return null;
  };

  const locationText = offer.custom_location || offer.commerces?.address || t('location_not_specified');
  const timeLeft = getTimeLeft();
  const isExpired = timeLeft === t('expired_caps');

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
      accessibilityLabel={`${offer.title} at ${offer.commerces?.name || t('business')}`}
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
        {offer.boosted && (
          <View style={styles.mediaTop}>
            <View style={styles.boostBadge}>
              <IconSymbol name="star.fill" size={12} color="#FFD700" />
              <Text style={styles.boostText}>
                {offer.boost_type === 'en_vedette' ? t('featured') : t('promoted')}
              </Text>
            </View>
          </View>
        )}

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
        <View style={styles.contentSection}>
          <View style={styles.headerRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {offer.commerces?.name || t('business')}
            </Text>
            {offer.commerces?.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{offer.commerces.category}</Text>
              </View>
            )}
          </View>

          <Text style={styles.offerTitle} numberOfLines={1}>
            {offer.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {offer.description}
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryBtn, isExpired && styles.primaryBtnDisabled]} onPress={onPress}>
            <Text style={[styles.primaryText, isExpired && styles.primaryTextDisabled]}>
              {isExpired ? t('expired') : t('view_offer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} accessibilityRole="button">
            <IconSymbol name="paperplane.fill" size={18} color={COLORS.teal} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OfferCard = memo(OfferCardComponent);
OfferCard.displayName = 'OfferCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RAD.lg,
    marginHorizontal: Platform.OS === 'android' ? 0 : SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: Platform.OS === 'android' ? 4 : SPACING.sm,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.line,
    width: Platform.OS === 'android' ? 340 : 356,
    height: Platform.OS === 'android' ? 460 : 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'android' && { alignSelf: 'center' }),
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

  media: { 
    position: 'relative', 
    height: Platform.OS === 'android' ? 250 : 267, 
    backgroundColor: COLORS.bgMuted 
  },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },

  mediaTop: {
    position: 'absolute',
    top: SPACING.lg, left: SPACING.sm, right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

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

  body: {
    height: Platform.OS === 'android' ? 210 : 213,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
  },

  contentSection: {
    gap: SPACING.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
  },
  categoryChip: {
    backgroundColor: COLORS.bgMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RAD.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.ink,
  },

  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 13,
    color: COLORS.inkDim,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },

  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.lg,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  primaryBtnDisabled: { backgroundColor: COLORS.bgMuted },
  primaryText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  primaryTextDisabled: { color: COLORS.inkDim },

  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.teal,
  },
});
