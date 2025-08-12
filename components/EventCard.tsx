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

interface EventCardProps {
  title: string;
  location: string;
  dateTime: string;
  attendees?: string;
  type: string;
  category: string;
  price?: string;
  isFree?: boolean;
  spotsLeft?: number;
  onGetTickets?: () => void;
  onViewDetails?: () => void;
  onBookNow?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function EventCard({
  title,
  location,
  dateTime,
  attendees,
  type,
  category,
  price,
  isFree = false,
  spotsLeft,
  onGetTickets,
  onViewDetails,
  onBookNow,
  onSave,
  isSaved = false,
}: EventCardProps) {
  const getCategoryColor = () => {
    switch (category.toLowerCase()) {
      case 'trending':
        return COLORS.green;
      case 'food fest':
        return COLORS.primary;
      case 'coffee':
        return COLORS.teal;
      case 'workshop':
        return COLORS.primary;
      default:
        return COLORS.gray;
    }
  };

  const getCategoryIcon = () => {
    switch (category.toLowerCase()) {
      case 'trending':
        return 'flame.fill';
      case 'food fest':
        return 'fork.knife';
      case 'coffee':
        return 'cup.and.saucer.fill';
      case 'workshop':
        return 'hammer.fill';
      default:
        return 'calendar';
    }
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventImageContainer}>
        <View style={styles.eventImage} />
        
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
          <IconSymbol 
            name={getCategoryIcon()} 
            size={12} 
            color={category === 'trending' ? COLORS.black : COLORS.white} 
          />
          <Text style={[
            styles.categoryText,
            { color: category === 'trending' ? COLORS.black : COLORS.white }
          ]}>
            {category}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <IconSymbol 
            name={isSaved ? "bookmark.fill" : "bookmark"} 
            size={20} 
            color={COLORS.white} 
          />
        </TouchableOpacity>

        {/* Date/Time Overlay */}
        <View style={styles.dateTimeOverlay}>
          <Text style={styles.dateTimeText}>{dateTime}</Text>
        </View>

        {/* Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{type}</Text>
        </View>
      </View>

      <View style={styles.eventContent}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{title}</Text>
          <Text style={styles.eventLocation}>{location}</Text>
          
          <View style={styles.eventDetails}>
            {attendees && (
              <View style={styles.detailItem}>
                <IconSymbol name="person.2.fill" size={14} color={COLORS.primary} />
                <Text style={styles.detailText}>{attendees}</Text>
              </View>
            )}
            {spotsLeft && (
              <View style={styles.detailItem}>
                <IconSymbol name="clock" size={14} color={COLORS.primary} />
                <Text style={styles.detailText}>{spotsLeft} spots left</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <IconSymbol name="location" size={14} color={COLORS.primary} />
              <Text style={styles.detailText}>Indoor</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          {isFree ? (
            <Text style={styles.freeText}>Free Entry</Text>
          ) : (
            <Text style={styles.priceText}>{price}</Text>
          )}
        </View>
      </View>

      <View style={styles.eventActions}>
        {onGetTickets && (
          <TouchableOpacity style={styles.primaryButton} onPress={onGetTickets}>
            <Text style={styles.primaryButtonText}>Get Tickets</Text>
          </TouchableOpacity>
        )}
        {onBookNow && (
          <TouchableOpacity style={styles.primaryButton} onPress={onBookNow}>
            <Text style={styles.primaryButtonText}>Book Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={onViewDetails}>
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: {
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
  eventImageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  saveButton: {
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
  dateTimeOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  eventContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  freeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  eventActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
});