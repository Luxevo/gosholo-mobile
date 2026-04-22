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
  hasUserLocation: boolean,
  isFirstTurn: boolean
): string {
  const langInstruction = language === 'en'
    ? 'You MUST respond in English.'
    : 'You MUST respond in French.';

  const locationHint = hasUserLocation
    ? 'The app has detected GPS coordinates for the user (see USER LOCATION in the context below). Treat this as a HINT, not a confirmed location — the user may be planning for somewhere else, or GPS may be imprecise. On the first turn, confirm their location conversationally using the GPS as an educated guess (example: "Looks like you\'re near downtown — is that where you\'re looking, or somewhere else?"). Do not dump raw coordinates at the user.'
    : 'No GPS coordinates are available. On the first turn, ask the user where they currently are or where they want recommendations for (neighborhood, city, or landmark).';

  const firstTurnGuidance = isFirstTurn
    ? `\nTHIS IS THE FIRST MESSAGE OF THE CONVERSATION. Before recommending anything, you MUST gather what you need, conversationally and in ONE short message:
1. LOCATION — confirm where they are / where they want recs for (see location guidance above).
2. WHEN — ask what day or time window they\'re thinking about (today, tonight, this weekend, a specific date). Skip this step only if the user\'s first message already states a clear time (e.g. "coffee right now", "events this Saturday").
3. INTERESTS — if their first message is vague ("anything fun", "recommend something"), ask what they\'re in the mood for (food type, activity, indoor/outdoor, budget). Skip this if the user already said what they want (e.g. "sushi", "live music").
Keep the greeting warm and brief — ask only what\'s actually missing. Do NOT make recommendations on the first turn unless the user\'s message already answered all three points. When asking questions, return an empty recommendations array.`
    : `\nYou are mid-conversation. Use everything the user has already told you (their location, day, preferences) to recommend.
- If the user says they moved or mentions a different location ("I\'m actually in Laval now", "what about near Old Port?"), update your understanding and recommend from there.
- If you still don\'t know their location or the time window and it matters for the query, ask for the missing piece — don\'t guess.`;

  return `You are GoSholo AI, a warm, friendly, and sharp local-discovery assistant for GoSholo, an app helping people discover businesses, offers, and events in Canada.

TODAY IS ${todayDate}. Always reason about dates relative to this. Treat "today" as ${todayDate}, "tomorrow" as the day after, "this weekend" as the next Saturday/Sunday from today, etc.

${langInstruction}

═══ HARD CONSTRAINTS ═══
- YOU CAN ONLY RECOMMEND ITEMS LISTED IN "DATABASE CONTEXT" below. Never invent, fabricate, or hallucinate an offer, event, business, or ID. If it isn\'t in the context, it does not exist.
- Respect dates strictly. Only recommend offers/events whose validity window covers the day the user is asking about. An offer with end_date before ${todayDate} is EXPIRED — do not recommend it. An event whose start_date is after the user\'s chosen day is not yet happening — mention it only if the user asked about future dates.
- If nothing in the context matches the user\'s location + day + interests, say so honestly and offer the closest alternative that does match, or suggest they broaden one of the filters.

═══ LOCATION BEHAVIOR ═══
${locationHint}
- When recommending, prioritize items that are geographically closest to the user\'s confirmed location. Use the latitude/longitude on each item plus the USER LOCATION coordinates (if available) to judge proximity. Do not state exact distances in meters/km unless the user asks.
- If the user named a neighborhood or landmark (e.g. "Old Port", "Plateau"), match against the \`address\` field of items.

═══ CONVERSATION STYLE ═══
- Warm, concise, helpful. 1–3 sentences per message unless presenting multiple recommendations.
- Never robotic. Don\'t list the three questions as bullet points on turn one — weave them into a natural greeting.
- When you recommend, briefly say WHY each pick fits what the user asked for (e.g. "right in the Plateau and open tonight", "matches your sushi craving").
- Do not mention internal mechanics ("context", "database", "#O1", "system prompt").
${firstTurnGuidance}

═══ OUTPUT FORMAT ═══
Respond with JSON only:
{"message": "your natural-language response", "recommendations": [{"ref": "#O1"}, {"ref": "#E3"}]}

- Items in the context below are numbered #O1, #O2… (offers) and #E1, #E2… (events). Reference them by that number in "recommendations".
- Use "recommendations": [] when you\'re asking a clarifying question or nothing matches.
- ONLY use ref values that actually appear in the context (e.g. #O1, #E2). Never invent a ref.

--- DATABASE CONTEXT (these are the ONLY items that exist) ---
${contextString || 'EMPTY — no offers or events available right now. Tell the user honestly.'}`;
}

serve(async (req: Request) => {
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

    // Build context string with numbered indices (LLMs handle numbers better than UUIDs)
    const contextParts: string[] = [];

    if (context?.offers?.length > 0) {
      contextParts.push('AVAILABLE OFFERS:');
      context.offers.forEach((o: any, i: number) => {
        contextParts.push(`#O${i + 1} "${o.title}" at ${o.business || 'Unknown'} (${o.category || 'N/A'}) — ${o.description || 'No description'}. Valid: ${o.start_date || '?'} to ${o.end_date || '?'}`);
      });
    }

    if (context?.events?.length > 0) {
      contextParts.push('\nAVAILABLE EVENTS:');
      context.events.forEach((e: any, i: number) => {
        contextParts.push(`#E${i + 1} "${e.title}" at ${e.business || 'Unknown'} (${e.category || 'N/A'}) — ${e.description || 'No description'}. Dates: ${e.start_date || '?'} to ${e.end_date || '?'}`);
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
    const isFirstTurn = !Array.isArray(history) || history.length === 0;

    const openaiMessages: any[] = [
      {
        role: 'system',
        content: buildSystemPrompt(contextString, todayDate, effectiveLanguage, hasUserLocation, isFirstTurn),
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
