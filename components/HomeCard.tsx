import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Card data type
export interface HomeCardData {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  route: string;
  hasButton: boolean;
  buttonText?: string;
}

// Reusable Home Card Component
export default function HomeCard({ card, onPress }: { card: HomeCardData, onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${card.title} - ${card.subtitle}`}
    >
      <Image 
        source={card.image} 
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          {card.hasButton && (
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>{card.buttonText}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: Platform.OS === 'android' ? 14 : 16,
    overflow: 'hidden',
    height: Platform.OS === 'android' ? 140 : 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 14 : 16,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Platform.OS === 'android' ? 19 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: Platform.OS === 'android' ? 14 : 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 14 : 16,
  },
  cardButton: {
    backgroundColor: '#FF6233',
    paddingHorizontal: Platform.OS === 'android' ? 15 : 16,
    paddingVertical: Platform.OS === 'android' ? 7 : 8,
    borderRadius: 20,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 