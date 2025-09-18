import { Commerce } from '@/hooks/useCommerces';
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
  success: '#B2FD9D',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

interface BusinessDetailModalProps {
  visible: boolean;
  business: Commerce | null;
  onClose: () => void;
}

export default function BusinessDetailModal({
  visible,
  business,
  onClose
}: BusinessDetailModalProps) {
  if (!business) return null;

  const handleCall = () => {
    if (business.phone) {
      Linking.openURL(`tel:${business.phone}`);
    }
  };

  const handleEmail = () => {
    if (business.email) {
      Linking.openURL(`mailto:${business.email}`);
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      let url = business.website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      Linking.openURL(url);
    }
  };

  const handleDirections = () => {
    if (business.address) {
      const query = encodeURIComponent(business.address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const handleSocialLink = (url?: string | null) => {
    if (url) {
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`;
      }
      Linking.openURL(validUrl);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      Restaurant: 'restaurant-outline',
      Café: 'cafe-outline',
      Boulangerie: 'storefront-outline',
      Épicerie: 'basket-outline',
      Commerce: 'bag-outline',
      Service: 'construct-outline',
      Santé: 'medical-outline',
      Beauté: 'sparkles-outline',
      Sport: 'fitness-outline',
      Culture: 'library-outline',
      Éducation: 'school-outline',
    };
    return icons[category as keyof typeof icons] || 'business-outline';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Restaurant: '#FF6233',
      Café: '#8B4513',
      Boulangerie: '#DEB887',
      Épicerie: '#32CD32',
      Commerce: '#4169E1',
      Service: '#FF8C00',
      Santé: '#DC143C',
      Beauté: '#FF69B4',
      Sport: '#00CED1',
      Culture: '#9370DB',
      Éducation: '#228B22',
    };
    return colors[category as keyof typeof colors] || COLORS.primary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
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

          {business.phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
            >
              <Ionicons name="call" size={20} color={COLORS.white} />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.businessHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(business.category) }]}>
              <Ionicons
                name={getCategoryIcon(business.category) as any}
                size={14}
                color={COLORS.white}
              />
              <Text style={styles.categoryText}>{business.category}</Text>
            </View>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.address && (
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.addressText}>{business.address}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {business.description && (
            <Text style={styles.description} numberOfLines={2}>{business.description}</Text>
          )}

          {/* Quick Actions */}
          <View style={styles.actionButtons}>
            {business.address && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
                <Ionicons name="navigate-outline" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
            )}
            {business.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {business.website && (
              <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
                <Ionicons name="globe-outline" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contact Info - Compact */}
          <View style={styles.contactInfo}>
            {business.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <Ionicons name="call-outline" size={16} color={COLORS.teal} />
                <Text style={styles.contactText}>{business.phone}</Text>
              </TouchableOpacity>
            )}
            {business.email && (
              <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={16} color={COLORS.teal} />
                <Text style={styles.contactText} numberOfLines={1}>{business.email}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Social Links - Compact */}
          {(business.facebook_url || business.instagram_url || business.linkedin_url) && (
            <View style={styles.socialButtons}>
              {business.facebook_url && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialLink(business.facebook_url)}
                >
                  <Ionicons name="logo-facebook" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
              {business.instagram_url && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.instagramButton]}
                  onPress={() => handleSocialLink(business.instagram_url)}
                >
                  <Ionicons name="logo-instagram" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
              {business.linkedin_url && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.linkedinButton]}
                  onPress={() => handleSocialLink(business.linkedin_url)}
                >
                  <Ionicons name="logo-linkedin" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    gap: SPACING.xs,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    padding: SPACING.md,
  },
  businessHeader: {
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: SPACING.xs,
  },
  description: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  contactInfo: {
    marginBottom: SPACING.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  contactText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: SPACING.xs,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
});