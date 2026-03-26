import { supabase } from '@/lib/supabase';
import { useLocation } from '@/contexts/LocationContext';
import { useState, useCallback, useRef } from 'react';

export interface Recommendation {
  type: 'offer' | 'event';
  id: string;
  title: string;
  description?: string;
  businessName?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Recommendation[];
  timestamp: Date;
}

const CONTEXT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAIChat(language: string = 'fr') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeLocation } = useLocation();

  const contextCacheRef = useRef<{
    data: any | null;
    timestamp: number;
    locationKey: string;
  }>({ data: null, timestamp: 0, locationKey: '' });

  const buildContext = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch offers
    const { data: offers } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gt.${today}`)
      .limit(30);

    // Fetch events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gt.${today}`)
      .limit(30);

    // Fetch commerce data for all referenced IDs
    const commerceIds = [
      ...new Set([
        ...(offers || []).map(o => o.commerce_id),
        ...(events || []).map(e => e.commerce_id),
      ].filter(Boolean)),
    ];

    let commercesMap: Record<string, any> = {};
    if (commerceIds.length > 0) {
      const { data: commerces } = await supabase
        .from('commerces')
        .select('id, name, address, latitude, longitude, category_id, category:category_id(name_en, name_fr)')
        .in('id', commerceIds);

      (commerces || []).forEach(c => { commercesMap[c.id] = c; });
    }

    return {
      offers: (offers || []).map(o => {
        const c = commercesMap[o.commerce_id] || {};
        return {
          id: o.id,
          title: o.title,
          description: o.description,
          start_date: o.start_date,
          end_date: o.end_date,
          business: c.name,
          category: (c.category as any)?.name_en,
          address: c.address,
          image_url: o.image_url,
          latitude: o.latitude || c.latitude,
          longitude: o.longitude || c.longitude,
        };
      }),
      events: (events || []).map(e => {
        const c = commercesMap[e.commerce_id] || {};
        return {
          id: e.id,
          title: e.title,
          description: e.description,
          start_date: e.start_date,
          end_date: e.end_date,
          business: c.name,
          category: (c.category as any)?.name_en,
          address: c.address,
          image_url: e.image_url,
          latitude: e.latitude || c.latitude,
          longitude: e.longitude || c.longitude,
        };
      }),
      userLocation: activeLocation
        ? { longitude: activeLocation[0], latitude: activeLocation[1] }
        : null,
    };
  };

  const getContext = async () => {
    const now = Date.now();
    const locationKey = activeLocation ? `${activeLocation[0]},${activeLocation[1]}` : 'none';
    const cache = contextCacheRef.current;

    if (
      cache.data &&
      now - cache.timestamp < CONTEXT_CACHE_TTL &&
      cache.locationKey === locationKey
    ) {
      return cache.data;
    }

    const freshContext = await buildContext();
    contextCacheRef.current = {
      data: freshContext,
      timestamp: now,
      locationKey,
    };
    return freshContext;
  };

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const context = await getContext();
      console.log('[AI Chat] Context:', context.offers.length, 'offers,', context.events.length, 'events');

      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: text,
          context,
          history: conversationHistory,
          language,
        },
      });

      if (error) throw error;

      // Only keep recommendations that match real items from our database
      const allItems = [
        ...context.offers.map((o: any) => ({ ...o, type: 'offer' })),
        ...context.events.map((e: any) => ({ ...e, type: 'event' })),
      ];

      const usedIds = new Set<string>();
      const enrichedRecs = (data.recommendations || [])
        .map((rec: any) => {
          // Try exact ID match first
          let match = allItems.find((item: any) => item.id === rec.id);
          // Fallback: match by title (case-insensitive)
          if (!match && rec.title) {
            const recTitle = rec.title.toLowerCase().trim();
            match = allItems.find((item: any) =>
              item.title?.toLowerCase().trim() === recTitle
            );
          }
          if (!match || usedIds.has(match.id)) return null;
          usedIds.add(match.id);
          return {
            type: match.type as 'offer' | 'event',
            id: match.id,
            title: match.title,
            description: match.description,
            imageUrl: match.image_url,
            businessName: match.business,
            latitude: match.latitude,
            longitude: match.longitude,
          };
        })
        .filter(Boolean) as Recommendation[];

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.response || 'Sorry, I could not process that.',
        recommendations: enrichedRecs,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI chat error:', err);

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, activeLocation, language]);

  const clearChat = useCallback(() => {
    setMessages([]);
    contextCacheRef.current = { data: null, timestamp: 0, locationKey: '' };
  }, []);

  return { messages, loading, sendMessage, clearChat };
}
