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
  onLikePress?: () => void;
  isLiked?: boolean;
  likeCount?: number;
}

const OfferCardComponent: React.FC<OfferCardProps> = ({ offer, onPress, onFavoritePress, isFavorite = false, onLikePress, isLiked = false, likeCount }) => {
  const { t, i18n } = useTranslation();

  const handleShare = async () => {
    try {
      const shareData = getShareMessage({
        type: 'offer',
        id: offer.id,
        title: offer.title,
        businessName: offer.commerces?.name,
        description: offer.description ?? undefined,
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

  const locationText = offer.custom_location || offer.commerces?.address || t('location_not_specified');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        offer.boosted && styles.cardBoosted
      ]}
      onPress={onPress}
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
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.contentSection}>
          <View style={styles.businessSection}>
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


          <Text style={styles.offerTitle} numberOfLines={2}>
            {offer.title}
          </Text>

          <LinkableText style={styles.description} linkColor={COLORS.teal} numberOfLines={2}>
            {offer.description}
          </LinkableText>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
            <Text style={styles.primaryText}>
              {t('view_offer')}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            {onLikePress && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onLikePress}
                accessibilityRole="button"
                accessibilityLabel={isLiked ? t('unlike') : t('like')}
              >
                <View style={styles.likeContainer}>
                  <IconSymbol
                    name={isLiked ? "heart.fill" : "heart"}
                    size={18}
                    color={isLiked ? "#FF4D6A" : COLORS.teal}
                  />
                  {(likeCount !== undefined && likeCount > 0) && (
                    <Text style={styles.likeCount}>{likeCount}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            {onFavoritePress && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onFavoritePress}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? t('remove_from_favorites') : t('save_to_favorites')}
              >
                <IconSymbol
                  name={isFavorite ? "bookmark.fill" : "bookmark"}
                  size={18}
                  color={isFavorite ? COLORS.primary : COLORS.teal}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare} accessibilityRole="button">
              <IconSymbol name="paperplane.fill" size={16} color={COLORS.teal} />
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
    borderRadius: RAD.md,
    marginTop: SPACING.xs,
    marginBottom: Platform.OS === 'android' ? 4 : SPACING.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
    width: Platform.OS === 'android' ? 320 : 336,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignSelf: 'center',
  },
  cardBoosted: {
    borderWidth: 1.5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },

  media: {
    position: 'relative',
    aspectRatio: 4 / 4.5,
    backgroundColor: COLORS.bgMuted,
    overflow: 'hidden',
  },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },

  mediaTop: {
    position: 'absolute',
    top: SPACING.md, left: SPACING.sm, right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RAD.pill,
    gap: 3,
  },
  boostText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFD700'
  },

  favBtn: {
    width: 28, height: 28,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  bar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barText: { fontSize: 11, fontWeight: '500', color: COLORS.white },

  body: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
  },

  contentSection: {
    gap: SPACING.xs,
    minHeight: 110,
  },

  businessSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 6,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
  },
  categoryChip: {
    backgroundColor: COLORS.bgMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAD.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.inkDim,
  },

  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: COLORS.inkDim,
    lineHeight: 16,
    marginBottom: 2,
  },

  actions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.md,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  primaryText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: RAD.pill,
    backgroundColor: COLORS.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likeCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkDim,
  },
});
