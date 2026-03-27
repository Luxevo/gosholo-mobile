import EventDetailModal from '@/components/EventDetailModal';
import OfferDetailModal from '@/components/OfferDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAIChat, type ChatMessage, type Recommendation } from '@/hooks/useAIChat';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  teal: 'rgb(1,111,115)',
  tealLight: 'rgba(1,111,115,0.08)',
  tealGradientStart: '#016167',
  tealGradientEnd: '#028a92',
  ink: '#111827',
  inkDim: '#6B7280',
  bg: '#FAFCFC',
  bgMuted: '#F3F4F6',
  white: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  orangeLight: 'rgba(255,98,51,0.1)',
  greenAccent: '#B2FD9D',
  blueAccent: '#5BC4DB',
  cardShadow: 'rgba(0,0,0,0.08)',
  dangerLight: 'rgba(239,68,68,0.15)',
};

const SUGGESTIONS_EN = [
  "What's happening this weekend?",
  "Best deals near me",
  "Restaurant recommendations",
  "Any events today?",
];

const SUGGESTIONS_FR = [
  "Quoi faire cette fin de semaine ?",
  "Meilleures offres près de moi",
  "Recommandations de restaurants",
  "Des événements aujourd'hui ?",
];

const CHIP_CONFIGS = [
  { icon: 'calendar' as const, bg: COLORS.teal, textColor: COLORS.white },
  { icon: 'tag.fill' as const, bg: COLORS.primary, textColor: COLORS.white },
  { icon: 'fork.knife' as const, bg: COLORS.blueAccent, textColor: COLORS.white },
  { icon: 'flame' as const, bg: '#016167', textColor: COLORS.white },
];

function RecommendationCard({ item, onPress }: { item: Recommendation; onPress: () => void }) {
  const isOffer = item.type === 'offer';
  const accentColor = isOffer ? COLORS.teal : COLORS.primary;

  return (
    <TouchableOpacity style={styles.recCard} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.recAccentBar, { backgroundColor: accentColor }]} />
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.recImage} />
      ) : (
        <LinearGradient
          colors={isOffer
            ? [COLORS.tealGradientStart, COLORS.tealGradientEnd]
            : [COLORS.primary, '#E8552A']
          }
          style={[styles.recImage, styles.recImagePlaceholder]}
        >
          <IconSymbol
            name={isOffer ? 'tag.fill' : 'calendar'}
            size={16}
            color={COLORS.white}
          />
        </LinearGradient>
      )}
      <View style={styles.recContent}>
        <View style={[styles.recTypeBadge, { backgroundColor: isOffer ? COLORS.tealLight : COLORS.orangeLight }]}>
          <Text style={[styles.recType, { color: accentColor }]}>
            {isOffer ? 'OFFER' : 'EVENT'}
          </Text>
        </View>
        <Text style={styles.recTitle} numberOfLines={1}>{item.title}</Text>
        {item.businessName && (
          <View style={styles.recBusinessRow}>
            <IconSymbol name="mappin" size={10} color={COLORS.inkDim} />
            <Text style={styles.recBusiness} numberOfLines={1}>{item.businessName}</Text>
          </View>
        )}
      </View>
      <IconSymbol name="chevron.right" size={14} color={COLORS.inkDim} />
    </TouchableOpacity>
  );
}

function MessageBubble({ message, onRecPress }: { message: ChatMessage; onRecPress: (rec: Recommendation) => void }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <LinearGradient
          colors={[COLORS.tealGradientStart, COLORS.tealGradientEnd]}
          style={styles.avatarBubble}
        >
          <IconSymbol name="sparkles" size={14} color={COLORS.white} />
        </LinearGradient>
      )}
      <View style={styles.messageContent}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
            {message.content}
          </Text>
        </View>
        {message.recommendations && message.recommendations.length > 0 && (
          <View style={styles.recList}>
            {message.recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                item={rec}
                onPress={() => onRecPress(rec)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.messageRow}>
      <LinearGradient
        colors={[COLORS.tealGradientStart, COLORS.tealGradientEnd]}
        style={styles.avatarBubble}
      >
        <IconSymbol name="sparkles" size={14} color={COLORS.white} />
      </LinearGradient>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
}

export default function AIScreen() {
  const { t, i18n } = useTranslation();
  const { messages, loading, sendMessage, clearChat } = useAIChat(i18n.language);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleRecPress = async (rec: Recommendation) => {
    try {
      const table = rec.type === 'offer' ? 'offers' : 'events';

      const { data: itemData } = await supabase
        .from(table)
        .select('*')
        .eq('id', rec.id)
        .single();

      if (!itemData) return;

      let commerceData = null;
      if (itemData.commerce_id) {
        const { data } = await supabase
          .from('commerces')
          .select('id, name, address, latitude, longitude, phone, email, website, image_url, facebook_url, instagram_url, category_id, category:category_id(name_en, name_fr)')
          .eq('id', itemData.commerce_id)
          .single();
        commerceData = data;
      }

      const fullItem = { ...itemData, commerces: commerceData };

      if (rec.type === 'offer') {
        setSelectedOffer(fullItem);
        setShowOfferModal(true);
      } else {
        setSelectedEvent(fullItem);
        setShowEventModal(true);
      }
    } catch (err) {
      console.error('Error opening recommendation:', err);
    }
  };

  const suggestions = i18n.language === 'fr' ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  };

  const handleSuggestion = (text: string) => {
    if (loading) return;
    sendMessage(text);
  };

  const isEmpty = messages.length === 0;

  const inputContent = (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder={i18n.language === 'fr' ? 'Demandez-moi quelque chose...' : 'Ask me anything...'}
        placeholderTextColor={COLORS.inkDim}
        multiline
        maxLength={500}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[
          styles.sendBtn,
          (!input.trim() || loading) && styles.sendBtnDisabled,
          (input.trim() && !loading) && styles.sendBtnActive,
        ]}
        onPress={handleSend}
        disabled={!input.trim() || loading}
      >
        <IconSymbol name="arrow.up" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.tealGradientStart, COLORS.tealGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <IconSymbol name="sparkles" size={18} color={COLORS.white} />
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>gosholo AI</Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.headerSubtitle}>
              {i18n.language === 'fr' ? 'Votre assistant local' : 'Your local discovery assistant'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <IconSymbol name="arrow.counterclockwise" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isEmpty ? (
          <LinearGradient
            colors={['rgba(1,111,115,0.06)', 'rgba(1,111,115,0.02)', COLORS.white]}
            style={styles.welcome}
          >
            <View style={styles.welcomeIconArea}>
              <View style={styles.welcomeIconRing3} />
              <View style={styles.welcomeIconRing2} />
              <View style={styles.welcomeIconRing1}>
                <IconSymbol name="sparkles" size={36} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.welcomeTitle}>{t('ai_coming_soon_title')}</Text>
            <Text style={styles.welcomeText}>
              {i18n.language === 'fr'
                ? 'Posez-moi une question sur les offres, événements et commerces près de vous.'
                : 'Ask me about offers, events, and businesses near you.'}
            </Text>
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => {
                const config = CHIP_CONFIGS[i];
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionChip, { backgroundColor: config.bg }]}
                    onPress={() => handleSuggestion(s)}
                  >
                    <IconSymbol name={config.icon} size={13} color={config.textColor} />
                    <Text style={[styles.suggestionText, { color: config.textColor }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.replace('/offers' as any)}
            >
              <IconSymbol name="safari" size={16} color={COLORS.white} />
              <Text style={styles.exploreBtnText}>
                {i18n.language === 'fr' ? 'Explorer par moi-même' : 'Explore on my own'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} onRecPress={handleRecPress} />}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={loading ? <TypingIndicator /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Input */}
        <View style={styles.inputBarOuter}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={styles.inputBar}>
              {inputContent}
            </BlurView>
          ) : (
            <View style={[styles.inputBar, styles.inputBarAndroid]}>
              {inputContent}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <OfferDetailModal
        visible={showOfferModal}
        offer={selectedOffer}
        onClose={() => { setShowOfferModal(false); setSelectedOffer(null); }}
        onNavigateToMap={(address, coordinates) => {
          setShowOfferModal(false);
          setSelectedOffer(null);
          setTimeout(() => {
            if (coordinates) {
              router.push({ pathname: '/compass', params: { destination: `${coordinates[0]},${coordinates[1]}`, type: 'coordinates' } });
            } else if (address) {
              router.push({ pathname: '/compass', params: { destination: address, type: 'address' } });
            }
          }, 100);
        }}
      />

      <EventDetailModal
        visible={showEventModal}
        event={selectedEvent}
        onClose={() => { setShowEventModal(false); setSelectedEvent(null); }}
        onNavigateToMap={(address, coordinates) => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setTimeout(() => {
            if (coordinates) {
              router.push({ pathname: '/compass', params: { destination: `${coordinates[0]},${coordinates[1]}`, type: 'coordinates' } });
            } else if (address) {
              router.push({ pathname: '/compass', params: { destination: address, type: 'address' } });
            }
          }, 100);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.greenAccent,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome
  welcome: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeIconArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeIconRing3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(1,111,115,0.06)',
  },
  welcomeIconRing2: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(1,111,115,0.12)',
  },
  welcomeIconRing1: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.inkDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    maxWidth: '78%',
    gap: 10,
  },
  avatarBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.teal,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.ink,
  },
  messageTextUser: {
    color: COLORS.white,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
  },

  // Recommendations
  recList: {
    gap: 6,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    paddingLeft: 0,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  recAccentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  recImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  recImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: {
    flex: 1,
  },
  recTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  recType: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    marginTop: 2,
  },
  recBusinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  recBusiness: {
    fontSize: 11,
    color: COLORS.inkDim,
  },

  // Input
  inputBarOuter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputBarAndroid: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 1,
  },
});
