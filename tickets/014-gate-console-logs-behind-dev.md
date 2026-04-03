# TICKET-014: Gate console logs behind __DEV__ flag

**Priority:** LOW
**Type:** Cleanliness / Performance
**Effort:** Small
**Status:** Open

## Description

Debug `console.log` and `console.error` calls are scattered throughout hooks and components. In production builds these are unnecessary, can leak sensitive context (e.g., full AI chat payloads), and have a minor performance cost.

## Examples

```ts
// hooks/useCommerces.ts:93-98
console.log('🏪 Fetching commerces...');
console.log(`🏪 Found ${data.length} commerces`);

// hooks/useAIChat.ts:148
console.log('[AI Chat] Context:', context.offers.length, 'offers,', context.events.length, 'events');

// hooks/useAIChat.ts:168
console.log('[AI Chat] Raw AI response:', JSON.stringify(data));  // <-- logs full AI response
```

## Expected Fix

Option A: Wrap in `__DEV__` checks:
```ts
if (__DEV__) console.log('🏪 Fetching commerces...');
```

Option B: Use a `babel-plugin-transform-remove-console` plugin to strip all console calls in production builds.

Option C: Create a tiny `utils/logger.ts` that no-ops in production.

## Why It Matters

- The AI chat hook logs the **full raw AI response** to console in production
- Emoji-prefixed debug logs are development noise that shouldn't ship
- Minor performance benefit from removing string concatenation in hot paths
