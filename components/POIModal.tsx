import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';

const { width } = Dimensions.get('window');

interface POIModalProps {
  visible: boolean;
  poi: {
    name: string;
    category: string;
    type?: string;
    maki?: string;
    coordinates: [number, number];
    openingHours?: string;
    isOpen?: boolean;
    phone?: string;
  } | null;
  onClose: () => void;
  onGetDirections: (coordinates: [number, number]) => void;
}

export const POIModal: React.FC<POIModalProps> = ({
  visible,
  poi,
  onClose,
  onGetDirections,
}) => {
  if (!poi) return null;

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      food_and_drink: 'Restaurant / Bar',
      food_and_drink_stores: 'Magasin alimentaire',
      shop: 'Commerce',
      park_like: 'Parc',
      general: 'Lieu',
      medical: 'Santé',
      education: 'Éducation',
      sport_and_leisure: 'Sport & Loisirs',
      commercial_services: 'Services',
      visitor_amenities: 'Équipements',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: any } = {
      food_and_drink: 'fork.knife',
      food_and_drink_stores: 'cart.fill',
      shop: 'bag.fill',
      park_like: 'tree.fill',
      general: 'mappin.circle.fill',
      medical: 'cross.case.fill',
      education: 'book.fill',
      sport_and_leisure: 'sportscourt.fill',
      commercial_services: 'wrench.and.screwdriver.fill',
      visitor_amenities: 'info.circle.fill',
    };
    return icons[category] || 'mappin.circle.fill';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name={getCategoryIcon(poi.category)}
                size={24}
                color="#016167"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                {poi.name}
              </Text>
              <Text style={styles.category}>{getCategoryLabel(poi.category)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Open/Closed Status */}
          {poi.isOpen !== undefined && (
            <View style={[styles.statusBadge, poi.isOpen ? styles.openBadge : styles.closedBadge]}>
              <View style={[styles.statusDot, poi.isOpen ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.statusText, poi.isOpen ? styles.openText : styles.closedText]}>
                {poi.isOpen ? 'Ouvert' : 'Fermé'}
              </Text>
            </View>
          )}

          {/* Opening Hours */}
          {poi.openingHours && (
            <View style={styles.infoRow}>
              <IconSymbol name="clock.fill" size={16} color="#666666" />
              <Text style={styles.infoText}>{poi.openingHours}</Text>
            </View>
          )}

          {/* Phone */}
          {poi.phone && (
            <View style={styles.infoRow}>
              <IconSymbol name="phone.fill" size={16} color="#666666" />
              <Text style={styles.infoText}>{poi.phone}</Text>
            </View>
          )}

          {/* Type Info */}
          {poi.type && (
            <View style={styles.infoRow}>
              <IconSymbol name="info.circle.fill" size={16} color="#666666" />
              <Text style={styles.infoText}>{poi.type}</Text>
            </View>
          )}

          {/* Coordinates Info */}
          <View style={styles.infoRow}>
            <IconSymbol name="location.fill" size={16} color="#666666" />
            <Text style={styles.infoText}>
              {poi.coordinates[1].toFixed(5)}, {poi.coordinates[0].toFixed(5)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => {
                onGetDirections(poi.coordinates);
                onClose();
              }}
            >
              <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={20} color="#FFFFFF" />
              <Text style={styles.directionsText}>Itinéraire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '50%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openDot: {
    backgroundColor: '#4CAF50',
  },
  closedDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openText: {
    color: '#2E7D32',
  },
  closedText: {
    color: '#C62828',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#016167',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  directionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
