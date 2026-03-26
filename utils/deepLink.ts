// Synchronous in-memory deep link store — no AsyncStorage timing issues
let pendingDeepLink: { type: 'offer' | 'event'; id: string } | null = null;

export function setDeepLink(type: 'offer' | 'event', id: string) {
  pendingDeepLink = { type, id };
}

export function consumeDeepLink(expectedType: 'offer' | 'event') {
  if (pendingDeepLink && pendingDeepLink.type === expectedType) {
    const link = pendingDeepLink;
    pendingDeepLink = null;
    return link;
  }
  return null;
}
