import { Event } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  teal: '#016167',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
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
  if (!event) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavoritePress}
          >
            <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Image */}
          {event.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: event.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Boost Badge */}
            {event.boosted && (
              <View style={styles.boostBadge}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.boostText}>Featured</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Business Info */}
            {event.commerces && (
              <View style={styles.businessSection}>
                <View style={styles.businessHeader}>
                  <Ionicons name="business-outline" size={20} color={COLORS.teal} />
                  <Text style={styles.businessName}>{event.commerces.name}</Text>
                </View>
                {event.commerces.address && (
                  <Text style={styles.businessAddress}>{event.commerces.address}</Text>
                )}
              </View>
            )}

            {/* Location */}
            {(event.uses_commerce_location ? event.commerces?.address : event.custom_location) && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>
                  {event.uses_commerce_location ? event.commerces?.address : event.custom_location}
                </Text>
              </View>
            )}

            {/* Dates */}
            {(event.start_date || event.end_date) && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>
                  {event.start_date && event.end_date
                    ? `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`
                    : event.start_date
                    ? `From ${formatDate(event.start_date)}`
                    : `Until ${formatDate(event.end_date)}`
                  }
                </Text>
              </View>
            )}

            {/* Social Media Links */}
            {(event.facebook_url || event.instagram_url || event.linkedin_url) && (
              <View style={styles.socialSection}>
                <Text style={styles.sectionTitle}>Follow this event</Text>
                <View style={styles.socialButtons}>
                  {event.facebook_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.facebookButton]}
                      onPress={() => handleSocialLink(event.facebook_url)}
                    >
                      <Ionicons name="logo-facebook" size={20} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                  {event.instagram_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.instagramButton]}
                      onPress={() => handleSocialLink(event.instagram_url)}
                    >
                      <Ionicons name="logo-instagram" size={20} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {event.linkedin_url && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.linkedinButton]}
                      onPress={() => handleSocialLink(event.linkedin_url)}
                    >
                      <Ionicons name="logo-linkedin" size={20} color={COLORS.white} />
                      <Text style={styles.socialButtonText}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

            {/* Conditions */}
            {event.condition && (
              <View style={styles.conditionsSection}>
                <Text style={styles.sectionTitle}>Event Details</Text>
                <Text style={styles.conditions}>{event.condition}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  imageContainer: {
    height: 200,
    backgroundColor: COLORS.gray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.xl,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  boostText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.ink,
    marginBottom: SPACING.lg,
    lineHeight: 32,
  },
  businessSection: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.teal,
    marginLeft: SPACING.sm,
  },
  businessAddress: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  socialSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 24,
    gap: SPACING.sm,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  descriptionSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  conditionsSection: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
  },
  conditions: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});