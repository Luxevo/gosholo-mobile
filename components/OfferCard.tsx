import { IconSymbol } from '@/components/ui/IconSymbol';
import type { OfferWithCommerce } from '@/hooks/useOffers';
import { supabase } from '@/lib/supabase';
import { getShareMessage, openShareSheet } from '@/utils/deepLinks';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinkableText } from './LinkableText';

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
  isFavorite?: boolean;
}

const OfferCardComponent: React.FC<OfferCardProps> = ({ offer, onPress, onFavoritePress, isFavorite = false }) => {
  const { t, i18n } = useTranslation();

  const handleShare = async () => {
    try {
      const shareData = getShareMessage({
        type: 'offer',
        id: offer.id,
        title: offer.title,
        businessName: offer.commerces?.name,
        description: offer.description,
      });
      const shared = await openShareSheet({
        message: shareData.message,
        title: shareData.title,
        url: shareData.url,
      });
      // Track share count if user actually shared
      if (shared) {
        await supabase.rpc('increment_offer_share', { offer_id: offer.id });
      }
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
                <Text style={styles.categoryText}>
                  {i18n.language === 'fr' ? offer.commerces.category.name_fr : offer.commerces.category.name_en}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.offerTitle} numberOfLines={1}>
            {offer.title}
          </Text>

          <LinkableText style={styles.description} linkColor={COLORS.teal} numberOfLines={2}>
            {offer.description}
          </LinkableText>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryBtn, isExpired && styles.primaryBtnDisabled]} onPress={onPress}>
            <Text style={[styles.primaryText, isExpired && styles.primaryTextDisabled]}>
              {isExpired ? t('expired') : t('view_offer')}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            {onFavoritePress && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onFavoritePress}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? t('remove_from_favorites') : t('save_to_favorites')}
              >
                <IconSymbol
                  name={isFavorite ? "heart.fill" : "heart"}
                  size={20}
                  color={isFavorite ? COLORS.primary : COLORS.teal}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare} accessibilityRole="button">
              <IconSymbol name="paperplane.fill" size={18} color={COLORS.teal} />
            </TouchableOpacity>
          </View>
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
    marginTop: SPACING.sm,
    marginBottom: Platform.OS === 'android' ? 4 : SPACING.sm,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.line,
    width: Platform.OS === 'android' ? 340 : 356,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignSelf: 'center',
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
    aspectRatio: 4 / 5,
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
    marginBottom: SPACING.sm,
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

  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
});
