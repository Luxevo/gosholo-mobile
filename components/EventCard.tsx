import { IconSymbol } from '@/components/ui/IconSymbol';
import type { EventWithCommerce } from '@/hooks/useEvents';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  inkDim: '#4B5563',
  bg: '#FFFFFF',
  bgMuted: '#F6F7F9',
  line: 'rgba(0,0,0,0.08)',
  teal: '#016167',
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
}

const EventCardComponent: React.FC<EventCardProps> = ({ event, onPress, onFavoritePress }) => {
  const { t } = useTranslation();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title}${event.commerces?.name ? `\n${event.commerces.name}` : ''}${event.description ? `\n${event.description}` : ''}`,
        title: event.title,
      });
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
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}
        </View>

        {/* Favorite */}
        {!!onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            style={styles.favBtn}
            accessibilityRole="button"
            accessibilityLabel={t('save_to_favorites')}
          >
            <IconSymbol name="heart" size={16} color={COLORS.ink} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.businessName} numberOfLines={1}>
            {event.commerces?.name || t('event')}
          </Text>
          {event.commerces?.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{event.commerces.category}</Text>
            </View>
          )}
        </View>

        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

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

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} accessibilityRole="button">
            <Text style={styles.secondaryText}>{followOrShare}</Text>
          </TouchableOpacity>
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
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.line,
    // softer, platform-friendly shadow
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

  // boost
  boostChip: {
    position: 'absolute',
    zIndex: 3,
    top: SPACING.sm,
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
  media: { position: 'relative', height: 220, backgroundColor: COLORS.bgMuted },
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

  // favorite
  favBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36, height: 36,
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

  // body
  body: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg, gap: SPACING.sm },

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

  actions: { flexDirection: 'row', gap: SPACING.sm },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.lg,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
  },
  primaryBtnDisabled: { backgroundColor: COLORS.bgMuted },
  primaryText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  secondaryBtn: {
    backgroundColor: COLORS.bgMuted,
    borderRadius: RAD.pill,
    paddingHorizontal: SPACING.lg,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
