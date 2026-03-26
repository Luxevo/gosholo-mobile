import EventDetailModal from '@/components/EventDetailModal';
import OfferDetailModal from '@/components/OfferDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAIChat, type ChatMessage, type Recommendation } from '@/hooks/useAIChat';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
  ink: '#111827',
  inkDim: '#6B7280',
  bg: '#FFFFFF',
  bgMuted: '#F3F4F6',
  white: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
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

function RecommendationCard({ item, onPress }: { item: Recommendation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recCard} activeOpacity={0.8} onPress={onPress}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.recImage} />
      ) : (
        <View style={[styles.recImage, styles.recImagePlaceholder]}>
          <IconSymbol
            name={item.type === 'offer' ? 'tag.fill' : 'calendar'}
            size={16}
            color={COLORS.white}
          />
        </View>
      )}
      <View style={styles.recContent}>
        <Text style={styles.recType}>
          {item.type === 'offer' ? 'OFFER' : 'EVENT'}
        </Text>
        <Text style={styles.recTitle} numberOfLines={1}>{item.title}</Text>
        {item.businessName && (
          <Text style={styles.recBusiness} numberOfLines={1}>{item.businessName}</Text>
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
        <View style={styles.avatarBubble}>
          <IconSymbol name="sparkles" size={14} color={COLORS.teal} />
        </View>
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
  return (
    <View style={[styles.messageRow]}>
      <View style={styles.avatarBubble}>
        <IconSymbol name="sparkles" size={14} color={COLORS.teal} />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <ActivityIndicator size="small" color={COLORS.teal} />
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

  const handleRecPress = (rec: Recommendation) => {
    // Build a minimal object from the recommendation data — no Supabase query needed
    const item = {
      id: rec.id,
      title: rec.title,
      description: rec.description || '',
      image_url: rec.imageUrl,
      latitude: rec.latitude,
      longitude: rec.longitude,
      commerces: {
        name: rec.businessName || '',
      },
    };

    if (rec.type === 'offer') {
      setSelectedOffer(item);
      setShowOfferModal(true);
    } else {
      setSelectedEvent(item);
      setShowEventModal(true);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <IconSymbol name="sparkles" size={18} color={COLORS.teal} />
          </View>
          <View>
            <Text style={styles.headerTitle}>GoSholo AI</Text>
            <Text style={styles.headerSubtitle}>{t('ai_coming_soon_subtitle').slice(0, 40)}...</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <IconSymbol name="arrow.counterclockwise" size={16} color={COLORS.inkDim} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isEmpty ? (
          /* Welcome state */
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <IconSymbol name="sparkles" size={36} color={COLORS.teal} />
            </View>
            <Text style={styles.welcomeTitle}>{t('ai_coming_soon_title')}</Text>
            <Text style={styles.welcomeText}>
              {i18n.language === 'fr'
                ? 'Posez-moi une question sur les offres, événements et commerces près de vous.'
                : 'Ask me about offers, events, and businesses near you.'}
            </Text>
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
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
          </View>
        ) : (
          /* Messages */
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
        <View style={styles.inputBar}>
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
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <IconSymbol name="arrow.up" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.inkDim,
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgMuted,
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
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    borderWidth: 1,
    borderColor: COLORS.teal,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.teal,
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
    marginBottom: 16,
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    maxWidth: '80%',
    gap: 8,
  },
  avatarBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.tealLight,
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
    backgroundColor: COLORS.teal,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.bgMuted,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
  },
  messageTextUser: {
    color: COLORS.white,
  },
  typingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  recImagePlaceholder: {
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: {
    flex: 1,
  },
  recType: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    marginTop: 1,
  },
  recBusiness: {
    fontSize: 11,
    color: COLORS.inkDim,
    marginTop: 1,
  },

  // Input
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bgMuted,
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.inkDim,
    opacity: 0.4,
  },
});
