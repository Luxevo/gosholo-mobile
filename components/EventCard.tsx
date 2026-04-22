import { IconSymbol } from '@/components/ui/IconSymbol';
import type { EventWithCommerce } from '@/hooks/useEvents';
import { supabase } from '@/lib/supabase';
import { getShareMessage, openShareSheet } from '@/utils/deepLinks';
import React, { memo, useMemo } from 'react';
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
        description: event.description ?? undefined,
      });
      const shared = await openShareSheet({
        message: shareData.message,
        title: shareData.title,
        url: shareData.url,
      });
      if (shared) {
        await supabase.rpc('increment_event_share', { event_id: event.id });
      }
    } catch (error) {
      console.error(error);
    }
  };

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

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isEnded && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={isEnded}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatDateRange()}`}
    >
      {/* Media */}
      <View style={styles.media}>
        {event.image_url ? (
          <ImageBackground source={{ uri: event.image_url }} style={styles.mediaBg} imageStyle={styles.mediaImg} />
        ) : (
          <View style={[styles.mediaBg, styles.mediaPlaceholder]}>
            <IconSymbol name="calendar" size={28} color={COLORS.white} />
          </View>
        )}

        {/* Gradient fade + date/status */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.mediaGradient}
        >
          <View style={styles.dateRow}>
            <View style={styles.dateLabel}>
              <IconSymbol name="calendar" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.dateText}>{formatDateRange()}</Text>
            </View>
            {!!status && (
              <View style={[styles.statusPill, getStatusPillStyle(status)]}>
                <Text style={[
                  styles.statusText,
                  (status.includes('COURS') || status.includes('NOW')) && { color: COLORS.teal }
                ]}>{status}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.businessRow}>
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

        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <LinkableText style={styles.description} linkColor={COLORS.teal} numberOfLines={2}>
          {event.description}
        </LinkableText>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onPress}
            disabled={isEnded}
            style={[styles.primaryBtn, isEnded && styles.primaryBtnDisabled]}
          >
            <Text style={styles.primaryText}>{isEnded ? t('ended') : t('view_event')}</Text>
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

export const EventCard = memo(EventCardComponent);
EventCard.displayName = 'EventCard';

function getStatusPillStyle(status: string) {
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
  cardDisabled: { opacity: 0.6 },

  // Media
  media: {
    position: 'relative',
    aspectRatio: 4 / 4.5,
    backgroundColor: COLORS.bgMuted,
    overflow: 'hidden',
  },
  mediaBg: { flex: 1 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5CF6' },

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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAD.pill,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
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

  eventTitle: {
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
  primaryBtnDisabled: { backgroundColor: COLORS.bgMuted },
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
