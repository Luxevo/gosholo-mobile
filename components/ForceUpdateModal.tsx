import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ForceUpdateModalProps {
  visible: boolean;
  message: string;
  storeUrl: string;
}

export default function ForceUpdateModal({
  visible,
  message,
  storeUrl,
}: ForceUpdateModalProps) {
  const { t } = useTranslation();

  const handleUpdate = () => {
    Linking.openURL(storeUrl);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Teal header with logo */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Content */}
          <View style={styles.body}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="arrow-up-circle" size={16} color={AppColors.white} />
                <Text style={styles.badgeText}>{t('force_update_title', 'Update Required')}</Text>
              </View>
            </View>

            <Text style={styles.message}>{message}</Text>

            <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={20} color={AppColors.white} />
              <Text style={styles.buttonText}>
                {t('force_update_button', 'Discover New Features')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              {t('force_update_footer', 'Thank you for using GoSholo!')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#016167',
    paddingVertical: 28,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 50,
  },
  body: {
    padding: 28,
    alignItems: 'center',
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#016167',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
  },
  footer: {
    marginTop: 18,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
