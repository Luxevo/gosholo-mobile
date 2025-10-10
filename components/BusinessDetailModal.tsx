import { Commerce } from '@/hooks/useCommerces';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Pressable, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
}

export default function BusinessDetailModal({
  visible,
  business,
  onClose,
}: BusinessDetailModalProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  
  console.log('📱 Modal rendering:', { visible, hasBusiness: !!business, name: business?.name });
  
  if (!business) {
    console.log('❌ Modal: No business provided');
    return null;
  }
  
  console.log('✅ Modal: Rendering with business:', business.name);

  const openUrl = (url?: string | null) => {
    if (!url) return;
    const prefixed = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(prefixed);
  };

  const handleCall = () => business.phone && Linking.openURL(`tel:${business.phone}`);
  const handleEmail = () => business.email && Linking.openURL(`mailto:${business.email}`);
  const handleWebsite = () => business.website && openUrl(business.website);
  const handleDirections = () =>
    business.address && openUrl(`https://maps.google.com/?q=${encodeURIComponent(business.address)}`);

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
          <View style={styles.content}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {categoryEmojis[business.category] || '🏪'} {business.category}
              </Text>
            </View>

            <Text style={[styles.name, { color: theme.ink }]}>{business.name}</Text>

            {business.address && (
              <View style={styles.addressCard}>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={16} color={theme.teal} />
                  <Text style={[styles.address, { color: theme.ink }]}>{business.address}</Text>
                </View>
              </View>
            )}

            {business.description && (
              <Text style={[styles.description, { color: theme.inkLight }]} numberOfLines={4}>
                {business.description}
              </Text>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              {business.address && (
                <Pressable style={[styles.actionBtn, styles.directionsBtn]} onPress={handleDirections}>
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
          </View>
        </SafeAreaView>
      </View>
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
    paddingBottom: SPACING.xl,
    maxHeight: '70%',
    borderTopWidth: 3,
    borderTopColor: COLORS.light.primary,
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
    backgroundColor: COLORS.light.success,
  },
  websiteBtn: {
    backgroundColor: COLORS.light.primary,
  },
  emailBtn: {
    backgroundColor: COLORS.light.teal,
  },
});
