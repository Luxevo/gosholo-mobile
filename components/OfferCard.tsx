import { IconSymbol } from '@/components/ui/IconSymbol';
import type { OfferWithCommerce } from '@/hooks/useOffers';
import { supabase } from '@/lib/supabase';
import { getShareMessage, openShareSheet } from '@/utils/deepLinks';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LinkableText } from './LinkableText';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  inkDim: '#6B7280',
  bg: '#FFFFFF',
  bgMuted: '#F3F4F6',
  line: 'rgba(0,0,0,0.06)',
  teal: 'rgb(1,111,115)',
  success: '#B2FD9D',
  white: '#FFFFFF',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

const RAD = {
  sm: 8,
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
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${offer.title} at ${offer.commerces?.name || t('business')}`}
    >
      {/* Media */}
      <View style={styles.media}>
        {offer.image_url ? (
          <ImageBackground source={{ uri: offer.image_url }} style={styles.mediaBg} imageStyle={styles.mediaImg} />
        ) : (
          <View style={[styles.mediaBg, styles.mediaPlaceholder]}>
            <IconSymbol name="fork.knife" size={28} color={COLORS.white} />
          </View>
        )}

        {/* Gradient fade + location */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.mediaGradient}
        >
          <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.businessRow}>
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

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
            <Text style={styles.primaryText}>{t('view_offer')}</Text>
          </TouchableOpacity>

          <View style={styles.actionIcons}>
            {onLikePress && (
              <TouchableOpacity style={styles.iconBtn} onPress={onLikePress} accessibilityLabel={isLiked ? t('unlike') : t('like')}>
                <IconSymbol name={isLiked ? "heart.fill" : "heart"} size={17} color={isLiked ? "#FF4D6A" : COLORS.inkDim} />
                {(likeCount !== undefined && likeCount > 0) && (
                  <Text style={styles.likeCount}>{likeCount}</Text>
                )}
              </TouchableOpacity>
            )}
            {onFavoritePress && (
              <TouchableOpacity style={styles.iconBtn} onPress={onFavoritePress} accessibilityLabel={isFavorite ? t('remove_from_favorites') : t('save_to_favorites')}>
                <IconSymbol name={isFavorite ? "bookmark.fill" : "bookmark"} size={17} color={isFavorite ? COLORS.primary : COLORS.inkDim} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <IconSymbol name="paperplane.fill" size={15} color={COLORS.inkDim} />
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
    marginTop: SPACING.sm,
    marginBottom: Platform.OS === 'android' ? 4 : SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    width: Platform.OS === 'android' ? 320 : 336,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    alignSelf: 'center',
  },

  // Media
  media: {
    position: 'relative',
    aspectRatio: 4 / 4.5,
    backgroundColor: COLORS.bgMuted,
    overflow: 'hidden',
  },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal },

  mediaGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: 28,
    paddingBottom: SPACING.sm,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },

  // Body
  body: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },

  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  businessName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkDim,
    flexShrink: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryChip: {
    backgroundColor: COLORS.bgMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAD.sm,
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
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: COLORS.inkDim,
    lineHeight: 16,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.lg,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: RAD.pill,
    gap: 2,
  },
  likeCount: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkDim,
  },
});
