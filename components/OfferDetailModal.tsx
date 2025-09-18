import { Offer } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

interface OfferDetailModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
  onFavoritePress?: () => void;
}

export default function OfferDetailModal({
  visible,
  offer,
  onClose,
  onFavoritePress
}: OfferDetailModalProps) {
  if (!offer) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getOfferTypeText = (type: string) => {
    switch (type) {
      case 'in_store': return 'In-Store Only';
      case 'online': return 'Online Only';
      case 'both': return 'In-Store & Online';
      default: return type;
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
          {/* Offer Image */}
          {offer.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: offer.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Boost Badge */}
            {offer.boosted && (
              <View style={styles.boostBadge}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.boostText}>Featured</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.title}>{offer.title}</Text>

            {/* Business Info */}
            {offer.commerces && (
              <View style={styles.businessSection}>
                <View style={styles.businessHeader}>
                  <Ionicons name="storefront-outline" size={20} color={COLORS.teal} />
                  <Text style={styles.businessName}>{offer.commerces.name}</Text>
                </View>
                {offer.commerces.address && (
                  <Text style={styles.businessAddress}>{offer.commerces.address}</Text>
                )}
              </View>
            )}

            {/* Offer Type */}
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={18} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{getOfferTypeText(offer.offer_type)}</Text>
            </View>

            {/* Location */}
            {(offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location) && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>
                  {offer.uses_commerce_location ? offer.commerces?.address : offer.custom_location}
                </Text>
              </View>
            )}

            {/* Dates */}
            {(offer.start_date || offer.end_date) && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>
                  {offer.start_date && offer.end_date
                    ? `${formatDate(offer.start_date)} - ${formatDate(offer.end_date)}`
                    : offer.start_date
                    ? `From ${formatDate(offer.start_date)}`
                    : `Until ${formatDate(offer.end_date)}`
                  }
                </Text>
              </View>
            )}

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this offer</Text>
              <Text style={styles.description}>{offer.description}</Text>
            </View>

            {/* Conditions */}
            {offer.condition && (
              <View style={styles.conditionsSection}>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                <Text style={styles.conditions}>{offer.condition}</Text>
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