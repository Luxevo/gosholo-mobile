import { IconSymbol } from '@/components/ui/IconSymbol';
import type { EventWithCommerce } from '@/hooks/useEvents';
import { supabase } from '@/lib/supabase';
import { getShareMessage, openShareSheet } from '@/utils/deepLinks';
import React, { memo, useMemo } from 'react';
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
  overlay: 'rgba(0,0,0,0.55)',
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
  md: 12,
  lg: 16,
  pill: 999,
};

interface EventCardProps {
  event: EventWithCommerce;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  onLikePress?: () => void;
  isLiked?: boolean;
  likeCount?: number;
}

const EventCardComponent: React.FC<EventCardProps> = ({ event, onPress, onFavoritePress, isFavorite = false, onLikePress, isLiked = false, likeCount }) => {
  const { t, i18n } = useTranslation();

  const handleShare = async () => {
    try {
      const shareData = getShareMessage({
        type: 'event',
        id: event.id,
        title: event.title,
        businessName: event.commerces?.name,
        description: event.description,
      });
      const shared = await openShareSheet({
        message: shareData.message,
        title: shareData.title,
        url: shareData.url,
      });
      // Track share count if user actually shared
      if (shared) {
        await supabase.rpc('increment_event_share', { event_id: event.id });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ——— utils ———
  const formatDateRange = () => {
    if (!event.start_date) return t('date_tbd');
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : null;

    const f = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (end && +start !== +end) return `${f(start)} – ${f(end)}`;
    return f(start);
  };

  const getStatus = () => {
    if (!event.start_date) return null;
    const now = new Date();
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : start;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(start);
    eventDay.setHours(0, 0, 0, 0);

    if (now > end) return t('ended_caps');
    if (now >= start && now <= end) return t('happening_now');
    if (+today === +eventDay) return t('today_caps');
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    if (+tmr === +eventDay) return t('tomorrow_caps');
    return null;
  };

  const status = getStatus();
  const isEnded = status === t('ended_caps');

  const followOrShare = useMemo(
    () => (event.facebook_url || event.instagram_url ? t('follow') : t('share')),
    [event.facebook_url, event.instagram_url, t]
  );

  // ——— render ———
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        isEnded && styles.cardDisabled,
        event.boosted && styles.cardBoosted
      ]}
      onPress={onPress}
      disabled={isEnded}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatDateRange()}`}
    >
      {/* Boost chip */}
      {event.boosted && (
        <View style={styles.boostChip}>
          <IconSymbol name="star.fill" size={12} color="#FFD700" />
          <Text style={styles.boostText}>
            {event.boost_type === 'en_vedette' ? t('featured') : t('promoted')}
          </Text>
        </View>
      )}

      {/* Media */}
      <View style={styles.media}>
        {event.image_url ? (
          <ImageBackground source={{ uri: event.image_url }} style={styles.mediaBg} imageStyle={styles.mediaImg}>
            <View style={styles.mediaOverlay} />
          </ImageBackground>
        ) : (
          <View style={[styles.mediaBg, styles.mediaPlaceholder]}>
            <IconSymbol name="calendar" size={32} color={COLORS.white} />
          </View>
        )}

        {/* Date + Status bar */}
        <View style={styles.bar}>
          <View style={styles.barLeft}>
            <IconSymbol name="calendar" size={14} color={COLORS.white} />
            <Text style={styles.barText}>{formatDateRange()}</Text>
          </View>
          {!!status && (
            <View style={[styles.statusPill, getStatusPillStyle(status)]}>
              <Text style={[
                styles.statusText,
                (status.includes('COURS') || status.includes('NOW')) && { color: 'rgb(1,111,115)' }
              ]}>{status}</Text>
            </View>
          )}
        </View>

      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.contentSection}>
          <View style={styles.headerRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {event.commerces?.name || t('event')}
            </Text>
            {event.commerces?.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>
                  {i18n.language === 'fr' ? event.commerces.category.name_fr : event.commerces.category.name_en}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>

          <LinkableText style={styles.description} linkColor={COLORS.teal} numberOfLines={2}>
            {event.description}
          </LinkableText>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onPress}
            disabled={isEnded}
            style={[styles.primaryBtn, isEnded && styles.primaryBtnDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{isEnded ? t('ended') : t('view_event')}</Text>
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
                    size={20}
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

export const EventCard = memo(EventCardComponent);
EventCard.displayName = 'EventCard';

function getStatusPillStyle(status: string) {
  // Status values are now translated, so we check against common patterns
  if (status.includes('COURS') || status.includes('NOW')) {
    return { backgroundColor: 'rgba(178,253,157,0.95)' };
  }
  if (status.includes('AUJOURD') || status.includes('TODAY')) {
    return { backgroundColor: 'rgba(255,98,51,0.95)' };
  }
  if (status.includes('DEMAIN') || status.includes('TOMORROW')) {
    return { backgroundColor: 'rgba(1,97,103,0.9)' };
  }
  if (status.includes('TERMIN') || status.includes('ENDED')) {
    return { backgroundColor: 'rgba(17,24,39,0.7)' };
  }
  return { backgroundColor: 'rgba(17,24,39,0.7)' };
}

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
    // Modern subtle shadow
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

  // boost
  boostChip: {
    position: 'absolute',
    zIndex: 3,
    top: SPACING.lg,
    left: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RAD.pill,
    gap: 4,
  },
  boostText: { fontSize: 10, fontWeight: '700', color: '#FFD700' },

  // media
  media: {
    position: 'relative',
    aspectRatio: 4 / 5,
    backgroundColor: COLORS.bgMuted
  },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5CF6' },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  // bar
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.overlay,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLeft: { flexDirection: 'row', alignItems: 'center' },
  barText: { marginLeft: 6, color: COLORS.white, fontSize: 12, fontWeight: '600' },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RAD.pill,
  },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },


  // body
  body: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
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

  eventTitle: {
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
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryBtnDisabled: { backgroundColor: COLORS.bgMuted },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

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
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkDim,
  },
});
