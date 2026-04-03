import EventDetailModal from '@/components/EventDetailModal';
import OfferDetailModal from '@/components/OfferDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAIChat, type ChatMessage, type Recommendation } from '@/hooks/useAIChat';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary:           '#FF6233',
  teal:              'rgb(1,111,115)',
  tealLight:         'rgba(1,111,115,0.08)',
  tealGradientStart: '#016167',
  tealGradientEnd:   '#028a92',
  ink:               '#111827',
  inkDim:            '#6B7280',
  bg:                '#FAFCFC',
  bgMuted:           '#F3F4F6',
  white:             '#FFFFFF',
  border:            'rgba(0,0,0,0.06)',
  orangeLight:       'rgba(255,98,51,0.1)',
  greenAccent:       '#B2FD9D',
  blueAccent:        '#5BC4DB',
  cardShadow:        'rgba(0,0,0,0.08)',
  dangerLight:       'rgba(239,68,68,0.15)',
} as const;

const SUGGESTIONS = {
  en: [
    "What's happening this weekend?",
    'Best deals near me',
    'Restaurant recommendations',
    'Any events today?',
  ],
  fr: [
    'Quoi faire cette fin de semaine ?',
    'Meilleures offres près de moi',
    'Recommandations de restaurants',
    "Des événements aujourd'hui ?",
  ],
} as const;

const CHIP_CONFIGS = [
  { icon: 'calendar'   as const, bg: COLORS.teal },
  { icon: 'tag.fill'   as const, bg: COLORS.primary },
  { icon: 'fork.knife' as const, bg: COLORS.blueAccent },
  { icon: 'flame'      as const, bg: COLORS.teal },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function navigateToMap(address?: string, coordinates?: [number, number]) {
  setTimeout(() => {
    if (coordinates) {
      router.push({
        pathname: '/compass',
        params: { destination: `${coordinates[0]},${coordinates[1]}`, type: 'coordinates' },
      });
    } else if (address) {
      router.push({ pathname: '/compass', params: { destination: address, type: 'address' } });
    }
  }, 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecommendationCard({ item, onPress }: { item: Recommendation; onPress: () => void }) {
  const isOffer    = item.type === 'offer';
  const accentColor = isOffer ? COLORS.teal : COLORS.primary;

  return (
    <TouchableOpacity style={styles.recCard} activeOpacity={0.8} onPress={onPress}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.recImage} />
      ) : (
        <View style={[styles.recImage, styles.recImagePlaceholder, { backgroundColor: accentColor }]}>
          <IconSymbol name={isOffer ? 'tag.fill' : 'calendar'} size={16} color={COLORS.white} />
        </View>
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
        <View style={styles.avatarBubble}>
          <IconSymbol name="sparkles" size={14} color={COLORS.white} />
        </View>
      )}
      <View style={styles.messageContent}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
            {message.content}
          </Text>
        </View>
        {(message.recommendations?.length ?? 0) > 0 && (
          <View style={styles.recList}>
            {message.recommendations!.map((rec) => (
              <RecommendationCard key={rec.id} item={rec} onPress={() => onRecPress(rec)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={styles.avatarBubble}>
        <IconSymbol name="sparkles" size={14} color={COLORS.white} />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.inkDim}
        multiline
        maxLength={500}
        onSubmitEditing={onSend}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[styles.sendBtn, disabled && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={disabled}
      >
        <IconSymbol name="arrow.up" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Modal state ──────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'offer';  data: any }
  | { type: 'event';  data: any }
  | null;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AIScreen() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const { messages, loading, sendMessage, clearChat } = useAIChat(i18n.language);
  const [input, setInput]       = useState('');
  const [modal, setModal]       = useState<ModalState>(null);
  const listRef                 = useRef<FlatList>(null);

  const handleRecPress = async (rec: Recommendation) => {
    try {
      const table = rec.type === 'offer' ? 'offers' : 'events';

      const { data: itemData } = await supabase.from(table).select('*').eq('id', rec.id).single();
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

      setModal({ type: rec.type, data: { ...itemData, commerces: commerceData } });
    } catch (err) {
      console.error('Error opening recommendation:', err);
    }
  };

  const closeModal = () => setModal(null);

  const handleMapNav = (address?: string, coordinates?: [number, number]) => {
    closeModal();
    navigateToMap(address, coordinates);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  };

  const suggestions = isFr ? SUGGESTIONS.fr : SUGGESTIONS.en;
  const isEmpty     = messages.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
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
              {isFr ? 'Votre assistant local' : 'Your local discovery assistant'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <IconSymbol name="arrow.counterclockwise" size={16} color={COLORS.teal} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isEmpty ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <IconSymbol name="sparkles" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.welcomeTitle}>{t('ai_coming_soon_title')}</Text>
            <Text style={styles.welcomeText}>
              {isFr
                ? 'Posez-moi une question sur les offres, événements et commerces près de vous.'
                : 'Ask me about offers, events, and businesses near you.'}
            </Text>
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => {
                const { icon, bg } = CHIP_CONFIGS[i];
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionChip, { backgroundColor: bg }]}
                    onPress={() => !loading && sendMessage(s)}
                  >
                    <IconSymbol name={icon} size={13} color={COLORS.white} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace('/offers' as any)}>
              <IconSymbol name="safari" size={16} color={COLORS.white} />
              <Text style={styles.exploreBtnText}>
                {isFr ? 'Explorer par moi-même' : 'Explore on my own'}
              </Text>
            </TouchableOpacity>
          </View>
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

        {/* Input bar */}
        <View style={styles.inputBarOuter}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={styles.inputBar}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={!input.trim() || loading}
                placeholder={isFr ? 'Demandez-moi quelque chose...' : 'Ask me anything...'}
              />
            </BlurView>
          ) : (
            <View style={[styles.inputBar, styles.inputBarAndroid]}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={!input.trim() || loading}
                placeholder={isFr ? 'Demandez-moi quelque chose...' : 'Ask me anything...'}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <OfferDetailModal
        visible={modal?.type === 'offer'}
        offer={modal?.type === 'offer' ? modal.data : null}
        onClose={closeModal}
        onNavigateToMap={handleMapNav}
      />
      <EventDetailModal
        visible={modal?.type === 'event'}
        event={modal?.type === 'event' ? modal.data : null}
        onClose={closeModal}
        onNavigateToMap={handleMapNav}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flex:      { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.greenAccent,
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: COLORS.teal },
  onlineDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal },
  headerSubtitle: { fontSize: 11, color: 'rgba(1,97,103,0.6)', marginTop: 1 },
  clearBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(1,97,103,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Welcome
  welcome:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  welcomeIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  welcomeTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  welcomeText:   { fontSize: 14, color: COLORS.inkDim, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  suggestions:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  suggestionChip:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  suggestionText:{ fontSize: 13, fontWeight: '500', color: COLORS.white },
  exploreBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20, gap: 8 },
  exploreBtnText:{ fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Messages
  messagesList:    { paddingHorizontal: 16, paddingVertical: 12 },
  messageRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  messageRowUser:  { justifyContent: 'flex-end' },
  messageContent:  { maxWidth: '78%', gap: 10 },
  avatarBubble:    { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bubble:          { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:      { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleAI:        { backgroundColor: COLORS.bgMuted, borderBottomLeftRadius: 4 },
  messageText:     { fontSize: 15, lineHeight: 22, color: COLORS.ink },
  messageTextUser: { color: COLORS.white },
  typingBubble:    { paddingHorizontal: 16, paddingVertical: 14 },
  typingDots:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal },

  // Recommendation cards
  recList:            { gap: 6 },
  recCard:            { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 10, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  recImage:           { width: 44, height: 44, borderRadius: 8 },
  recImagePlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  recContent:         { flex: 1 },
  recTypeBadge:       { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  recType:            { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  recTitle:           { fontSize: 13, fontWeight: '600', color: COLORS.ink, marginTop: 2 },
  recBusinessRow:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  recBusiness:        { fontSize: 11, color: COLORS.inkDim },

  // Input
  inputBarOuter:  { borderTopWidth: 1, borderTopColor: COLORS.border },
  inputBar:       { paddingHorizontal: 16, paddingVertical: 10 },
  inputBarAndroid:{ backgroundColor: COLORS.white },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: COLORS.bgMuted, borderRadius: 22, paddingLeft: 16, paddingRight: 4, paddingVertical: 4, gap: 8 },
  input:          { flex: 1, fontSize: 15, color: COLORS.ink, maxHeight: 100, paddingVertical: Platform.OS === 'ios' ? 8 : 4 },
  sendBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#D1D5DB' },
});