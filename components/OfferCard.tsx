import { IconSymbol } from '@/components/ui/IconSymbol';
import type { OfferWithCommerce } from '@/hooks/useOffers';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  green: '#B2FD9D', // Exact green from Figma
  blue: '#5BC4DB',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
  textLight: '#F5F5F5', // Figma text color
};

interface OfferCardProps {
  offer: OfferWithCommerce;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onPress,
  onFavoritePress,
}) => {
  const getDiscountText = (title: string) => {
    // Extract discount from title or description  
    const discountMatch = title.match(/(\d+)%/);
    if (discountMatch) return `${discountMatch[1]}% OFF`;
    
    // Check for common discount patterns
    if (title.toLowerCase().includes('free')) return 'FREE';
    if (title.toLowerCase().includes('buy 1 get 1')) return 'BOGO';
    if (title.toLowerCase().includes('2 for')) return '2 FOR 1';
    
    // Use the actual offer title if no pattern found
    return title.toUpperCase();
  };

  const getTimeLeft = () => {
    if (!offer.end_date) return null;
    
    const endDate = new Date(offer.end_date);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (hoursDiff <= 0) return 'EXPIRED';
    if (hoursDiff < 24) return `Ends in ${hoursDiff}h`;
    if (daysDiff <= 7) return `Ends in ${daysDiff}d`;
    
    return null;
  };

  const getPriceLevel = () => {
    // Based on commerce category or could be from offer data
    const category = offer.commerces?.category;
    switch (category) {
      case 'Restaurant': return '$$';
      case 'Café': return '$';
      case 'Épicerie': return '$';
      default: return '$$';
    }
  };

  const getLocationText = () => {
    // Use custom location if provided, otherwise use commerce address
    if (offer.custom_location) {
      return offer.custom_location;
    }
    return offer.commerces?.address || 'Location not specified';
  };

  const getConditionText = () => {
    // Use the actual condition from the database
    return offer.condition || null;
  };

  const isExpired = getTimeLeft() === 'EXPIRED';

  return (
    <TouchableOpacity 
      style={[styles.card, isExpired && styles.expiredCard]} 
      onPress={onPress}
      disabled={isExpired}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {offer.image_url ? (
          <Image 
            source={{ uri: offer.image_url }} 
            style={styles.offerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <IconSymbol 
              name="fork.knife" 
              size={32} 
              color={COLORS.white} 
            />
          </View>
        )}
        
        {/* Overlay Content */}
        <View style={styles.imageOverlay}>
          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{getDiscountText(offer.title)}</Text>
          </View>
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={onFavoritePress}
          >
            <IconSymbol name="heart" size={18} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Bottom Info Bar */}
        <View style={styles.infoBar}>
          <Text style={styles.infoText} numberOfLines={1}>
            {getLocationText()}
          </Text>
          
          {getTimeLeft() && (
            <View style={[
              styles.timeBadge, 
              isExpired && styles.expiredTimeBadge
            ]}>
              <Text style={[
                styles.timeText,
                isExpired && styles.expiredTimeText
              ]}>
                {getTimeLeft()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.contentHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {offer.commerces?.name || 'Business'}
            </Text>
            <Text style={styles.businessDetails} numberOfLines={1}>
              {offer.commerces?.category} • {offer.offer_type === 'both' ? 'Online & In-Store' : 
                offer.offer_type === 'online' ? 'Online Only' : 
                offer.offer_type === 'in_store' ? 'In-Store Only' : offer.offer_type}
            </Text>
            {getConditionText() && (
              <Text style={styles.conditionText} numberOfLines={1}>
                {getConditionText()}
              </Text>
            )}
            {offer.boosted && (
              <View style={styles.featuredBadge}>
                <IconSymbol name="star.fill" size={10} color={COLORS.white} />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{getPriceLevel()}</Text>
          </View>
        </View>

        {/* Claim Button */}
        <TouchableOpacity style={styles.claimButton} onPress={onPress}>
          <Text style={styles.claimButtonText}>
            {isExpired ? 'Expired' : 'Claim Offer'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16, // Figma: border-radius: 16px
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2, // Figma: 0px 2px 4px
    },
    shadowOpacity: 0.1, // Figma: rgba(0, 0, 0, 0.1)
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    width: 358, // Figma exact width
    height: 302, // Figma exact height
  },
  expiredCard: {
    opacity: 0.7,
  },
  imageContainer: {
    height: 176, // Figma: height: 176px
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0', // Figma: background: #F0F0F0
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12, // Figma: left: 12px, top: 12px
  },
  discountBadge: {
    backgroundColor: COLORS.green, // #B2FD9D
    paddingHorizontal: 8, // Figma measurements
    paddingVertical: 4,
    borderRadius: 9999, // Figma: border-radius: 9999px
    flexDirection: 'row',
    alignItems: 'center',
    height: 24, // Figma: height: 24px
  },
  discountText: {
    fontSize: 12, // Figma: font-size: 12px
    fontWeight: '600', // Figma: font-weight: 600
    color: COLORS.teal, // Figma: color: #016167
    lineHeight: 15, // Figma: line-height: 15px
  },
  favoriteButton: {
    width: 32, // Figma: width: 32px
    height: 32, // Figma: height: 32px
    borderRadius: 9999, // Figma: border-radius: 9999px
    backgroundColor: COLORS.white, // Figma: background: #FFFFFF
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44, // Figma: height: 44px
    backgroundColor: 'rgba(0,0,0,0.7)', // Figma: linear-gradient with rgba(0, 0, 0, 0.7)
    paddingHorizontal: 12, // Figma: left: 12px
    paddingVertical: 16, // Figma positioning
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12, // Figma: font-size: 12px
    color: COLORS.white, // Figma: color: #FFFFFF
    fontWeight: '500', // Figma: font-weight: 500
    lineHeight: 12, // Figma: line-height: 12px
  },
  timeBadge: {
    backgroundColor: COLORS.primary, // Figma: background: #FF6233
    paddingHorizontal: 8, // Figma positioning
    paddingVertical: 2, // Figma height: 20px
    borderRadius: 9999, // Figma: border-radius: 9999px
    height: 20, // Figma: height: 20px
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiredTimeBadge: {
    backgroundColor: COLORS.darkGray,
  },
  timeText: {
    fontSize: 12, // Figma: font-size: 12px
    fontWeight: '600', // Figma: font-weight: 600
    color: COLORS.white, // Figma: color: #FFFFFF
    lineHeight: 15, // Figma: line-height: 15px
  },
  expiredTimeText: {
    color: COLORS.white,
  },
  contentSection: {
    backgroundColor: COLORS.primary, // Figma: background: #FF6233
    padding: 12, // Figma positioning
    height: 126, // Figma: height: 126px
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  businessInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 16, // Figma: font-size: 16px
    fontWeight: '600', // Figma: font-weight: 600
    color: COLORS.textLight, // Figma: color: #F5F5F5
    lineHeight: 16, // Figma: line-height: 16px
    marginBottom: 4,
  },
  businessDetails: {
    fontSize: 12, // Figma: font-size: 12px
    fontWeight: '400', // Figma: font-weight: 400
    color: COLORS.textLight, // Figma: color: #F5F5F5
    lineHeight: 12, // Figma: line-height: 12px
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 3,
  },
  priceBadge: {
    backgroundColor: COLORS.white, // Figma: background: #FFFFFF
    paddingHorizontal: 8, // Figma positioning
    paddingVertical: 4,
    borderRadius: 9999, // Figma: border-radius: 9999px
    height: 24, // Figma: height: 24px
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 12, // Figma: font-size: 12px
    fontWeight: '500', // Figma: font-weight: 500
    color: COLORS.teal, // Figma: color: #016167
    lineHeight: 15, // Figma: line-height: 15px
  },
  claimButton: {
    backgroundColor: COLORS.gray, // Figma: background: #F5F5F5
    paddingHorizontal: 16, // Figma positioning
    paddingVertical: 8,
    borderRadius: 9999, // Figma: border-radius: 9999px
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 32, // Figma: height: 32px
    justifyContent: 'center',
  },
  claimButtonText: {
    fontSize: 12, // Figma: font-size: 12px
    fontWeight: '600', // Figma: font-weight: 600
    color: COLORS.primary, // Figma: color: #FF6233
    lineHeight: 15, // Figma: line-height: 15px
  },
});