import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildSystemPrompt(
  contextString: string,
  todayDate: string,
  language: string,
  hasUserLocation: boolean
): string {
  const langInstruction = language === 'en'
    ? 'You MUST respond in English.'
    : 'You MUST respond in French.';

  const proximityInstruction = hasUserLocation
    ? '\n- When the user asks for things "near me" or "nearby", prioritize items that are geographically closest to the user\'s location based on the latitude/longitude data provided.'
    : '';

  return `You are GoSholo AI, a friendly assistant for GoSholo, a local discovery app in Canada. Today is ${todayDate}. ${langInstruction}

YOU CAN ONLY RECOMMEND ITEMS LISTED BELOW IN "DATABASE CONTEXT". You MUST NOT invent, fabricate, or hallucinate any offer, event, business name, or ID. If an item is not in the database context below, it does not exist.

Rules:
- Be concise (1-3 sentences) and friendly.
- When recommending, copy the EXACT id, title, and business name from the context. Do not paraphrase titles.
- Do NOT mention distance or proximity unless the user asks about "near me" or "nearby".${proximityInstruction}
- If the context has relevant items, recommend them. The user is here to discover things.
- If the context is empty or nothing matches, say so — do NOT make up items.

Respond with JSON only:
{"message": "your response", "recommendations": [{"type": "offer or event", "id": "exact-uuid-from-context", "title": "exact-title-from-context", "businessName": "exact-business-from-context", "description": "brief description from context"}]}

Use "recommendations": [] when nothing is relevant.

--- DATABASE CONTEXT (these are the ONLY items that exist) ---
${contextString || 'EMPTY — no offers or events available.'}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { message, context, history, language } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Message must be 500 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (context !== undefined && context !== null && typeof context !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid context format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (history !== undefined && !Array.isArray(history)) {
      return new Response(
        JSON.stringify({ error: 'History must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context string from DB data
    const contextParts: string[] = [];

    if (context?.offers?.length > 0) {
      contextParts.push('AVAILABLE OFFERS:');
      context.offers.forEach((o: any) => {
        contextParts.push(`- [ID: ${o.id}] "${o.title}" at ${o.business || 'Unknown'} (${o.category || 'N/A'}) — ${o.description || 'No description'}. Address: ${o.address || 'N/A'}. Valid: ${o.start_date || '?'} to ${o.end_date || '?'}. Image: ${o.image_url || 'none'}`);
      });
    }

    if (context?.events?.length > 0) {
      contextParts.push('\nAVAILABLE EVENTS:');
      context.events.forEach((e: any) => {
        contextParts.push(`- [ID: ${e.id}] "${e.title}" at ${e.business || 'Unknown'} (${e.category || 'N/A'}) — ${e.description || 'No description'}. Address: ${e.address || 'N/A'}. Dates: ${e.start_date || '?'} to ${e.end_date || '?'}. Image: ${e.image_url || 'none'}`);
      });
    }

    if (context?.userLocation) {
      contextParts.push(`\nUSER LOCATION: lat ${context.userLocation.latitude}, lng ${context.userLocation.longitude}`);
    }

    const contextString = contextParts.join('\n');

    // Build system prompt
    const todayDate = new Date().toISOString().split('T')[0];
    const effectiveLanguage = (language === 'en' || language === 'fr') ? language : 'fr';
    const hasUserLocation = !!(context?.userLocation);

    const openaiMessages: any[] = [
      {
        role: 'system',
        content: buildSystemPrompt(contextString, todayDate, effectiveLanguage, hasUserLocation),
      },
    ];

    // Sanitize and add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (
          msg &&
          typeof msg.content === 'string' &&
          msg.content.length > 0 &&
          msg.content.length <= 2000 &&
          (msg.role === 'user' || msg.role === 'assistant')
        ) {
          openaiMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Add current message
    openaiMessages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI error:', errorBody);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { message: content, recommendations: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('OpenAI API error') ? 502 : 500;

    return new Response(
      JSON.stringify({ error: 'An internal error occurred. Please try again.' }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
