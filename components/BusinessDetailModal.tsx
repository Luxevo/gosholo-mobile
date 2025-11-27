import { useCommerceHours } from '@/hooks/useCommerceHours';
import { Commerce } from '@/hooks/useCommerces';
import { useEvents } from '@/hooks/useEvents';
import { useOffers } from '@/hooks/useOffers';
import type { Event, Offer } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventDetailModal from './EventDetailModal';
import { LinkableText } from './LinkableText';
import OfferDetailModal from './OfferDetailModal';
import OpeningHours from './OpeningHours';

const COLORS = {
  light: {
    primary: '#FF6233',
    ink: '#111827',
    inkLight: '#6B7280',
    white: '#FFFFFF',
    gray: '#E5E7EB',
    bg: '#FFFFFF',
    overlay: 'rgba(17,24,39,0.6)',
    teal: '#016167',
    success: '#B2FD9D',
    lightBlue: '#5BC4DB',
  },
  dark: {
    primary: '#FF6233',
    ink: '#F9FAFB',
    inkLight: '#9CA3AF',
    white: '#1F2937',
    gray: '#374151',
    bg: '#111827',
    overlay: 'rgba(0,0,0,0.7)',
    teal: '#016167',
    success: '#B2FD9D',
    lightBlue: '#5BC4DB',
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

interface BusinessDetailModalProps {
  visible: boolean;
  business: Commerce | null;
  onClose: () => void;
  onGetDirections?: (business: Commerce) => void;
  onNavigateToMap?: (address: string, coordinates?: [number, number]) => void;
}

export default function BusinessDetailModal({
  visible,
  business,
  onClose,
  onGetDirections,
  onNavigateToMap,
}: BusinessDetailModalProps) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  // Fetch offers and events
  const { offers } = useOffers();
  const { events } = useEvents();

  // Fetch commerce hours
  const { regularHours, specialHours, loading: hoursLoading, isOpenNow, todayHours } = useCommerceHours(business?.id || null);

  // State for offer/event detail modals
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Filter active offers and events for this commerce
  const commerceOffers = useMemo(() => {
    if (!business) return [];
    return offers.filter(offer => offer.commerce_id === business.id);
  }, [offers, business]);

  const commerceEvents = useMemo(() => {
    if (!business) return [];
    return events.filter(event => event.commerce_id === business.id);
  }, [events, business]);

  if (!business) {
    return null;
  }

  const openUrl = (url?: string | null) => {
    if (!url) return;
    const prefixed = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(prefixed);
  };

  const handleCall = () => business.phone && Linking.openURL(`tel:${business.phone}`);

  const handleAddressPress = () => {
    if (!onNavigateToMap || !business.address) return;
    
    const coordinates: [number, number] | undefined = 
      business.longitude && business.latitude 
        ? [business.longitude, business.latitude] 
        : undefined;
    
    onNavigateToMap(business.address, coordinates);
  };
  const handleEmail = () => business.email && Linking.openURL(`mailto:${business.email}`);
  const handleWebsite = () => business.website && openUrl(business.website);
  const handleFacebook = () => business.facebook_url && openUrl(business.facebook_url);
  const handleInstagram = () => business.instagram_url && openUrl(business.instagram_url);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${business.name}${business.address ? `\n${business.address}` : ''}${business.website ? `\n${business.website}` : ''}`,
        title: business.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const categoryEmojis: Record<string, string> = {
    Restaurant: '🍽️',
    Café: '☕',
    Boulangerie: '🥖',
    Épicerie: '🛒',
    Service: '🔧',
    Beauté: '💄',
    Autre: '🏢',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.gray }]}>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.gray }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.gray }]} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={theme.ink} />
              </TouchableOpacity>
              {business.phone && (
                <TouchableOpacity style={[styles.callButton, { backgroundColor: theme.primary }]} onPress={handleCall}>
                  <Ionicons name="call" size={18} color={theme.white} />
                  <Text style={styles.callText}>{t('call')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.topSection}>
                {/* Business Logo/Image */}
                {business.image_url && (
                  <View style={styles.logoPastille}>
                    <Image
                      source={{ uri: business.image_url }}
                      style={styles.businessLogo}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.topInfo}>
                  <Text style={[styles.name, { color: theme.ink }]}>{business.name}</Text>
                  
                  {/* Category and Subcategory */}
                  {business.category && (
                    <View style={styles.categoryRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: theme.gray }]}>
                        <Text style={[styles.categoryText, { color: theme.ink }]}>
                          {i18n.language === 'fr' ? business.category.name_fr : business.category.name_en}
                        </Text>
                      </View>
                      {business.sub_category && (business.category.name_en?.toLowerCase().trim() === 'restaurant' || business.category.name_fr?.toLowerCase().trim() === 'restaurant') && (
                        <View style={[styles.categoryBadge, styles.subcategoryBadge, { backgroundColor: theme.teal }]}>
                          <Text style={[styles.categoryText, { color: COLORS.light.white }]}>
                            {i18n.language === 'fr' ? business.sub_category.name_fr : business.sub_category.name_en}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {business.address && (
                <TouchableOpacity
                  style={styles.addressCard}
                  onPress={handleAddressPress}
                  activeOpacity={onNavigateToMap ? 0.7 : 1}
                  disabled={!onNavigateToMap}
                >
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={16} color={theme.teal} />
                    <Text style={[styles.address, { color: theme.ink }]}>{business.address}</Text>
                    {onNavigateToMap && (
                      <Ionicons name="chevron-forward" size={16} color={theme.inkLight} style={styles.addressChevron} />
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {business.description && (
                <LinkableText style={[styles.description, { color: theme.inkLight }]} linkColor={theme.teal}>
                  {business.description}
                </LinkableText>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                {business.latitude && business.longitude && onGetDirections && (
                  <Pressable style={[styles.actionBtn, styles.directionsBtn]} onPress={() => onGetDirections(business)}>
                    <Ionicons name="navigate-outline" size={16} color={COLORS.light.white} />
                    <Text style={styles.actionText}>{t('directions')}</Text>
                  </Pressable>
                )}
                {business.website && (
                  <Pressable style={[styles.actionBtn, styles.websiteBtn]} onPress={handleWebsite}>
                    <Ionicons name="globe-outline" size={16} color={COLORS.light.white} />
                    <Text style={styles.actionText}>{t('website')}</Text>
                  </Pressable>
                )}
                {business.email && (
                  <Pressable style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
                    <Ionicons name="mail-outline" size={16} color={COLORS.light.white} />
                    <Text style={styles.actionText}>{t('email')}</Text>
                  </Pressable>
                )}
              </View>

              {/* Social Media buttons */}
              {(business.facebook_url || business.instagram_url) && (
                <View style={styles.socialActions}>
                  {business.facebook_url && (
                    <Pressable style={styles.socialBtn} onPress={handleFacebook}>
                      <Ionicons name="logo-facebook" size={26} color={theme.teal} />
                    </Pressable>
                  )}
                  {business.instagram_url && (
                    <Pressable style={styles.socialBtn} onPress={handleInstagram}>
                      <Ionicons name="logo-instagram" size={26} color={theme.teal} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Opening Hours Section */}
              <OpeningHours
                regularHours={regularHours}
                specialHours={specialHours}
                isOpenNow={isOpenNow}
                todayHours={todayHours}
                loading={hoursLoading}
              />

              {/* Active Offers Section */}
              {commerceOffers.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="pricetag" size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                      {t('special_offers')} ({commerceOffers.length})
                    </Text>
                  </View>
                  {commerceOffers.map((offer) => (
                    <TouchableOpacity
                      key={offer.id}
                      style={[styles.offerCard, { backgroundColor: theme.gray }]}
                      onPress={() => {
                        setSelectedOffer(offer);
                        setOfferModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.offerHeader}>
                        <Text style={[styles.offerTitle, { color: theme.ink }]} numberOfLines={2}>
                          {offer.title}
                        </Text>
                        {offer.boosted && (
                          <View style={styles.boostedBadge}>
                            <Ionicons name="star" size={10} color={COLORS.light.white} />
                          </View>
                        )}
                      </View>
                      {offer.description && (
                        <LinkableText style={[styles.offerDescription, { color: theme.inkLight }]} linkColor={theme.teal} numberOfLines={2}>
                          {offer.description}
                        </LinkableText>
                      )}
                      {offer.end_date && (
                        <View style={styles.offerFooter}>
                          <Ionicons name="time-outline" size={12} color={theme.inkLight} />
                          <Text style={[styles.offerDate, { color: theme.inkLight }]}>
                            {t('valid_until')}: {new Date(offer.end_date).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.cardChevron, { backgroundColor: theme.primary }]}>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.light.white} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Active Events Section */}
              {commerceEvents.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={20} color={theme.teal} />
                    <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                      {t('exciting_events')} ({commerceEvents.length})
                    </Text>
                  </View>
                  {commerceEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.eventCard, { backgroundColor: theme.gray }]}
                      onPress={() => {
                        setSelectedEvent(event);
                        setEventModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.eventHeader}>
                        <Text style={[styles.eventTitle, { color: theme.ink }]} numberOfLines={2}>
                          {event.title}
                        </Text>
                        {event.boosted && (
                          <View style={styles.boostedBadge}>
                            <Ionicons name="star" size={10} color={COLORS.light.white} />
                          </View>
                        )}
                      </View>
                      {event.description && (
                        <LinkableText style={[styles.eventDescription, { color: theme.inkLight }]} linkColor={theme.teal} numberOfLines={2}>
                          {event.description}
                        </LinkableText>
                      )}
                      <View style={styles.eventFooter}>
                        <Ionicons name="calendar-outline" size={12} color={theme.inkLight} />
                        <Text style={[styles.eventDate, { color: theme.inkLight }]}>
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Date TBA'}
                          {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                        </Text>
                      </View>
                      <View style={[styles.cardChevron, { backgroundColor: theme.primary }]}>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.light.white} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Empty state when no offers or events */}
              {commerceOffers.length === 0 && commerceEvents.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="information-circle-outline" size={40} color={theme.inkLight} />
                  <Text style={[styles.emptyText, { color: theme.inkLight }]}>
                    {t('no_offers_title')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Offer Detail Modal */}
      <OfferDetailModal
        visible={offerModalVisible}
        offer={selectedOffer}
        onClose={() => {
          setOfferModalVisible(false);
          setSelectedOffer(null);
        }}
        onNavigateToMap={onNavigateToMap}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        visible={eventModalVisible}
        event={selectedEvent}
        onClose={() => {
          setEventModalVisible(false);
          setSelectedEvent(null);
        }}
        onNavigateToMap={onNavigateToMap}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderTopWidth: 3,
    borderTopColor: COLORS.light.primary,
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  logoPastille: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.light.gray,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.light.primary,
  },
  businessLogo: {
    width: '100%',
    height: '100%',
  },
  topInfo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  callText: {
    color: COLORS.light.white,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(91, 196, 219, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(91, 196, 219, 0.3)',
  },
  badgeText: {
    color: COLORS.light.lightBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subcategoryBadge: {
    opacity: 0.9,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: 'rgba(178, 253, 157, 0.12)',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(178, 253, 157, 0.35)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  address: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  addressChevron: {
    marginLeft: SPACING.xs,
  },
  description: {
    fontSize: 13,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  actionText: {
    color: COLORS.light.white,
    fontSize: 12,
    fontWeight: '600',
  },
  directionsBtn: {
    backgroundColor: COLORS.light.teal,
  },
  websiteBtn: {
    backgroundColor: COLORS.light.primary,
  },
  emailBtn: {
    backgroundColor: COLORS.light.teal,
  },
  socialActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  offerCard: {
    padding: SPACING.md,
    paddingRight: SPACING.xl * 2.5,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light.primary,
    borderLeftWidth: 4,
    position: 'relative',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  offerDescription: {
    fontSize: 12,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  offerDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  eventCard: {
    padding: SPACING.md,
    paddingRight: SPACING.xl * 2.5,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light.teal,
    borderLeftWidth: 4,
    position: 'relative',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  eventDescription: {
    fontSize: 12,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  eventDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  boostedBadge: {
    backgroundColor: COLORS.light.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  cardChevron: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
