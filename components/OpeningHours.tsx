import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useState } from 'react';
import type { CommerceHours, CommerceSpecialHours } from '@/hooks/useCommerceHours';
import { formatTime, getDayName } from '@/hooks/useCommerceHours';

const COLORS = {
  light: {
    primary: '#FF6233',
    ink: '#111827',
    inkLight: '#6B7280',
    white: '#FFFFFF',
    gray: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    teal: '#016167',
  },
  dark: {
    primary: '#FF6233',
    ink: '#F9FAFB',
    inkLight: '#9CA3AF',
    white: '#1F2937',
    gray: '#374151',
    success: '#10B981',
    error: '#EF4444',
    teal: '#016167',
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
};

interface OpeningHoursProps {
  regularHours: CommerceHours[];
  specialHours?: CommerceSpecialHours[];
  isOpenNow: boolean;
  todayHours: CommerceHours | null;
  loading?: boolean;
}

export default function OpeningHours({
  regularHours,
  specialHours = [],
  isOpenNow,
  todayHours,
  loading = false,
}: OpeningHoursProps) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color={theme.teal} />
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t('opening_hours')}
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: theme.inkLight }]}>
          {t('loading')}...
        </Text>
      </View>
    );
  }

  if (regularHours.length === 0) {
    return null;
  }

  // Get current day
  const now = new Date();
  const jsDay = now.getDay();
  const isoDay = jsDay === 0 ? 6 : jsDay - 1;

  return (
    <View style={styles.section}>
      {/* Header with open/closed status */}
      <View style={styles.headerRow}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color={theme.teal} />
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t('opening_hours')}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isOpenNow ? COLORS.light.success : COLORS.light.error }
        ]}>
          <Text style={styles.statusText}>
            {isOpenNow ? t('open_now') : t('closed')}
          </Text>
        </View>
      </View>

      {/* Today's hours prominently */}
      {todayHours && (
        <View style={[styles.todayCard, { backgroundColor: theme.gray }]}>
          <Text style={[styles.todayLabel, { color: theme.primary }]}>
            {t('today')}
          </Text>
          <View style={styles.todayHoursRow}>
            <Text style={[styles.dayText, { color: theme.ink }]}>
              {getDayName(isoDay, i18n.language)}
            </Text>
            {todayHours.is_closed ? (
              <Text style={[styles.closedText, { color: COLORS.light.error }]}>
                {t('closed')}
              </Text>
            ) : (
              <Text style={[styles.hoursText, { color: theme.ink }]}>
                {formatTime(todayHours.open_time)} - {formatTime(todayHours.close_time)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Expandable full week schedule */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandButtonText, { color: theme.teal }]}>
          {expanded ? t('show_less') : t('show_all_hours')}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.teal}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.weekSchedule, { backgroundColor: theme.gray }]}>
          {regularHours.map((hours) => (
            <View
              key={hours.id}
              style={[
                styles.dayRow,
                hours.day_of_week === isoDay && styles.currentDayRow,
                { borderBottomColor: theme.white }
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: theme.ink },
                  hours.day_of_week === isoDay && styles.currentDayText
                ]}
              >
                {getDayName(hours.day_of_week, i18n.language)}
              </Text>
              {hours.is_closed ? (
                <Text style={[styles.closedText, { color: COLORS.light.error }]}>
                  {t('closed')}
                </Text>
              ) : (
                <Text style={[styles.timeText, { color: theme.inkLight }]}>
                  {formatTime(hours.open_time)} - {formatTime(hours.close_time)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Special hours (holidays, etc.) */}
      {specialHours.length > 0 && expanded && (
        <View style={styles.specialSection}>
          <View style={styles.specialHeader}>
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={[styles.specialTitle, { color: theme.ink }]}>
              {t('special_hours')}
            </Text>
          </View>
          {specialHours.map((special) => (
            <View
              key={special.id}
              style={[styles.specialRow, { backgroundColor: theme.gray }]}
            >
              <View style={styles.specialInfo}>
                <Text style={[styles.specialDate, { color: theme.ink }]}>
                  {new Date(special.date).toLocaleDateString(i18n.language, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                {special.label_fr && special.label_en && (
                  <Text style={[styles.specialLabel, { color: theme.primary }]}>
                    {i18n.language === 'fr' ? special.label_fr : special.label_en}
                  </Text>
                )}
              </View>
              {special.is_closed ? (
                <Text style={[styles.closedText, { color: COLORS.light.error }]}>
                  {t('closed')}
                </Text>
              ) : (
                <Text style={[styles.timeText, { color: theme.inkLight }]}>
                  {formatTime(special.open_time)} - {formatTime(special.close_time)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.light.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  todayCard: {
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.light.teal,
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  todayHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekSchedule: {
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  currentDayRow: {
    backgroundColor: 'rgba(1, 97, 103, 0.05)',
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '500',
  },
  currentDayText: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  specialSection: {
    marginTop: SPACING.md,
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  specialTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  specialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  specialInfo: {
    flex: 1,
  },
  specialDate: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  specialLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
