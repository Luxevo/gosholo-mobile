import { IconSymbol } from '@/components/ui/IconSymbol';
import { Event } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BusinessDetailModal from './BusinessDetailModal';

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
  teal: 'rgb(1,111,115)',
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

interface EventDetailModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onFavoritePress?: () => void;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onFavoritePress
}: EventDetailModalProps) {
  const { t } = useTranslation();
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  if (!event) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventStatus = () => {
    if (!event.start_date) return null;
    const now = new Date();
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : start;

    if (now > end) return { text: t('ended'), color: COLORS.inkLight };
    if (now >= start && now <= end) return { text: t('happening_now'), color: COLORS.teal };

    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) return { text: t('today_caps'), color: COLORS.primary };
    if (daysUntil === 1) return { text: t('tomorrow_caps'), color: COLORS.primary };
    if (daysUntil <= 7) return { text: t('in_days', { days: daysUntil }), color: COLORS.teal };

    return null;
  };

  const handleSocialLink = (url?: string) => {
    if (url) {
      Linking.openURL(url);
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
          bounces={true}
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            {event.image_url ? (
              <>
                <Image
                  source={{ uri: event.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroGradient} />
              </>
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <IconSymbol name="calendar" size={64} color={COLORS.white} />
              </View>
            )}

            {/* Floating header buttons */}
            <SafeAreaView edges={['top']} style={styles.floatingHeader}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={onFavoritePress} activeOpacity={0.7}>
                <IconSymbol name="heart" size={20} color={COLORS.teal} />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Boost badge on image */}
            {event.boosted && (
              <View style={styles.heroBoostBadge}>
                <IconSymbol name="star.fill" size={12} color={COLORS.success} />
                <Text style={styles.heroBoostText}>
                  {event.boost_type === 'en_vedette' ? t('featured') : t('promoted')}
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
              <TouchableOpacity
                style={styles.businessInfo}
                onPress={() => setBusinessModalVisible(true)}
                activeOpacity={0.7}
              >
                <IconSymbol name="building.2.fill" size={16} color={COLORS.teal} />
                <Text style={styles.businessName} numberOfLines={1}>
                  {event.commerces?.name || t('event')}
                </Text>
              </TouchableOpacity>
              {event.commerces?.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{event.commerces.category}</Text>
                </View>
              )}
            </View>

            {/* Event Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Description */}
            <Text style={styles.subtitle}>{event.description}</Text>

            {/* Key Info Grid */}
            <View style={styles.infoGrid}>
              {getEventStatus() && (
                <View style={[styles.infoCard, styles.infoCardHighlight]}>
                  <IconSymbol name="clock.fill" size={18} color={getEventStatus()!.color} />
                  <Text style={styles.infoCardLabel}>Status</Text>
                  <Text style={[styles.infoCardValue, { color: getEventStatus()!.color }]}>
                    {getEventStatus()!.text}
                  </Text>
                </View>
              )}

              {(event.start_date || event.end_date) && (
                <View style={styles.infoCard}>
                  <IconSymbol name="calendar" size={18} color={COLORS.primary} />
                  <Text style={styles.infoCardLabel}>{t('date')}</Text>
                  <Text style={styles.infoCardValue}>
                    {event.start_date ? formatDate(event.start_date) : formatDate(event.end_date || '')}
                  </Text>
                </View>
              )}
            </View>

            {/* Location Card */}
            {(event.uses_commerce_location ? event.commerces?.address : event.custom_location) && (
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <IconSymbol name="mappin.circle.fill" size={20} color={COLORS.teal} />
                  <Text style={styles.locationLabel}>{t('location')}</Text>
                </View>
                <Text style={styles.locationText}>
                  {event.uses_commerce_location ? event.commerces?.address : event.custom_location}
                </Text>
              </View>
            )}

            {/* Validity Period */}
            {event.start_date && event.end_date && (
              <View style={styles.validityCard}>
                <View style={styles.validityRow}>
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>{t('starts')}</Text>
                    <Text style={styles.validityValue}>{formatDate(event.start_date)}</Text>
                  </View>
                  <View style={styles.validitySeparator} />
                  <View style={styles.validityItem}>
                    <Text style={styles.validityLabel}>{t('ends')}</Text>
                    <Text style={styles.validityValue}>{formatDate(event.end_date)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Social Media Links */}
            {(event.facebook_url || event.instagram_url || event.linkedin_url) && (
              <View style={styles.socialCard}>
                <View style={styles.socialHeader}>
                  <IconSymbol name="link" size={18} color={COLORS.inkDim} />
                  <Text style={styles.socialLabel}>{t('follow_this_event')}</Text>
                </View>
                <View style={styles.socialButtons}>
                  {event.facebook_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.facebookButton]}
                      onPress={() => handleSocialLink(event.facebook_url)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-facebook" size={18} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                  {event.instagram_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.instagramButton]}
                      onPress={() => handleSocialLink(event.instagram_url)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-instagram" size={18} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {event.linkedin_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.linkedinButton]}
                      onPress={() => handleSocialLink(event.linkedin_url)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-linkedin" size={18} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Conditions */}
            {event.condition && (
              <View style={styles.conditionsCard}>
                <View style={styles.conditionsHeader}>
                  <IconSymbol name="info.circle.fill" size={18} color={COLORS.inkDim} />
                  <Text style={styles.conditionsLabel}>{t('event_details')}</Text>
                </View>
                <Text style={styles.conditionsText}>{event.condition}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Business Detail Modal */}
      <BusinessDetailModal
        visible={businessModalVisible}
        business={event.commerces}
        onClose={() => setBusinessModalVisible(false)}
      />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeText: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.teal,
    lineHeight: 28,
    marginTop: -2,
  },

  heroBoostBadge: {
    position: 'absolute',
    bottom: 35,
    left: SPACING.lg,
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

  // Social Card
  socialCard: {
    backgroundColor: COLORS.bgMuted,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    gap: 6,
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },

  // Conditions Card
  conditionsCard: {
    backgroundColor: 'rgba(91, 196, 219, 0.08)',
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 196, 219, 0.25)',
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