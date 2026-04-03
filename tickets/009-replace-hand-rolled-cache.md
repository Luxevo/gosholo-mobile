# TICKET-009: Replace hand-rolled caching with React Query / TanStack Query

**Priority:** MEDIUM
**Type:** Architecture
**Effort:** Large
**Status:** Open

## Description

Every data hook (`useOffers`, `useEvents`, `useCommerces`, `useMobileUser`) implements its own module-level cache using global variables and `Set<listener>` notification. This is a fragile reimplementation of what React Query provides, without:
- Cache invalidation / TTL
- Deduplication of in-flight requests
- Automatic refetch on focus/reconnect
- Devtools for debugging
- Stale-while-revalidate

## Affected Files

- `hooks/useOffers.ts` (lines 29-35)
- `hooks/useEvents.ts` (lines 29-35)
- `hooks/useCommerces.ts` (lines 39-46)
- `hooks/useMobileUser.ts` (lines 5-11)

## Current Pattern (repeated in each hook)

```ts
let cache: Data[] | null = null;
let cacheListeners: Set<(data: Data[]) => void> = new Set();

const notifyListeners = (data: Data[]) => {
  cache = data;
  cacheListeners.forEach(listener => listener(data));
};
```

## Expected Fix

1. Install `@tanstack/react-query`
2. Wrap the app in `QueryClientProvider`
3. Convert each hook to use `useQuery` / `useMutation`
4. Remove all module-level cache variables and listener sets

## Why It Matters

- Eliminates ~80 lines of boilerplate per hook
- Gets automatic request deduplication, background refetch, and cache invalidation for free
- The current pattern has no cache expiry — data can go stale indefinitely
- Multiple components mounting the same hook can trigger duplicate fetches
