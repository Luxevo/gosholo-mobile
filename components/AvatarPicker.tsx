import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  border: '#E5E5E5',
  ink: '#111827',
};

// Avatar options with their require statements
export const AVATARS = [
  { id: 'cat', source: require('@/assets/avatars/cat.png') },
  { id: 'panda', source: require('@/assets/avatars/panda.png') },
  { id: 'bear', source: require('@/assets/avatars/bear.png') },
  { id: 'chicken', source: require('@/assets/avatars/chicken.png') },
  { id: 'meerkat', source: require('@/assets/avatars/meerkat.png') },
] as const;

export type AvatarId = typeof AVATARS[number]['id'];

// Helper to get avatar source by ID
export const getAvatarSource = (id: AvatarId | string | null) => {
  const avatar = AVATARS.find(a => a.id === id);
  return avatar?.source || AVATARS[0].source;
};

interface AvatarPickerProps {
  selectedAvatar: AvatarId | null;
  onSelect: (avatarId: AvatarId) => void;
}

export function AvatarPicker({ selectedAvatar, onSelect }: AvatarPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('choose_avatar')}</Text>
      <View style={styles.avatarsRow}>
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarContainer,
              selectedAvatar === avatar.id && styles.avatarSelected,
            ]}
            onPress={() => onSelect(avatar.id)}
            activeOpacity={0.7}
          >
            <Image source={avatar.source} style={styles.avatarImage} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Smaller avatar display component for profile/header
interface AvatarDisplayProps {
  avatarId: AvatarId | string | null | undefined;
  size?: number;
  showBorder?: boolean;
}

export function AvatarDisplay({ avatarId, size = 40, showBorder = true }: AvatarDisplayProps) {
  const borderWidth = showBorder && size > 30 ? 2 : 0;
  const imageSize = size - borderWidth * 2;

  return (
    <View style={[
      styles.displayContainer,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: borderWidth,
      }
    ]}>
      <Image
        source={getAvatarSource(avatarId)}
        style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 12,
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  displayContainer: {
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
});
