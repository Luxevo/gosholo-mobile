/**
 * Normalize text for accent-insensitive search
 * Removes diacritical marks (accents) from text
 * e.g., "café" -> "cafe", "Montréal" -> "Montreal"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Check if text contains the search query (accent-insensitive)
 */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return normalizeText(text).includes(normalizeText(query));
}
