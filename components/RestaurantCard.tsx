import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  green: '#B2FD9D',
  blue: '#5BC4DB',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

interface Badge {
  text: string;
  type: 'discount' | 'delivery' | 'price';
}

interface RestaurantCardProps {
  name: string;
  cuisine: string;
  deliveryInfo: string;
  rating: number;
  reviewCount: number;
  badges?: Badge[];
  type?: 'default' | 'offers' | 'events';
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export function RestaurantCard({
  name,
  cuisine,
  deliveryInfo,
  rating,
  reviewCount,
  badges = [],
  type = 'default',
  onPress,
  onFavoritePress,
  isFavorite = false,
}: RestaurantCardProps) {
  const getBadgeStyle = (badgeType: Badge['type']) => {
    switch (badgeType) {
      case 'discount':
        return { backgroundColor: COLORS.green, color: COLORS.black };
      case 'delivery':
        return { backgroundColor: COLORS.blue, color: COLORS.white };
      case 'price':
        return { backgroundColor: COLORS.teal, color: COLORS.white };
      default:
        return { backgroundColor: COLORS.gray, color: COLORS.black };
    }
  };

  const getCardContentColor = () => {
    switch (type) {
      case 'offers':
        return COLORS.primary;
      case 'events':
        return COLORS.blue;
      default:
        return COLORS.teal;
    }
  };

  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress}>
      <View style={styles.cardImageContainer}>
        <View style={styles.cardImage} />
        <View style={styles.ratingBadge}>
          <IconSymbol name="star.fill" size={12} color={COLORS.green} />
          <Text style={styles.ratingText}>
            {rating} ({reviewCount}+)
          </Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
          <IconSymbol 
            name={isFavorite ? "heart.fill" : "heart"} 
            size={20} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.cardContent, { backgroundColor: getCardContentColor() }]}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{name}</Text>
          <Text style={styles.restaurantCuisine}>{cuisine}</Text>
          <Text style={styles.deliveryInfo}>{deliveryInfo}</Text>
        </View>
        {badges.length > 0 && (
          <View style={styles.cardFooter}>
            {badges.map((badge, index) => {
              const badgeStyle = getBadgeStyle(badge.type);
              return (
                <View
                  key={index}
                  style={[
                    styles.badge,
                    { backgroundColor: badgeStyle.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: badgeStyle.color },
                    ]}
                  >
                    {badge.text}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  restaurantCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  restaurantInfo: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.white,
  },
  restaurantCuisine: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.white,
  },
  deliveryInfo: {
    fontSize: 12,
    color: COLORS.white,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});