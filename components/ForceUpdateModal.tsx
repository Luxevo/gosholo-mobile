import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
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
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={64} color={AppColors.teal} />
          </View>

          <Text style={styles.title}>{t('force_update_title', 'Update Required')}</Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>
              {t('force_update_button', 'Discover New Features')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {t('force_update_footer', 'Thank you for using GoSholo!')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: AppColors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.teal,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.white,
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: AppColors.darkGray,
    textAlign: 'center',
  },
});
