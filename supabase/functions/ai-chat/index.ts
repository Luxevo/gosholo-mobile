import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Postal FSA (first 3 chars) → neighborhood name for Quebec
const FSA_TO_NEIGHBORHOOD: Record<string, string> = {
  // ─── Montréal : Plateau / Mile End ──────────────────────────
  'H2J': 'Plateau-Mont-Royal', 'H2L': 'Plateau-Mont-Royal',
  'H2T': 'Mile End / Plateau-Mont-Royal', 'H2W': 'Plateau-Mont-Royal',
  'H2X': 'Plateau-Mont-Royal', 'H2K': 'Plateau-Mont-Royal',
  // ─── Villeray / Saint-Michel / Parc-Extension ───────────────
  'H2P': 'Villeray', 'H2R': 'Villeray', 'H2N': 'Saint-Michel', 'H3N': 'Parc-Extension',
  // ─── Rosemont / La Petite-Patrie ────────────────────────────
  'H2E': 'Rosemont / La Petite-Patrie',
  'H2G': 'Rosemont', 'H2H': 'Rosemont', 'H2S': 'Rosemont',
  'H1X': 'Rosemont', 'H1Y': 'Rosemont',
  // ─── Hochelaga-Maisonneuve / Mercier / Centre-Sud ───────────
  'H1K': 'Mercier', 'H1L': 'Hochelaga-Maisonneuve',
  'H1V': 'Hochelaga-Maisonneuve', 'H1W': 'Hochelaga-Maisonneuve',
  'H1A': 'Pointe-aux-Trembles',
  // ─── Ahuntsic / Cartierville ────────────────────────────────
  'H2A': 'Ahuntsic', 'H2B': 'Bordeaux-Cartierville',
  'H2C': 'Ahuntsic', 'H2M': 'Ahuntsic', 'H3L': 'Ahuntsic', 'H3M': 'Cartierville',
  // ─── Centre-ville / Vieux-Montréal / Griffintown ────────────
  'H2Y': 'Vieux-Montréal', 'H2Z': 'Centre-ville',
  'H3A': 'Centre-ville', 'H3B': 'Centre-ville', 'H3C': 'Griffintown', 'H3G': 'Centre-ville',
  // ─── Outremont / CDN / NDG / Westmount / Mont-Royal ─────────
  'H2V': 'Outremont', 'H3H': 'Shaughnessy Village',
  'H3P': 'Mont-Royal / Côte-des-Neiges',
  'H3S': 'Côte-des-Neiges', 'H3T': 'Côte-des-Neiges', 'H3V': 'Côte-des-Neiges',
  'H3W': 'Côte-Saint-Luc', 'H3X': 'NDG', 'H3Y': 'Westmount', 'H3Z': 'Westmount',
  'H4A': 'NDG', 'H4B': 'NDG', 'H4P': 'Côte-des-Neiges',
  // ─── Saint-Henri / Verdun / LaSalle ─────────────────────────
  'H3J': 'Saint-Henri', 'H3K': 'Pointe-Saint-Charles', 'H4C': 'Saint-Henri',
  'H4E': 'Verdun', 'H4G': 'Verdun', 'H4H': 'Verdun',
  'H8N': 'LaSalle', 'H8P': 'LaSalle', 'H8R': 'LaSalle', 'H8S': 'LaSalle', 'H8T': 'LaSalle',
  // ─── Saint-Laurent ──────────────────────────────────────────
  'H4J': 'Saint-Laurent', 'H4K': 'Saint-Laurent', 'H4L': 'Saint-Laurent',
  'H4M': 'Saint-Laurent', 'H4N': 'Saint-Laurent',
  'H4R': 'Saint-Laurent', 'H4S': 'Saint-Laurent',
  // ─── Pierrefonds / West Island ──────────────────────────────
  'H8Y': 'Pierrefonds', 'H8Z': 'Pierrefonds',
  'H9A': 'Dollard-des-Ormeaux', 'H9B': 'Dollard-des-Ormeaux',
  'H9G': 'Kirkland', 'H9H': 'Kirkland', 'H9J': 'Pierrefonds',
  'H9P': 'Dollard-des-Ormeaux', 'H9R': 'Pointe-Claire', 'H9S': 'Pointe-Claire',
  // ─── Laval ──────────────────────────────────────────────────
  'H7A': 'Laval', 'H7B': 'Pont-Viau (Laval)', 'H7C': 'Pont-Viau (Laval)',
  'H7E': 'Laval-des-Rapides (Laval)', 'H7G': 'Laval-des-Rapides (Laval)',
  'H7H': 'Pont-Viau (Laval)', 'H7J': 'Laval-Ouest (Laval)',
  'H7K': 'Laval-des-Rapides (Laval)', 'H7L': 'Sainte-Rose (Laval)',
  'H7M': 'Sainte-Rose (Laval)', 'H7N': 'Vimont (Laval)', 'H7P': 'Duvernay (Laval)',
  'H7R': 'Sainte-Rose (Laval)', 'H7S': 'Saint-Vincent-de-Paul (Laval)',
  'H7T': 'Sainte-Dorothée (Laval)', 'H7V': 'Laval', 'H7W': 'Laval',
  'H7X': 'Laval', 'H7Y': 'Laval',
  // ─── Longueuil / Rive-Sud ───────────────────────────────────
  'J4G': 'Vieux-Longueuil', 'J4H': 'Vieux-Longueuil', 'J4J': 'Vieux-Longueuil',
  'J4K': 'Vieux-Longueuil', 'J4L': 'Vieux-Longueuil', 'J4M': 'Vieux-Longueuil',
  'J4N': 'Longueuil', 'J4P': 'Saint-Hubert (Longueuil)', 'J4T': 'Saint-Hubert (Longueuil)',
  'J4V': 'LeMoyne (Longueuil)', 'J4W': 'Greenfield Park (Longueuil)',
  'J4X': 'Greenfield Park (Longueuil)', 'J4Y': 'Brossard', 'J4Z': 'Brossard',
  'J3E': 'Boucherville', 'J4B': 'Boucherville', 'J3G': 'Varennes', 'J3X': 'Varennes',
  // ─── Rive-Sud éloignée ──────────────────────────────────────
  'J5A': 'Saint-Constant', 'J5R': 'Candiac',
  'J3L': 'Chambly', 'J5Z': 'Repentigny',
  // ─── Couronne Nord ──────────────────────────────────────────
  'J6V': 'Terrebonne', 'J6W': 'Terrebonne', 'J6Y': 'Terrebonne',
  'J7A': 'Rosemère', 'J7C': 'Blainville',
  'J7N': 'Saint-Eustache', 'J7Z': 'Saint-Jérôme',
  'J7J': 'Mirabel',
  // ─── Estrie / autres ────────────────────────────────────────
  'J2N': 'Farnham',
  // ─── Québec (Ville) ─────────────────────────────────────────
  'G1E': 'Beauport (Québec)', 'G1G': 'Beauport (Québec)',
  'G1H': 'Limoilou (Québec)', 'G1J': 'Limoilou (Québec)',
  'G1K': 'Vieux-Québec / Saint-Jean-Baptiste',
  'G1L': 'Saint-Roch (Québec)', 'G1M': 'Sainte-Foy (Québec)',
  'G1N': 'Sainte-Foy (Québec)', 'G1P': 'Sainte-Foy (Québec)',
  'G1R': 'Haute-Ville / Vieux-Québec', 'G1S': 'Sainte-Foy (Québec)',
  'G1T': 'Sainte-Foy (Québec)', 'G1V': 'Sainte-Foy / Sillery (Québec)',
  'G1W': 'Sillery (Québec)', 'G1X': 'Sainte-Foy (Québec)',
  'G2A': 'Charlesbourg (Québec)', 'G2B': 'Charlesbourg (Québec)',
  'G2C': 'Charlesbourg (Québec)', 'G2E': 'Sainte-Foy (Québec)',
  'G2G': 'Charlesbourg (Québec)', 'G2J': 'Charlesbourg (Québec)',
  'G2K': 'Beauport (Québec)', 'G2L': 'Beauport (Québec)',
  'G2M': 'Beauport (Québec)', 'G2N': 'Beauport (Québec)', 'G3A': 'Cap-Rouge (Québec)',
  // ─── Gatineau ───────────────────────────────────────────────
  'J8P': 'Gatineau (Hull)', 'J8T': 'Gatineau (Aylmer)',
  'J8X': 'Gatineau (Hull)', 'J8Y': 'Gatineau (Hull)', 'J8Z': 'Gatineau (Hull)',
  'J9A': 'Buckingham (Gatineau)', 'J9H': 'Gatineau (Aylmer)', 'J9J': 'Gatineau',
  // ─── Sherbrooke ─────────────────────────────────────────────
  'J1H': 'Sherbrooke', 'J1J': 'Sherbrooke', 'J1K': 'Sherbrooke', 'J1L': 'Sherbrooke',
  // ─── Trois-Rivières ─────────────────────────────────────────
  'G8T': 'Trois-Rivières', 'G8V': 'Trois-Rivières', 'G8W': 'Trois-Rivières',
  'G8Y': 'Trois-Rivières', 'G8Z': 'Trois-Rivières', 'G9A': 'Trois-Rivières',
  // ─── Saguenay ───────────────────────────────────────────────
  'G7H': 'Chicoutimi (Saguenay)', 'G7J': 'Jonquière (Saguenay)',
  'G7K': 'Jonquière (Saguenay)', 'G7X': 'Chicoutimi (Saguenay)',
};

function getNeighborhood(postalCode?: string | null, address?: string | null): string | null {
  let fsa: string | null = null;

  // Address comes from Mapbox geocoder and is reliable — use it first
  if (address) {
    const m = address.match(/\b([A-Za-z]\d[A-Za-z])\s*\d[A-Za-z]\d\b/);
    if (m) fsa = m[1].toUpperCase();
  }

  // Fall back to postal_code column only if address has no postal code
  if (!fsa && postalCode) {
    fsa = postalCode.replace(/\s/g, '').substring(0, 3).toUpperCase();
  }

  return fsa ? (FSA_TO_NEIGHBORHOOD[fsa] ?? null) : null;
}

function computeWeekendDates(todayStr: string): { dayNameEn: string; saturdayDate: string; sundayDate: string } {
  const today = new Date(todayStr + 'T12:00:00Z');
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 6=Sat
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Days until next Saturday (0 if today IS Saturday)
  const daysToSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
  const satDate = new Date(today);
  satDate.setUTCDate(today.getUTCDate() + daysToSat);

  const sunDate = new Date(satDate);
  sunDate.setUTCDate(satDate.getUTCDate() + 1);

  return {
    dayNameEn: dayNamesEn[dayOfWeek],
    saturdayDate: satDate.toISOString().split('T')[0],
    sundayDate: sunDate.toISOString().split('T')[0],
  };
}

function buildSystemPrompt(
  contextString: string,
  todayDate: string,
  dayNameEn: string,
  saturdayDate: string,
  sundayDate: string,
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
2. WHEN — ask what day or time window they're thinking about (today, tonight, this weekend, a specific date). Skip this step only if the user's first message already states a clear time (e.g. "coffee right now", "events this Saturday").
3. INTERESTS — if their first message is vague ("anything fun", "recommend something"), ask what they're in the mood for (food type, activity, indoor/outdoor, budget). Skip this if the user already said what they want (e.g. "sushi", "live music").
Keep the greeting warm and brief — ask only what's actually missing. Do NOT make recommendations on the first turn unless the user's message already answered all three points. When asking questions, return an empty recommendations array.`
    : `\nYou are mid-conversation. Use everything the user has already told you (their location, day, preferences) to recommend.
- If the user says they moved or mentions a different location ("I'm actually in Laval now", "what about near Old Port?"), update your understanding and recommend from there.
- If you still don't know their location or the time window and it matters for the query, ask for the missing piece — don't guess.`;

  return `You are GoSholo AI, a warm, friendly, and sharp local-discovery assistant for GoSholo, an app helping people discover businesses, offers, and events in Canada.

TODAY IS ${todayDate} (${dayNameEn}). THIS WEEKEND = ${saturdayDate} (Saturday) and ${sundayDate} (Sunday).
When the user says "fin de semaine", "ce weekend", "this weekend", or similar: the relevant dates are ${saturdayDate} and ${sundayDate} ONLY.

${langInstruction}

═══ HARD CONSTRAINTS ═══
- YOU CAN ONLY RECOMMEND ITEMS LISTED IN "DATABASE CONTEXT" below. Never invent, fabricate, or hallucinate an offer, event, business, or ID.
- Respect dates strictly. Only recommend offers/events whose start_date..end_date window includes the day the user is asking about.
- DAY-OF-WEEK RULE: If an event title or description contains a French day name (lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche), the event ONLY occurs on that weekday. Example: "Lundi Quiz Musical" happens on Mondays only — NEVER recommend it for a weekend or any other day. Match the implied weekday to the user's requested day before recommending.
- If nothing matches the user's location + day + interests, say so honestly and offer the closest alternative or suggest broadening a filter.

═══ LOCATION BEHAVIOR ═══
${locationHint}
- Each item in the context has a "Quartier:" field showing its neighborhood. When the user mentions a neighborhood (e.g. "Villeray", "Plateau", "Rosemont"), match DIRECTLY against the Quartier field. A match is definitive — do not second-guess it or call it "nearby".
- If an item has no Quartier field, fall back to checking its address.
- List ALL matching items in one response — never hold back results.

═══ CONVERSATION STYLE ═══
- Warm, concise, helpful. 1–3 sentences per message unless presenting multiple recommendations.
- Never robotic. Don't list questions as bullet points on turn one — weave them into a natural greeting.
- When you recommend, briefly say WHY each pick fits what the user asked for.
- Do not mention internal mechanics ("context", "database", "#O1", "system prompt", "Quartier field").
- NEVER use markdown formatting. No **bold**, no *italic*, no # headers, no bullet points with dashes or asterisks. Plain text only.
${firstTurnGuidance}

═══ OUTPUT FORMAT ═══
Respond with JSON only, no markdown:
{"message": "your natural-language response", "recommendations": [{"ref": "#O1"}, {"ref": "#E3"}]}

- Items are numbered #O1, #O2… (offers) and #E1, #E2… (events). Reference them by that number.
- Use "recommendations": [] when asking a clarifying question or nothing matches.
- ONLY use ref values that appear in the context. Never invent a ref.

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

    // Build context string with numbered indices and neighborhood info
    const contextParts: string[] = [];

    if (context?.offers?.length > 0) {
      contextParts.push('AVAILABLE OFFERS:');
      context.offers.forEach((o: any, i: number) => {
        const neighborhood = getNeighborhood(o.postal_code, o.address);
        const quartier = neighborhood ? ` Quartier: ${neighborhood}.` : '';
        const addr = o.address ? ` Adresse: ${o.address}.` : '';
        contextParts.push(
          `#O${i + 1} "${o.title}" at ${o.business || 'Unknown'} (${o.category || 'N/A'}) — ${o.description || 'No description'}. Valid: ${o.start_date || '?'} to ${o.end_date || '?'}.${quartier}${addr}`
        );
      });
    }

    if (context?.events?.length > 0) {
      contextParts.push('\nAVAILABLE EVENTS:');
      context.events.forEach((e: any, i: number) => {
        const neighborhood = getNeighborhood(e.postal_code, e.address);
        const quartier = neighborhood ? ` Quartier: ${neighborhood}.` : '';
        const addr = e.address ? ` Adresse: ${e.address}.` : '';
        contextParts.push(
          `#E${i + 1} "${e.title}" at ${e.business || 'Unknown'} (${e.category || 'N/A'}) — ${e.description || 'No description'}. Dates: ${e.start_date || '?'} to ${e.end_date || '?'}.${quartier}${addr}`
        );
      });
    }

    if (context?.userLocation) {
      contextParts.push(`\nUSER LOCATION: lat ${context.userLocation.latitude}, lng ${context.userLocation.longitude}`);
    }

    const contextString = contextParts.join('\n');

    // Build system prompt
    const todayDate = new Date().toISOString().split('T')[0];
    const { dayNameEn, saturdayDate, sundayDate } = computeWeekendDates(todayDate);
    const effectiveLanguage = (language === 'en' || language === 'fr') ? language : 'fr';
    const hasUserLocation = !!(context?.userLocation);
    const isFirstTurn = !Array.isArray(history) || history.length === 0;

    const openaiMessages: any[] = [
      {
        role: 'system',
        content: buildSystemPrompt(
          contextString,
          todayDate,
          dayNameEn,
          saturdayDate,
          sundayDate,
          effectiveLanguage,
          hasUserLocation,
          isFirstTurn
        ),
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
        model: 'gpt-4o',
        messages: openaiMessages,
        temperature: 0.3,
        max_tokens: 1500,
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
