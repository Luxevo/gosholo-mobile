import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  lightGray: '#9CA3AF',
  green: '#B2FD9D',
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


interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ visible, onClose }: WelcomeModalProps) {
  const { t } = useTranslation();

  const handleGetStarted = () => {
    onClose(); // Close modal and stay on current tab
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header with Close Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/darker-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              {t('discover_local')}
            </Text>
          </View>



          {/* Benefits Section */}
          <View style={styles.benefitsSection}>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{t('location_discovery')}</Text>
                <Text style={styles.benefitDescription}>
                  {t('location_discovery_desc')}
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="pricetag" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{t('exclusive_deals')}</Text>
                <Text style={styles.benefitDescription}>
                  {t('exclusive_deals_desc')}
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{t('local_events')}</Text>
                <Text style={styles.benefitDescription}>
                  {t('local_events_desc')}
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.finalCtaSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>{t('start_exploring')}</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: '500',
  },
  logoSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 280,
    height: 90,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  heroSection: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xxl * 2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: SPACING.lg,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: 30,
    gap: SPACING.sm,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  featuresSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl * 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  cardsContainer: {
    gap: SPACING.lg,
  },
  benefitsSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl * 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray,
    borderRadius: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  benefitDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  finalCtaSection: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  finalCtaSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl * 2,
    paddingVertical: SPACING.lg,
    borderRadius: 30,
    marginBottom: SPACING.lg,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});