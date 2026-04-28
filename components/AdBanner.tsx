import { Ad } from '@/hooks/useAd';
import * as Linking from 'expo-linking';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AdBannerProps {
  ad: Ad;
}

export function AdBanner({ ad }: AdBannerProps) {
  const handlePress = () => {
    if (ad.link_url) Linking.openURL(ad.link_url);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handlePress} activeOpacity={ad.link_url ? 0.8 : 1}>
        <Image
          source={{ uri: ad.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  image: {
    width: 320,
    height: 100,
    borderRadius: 8,
  },
});
