# TICKET-008: Fix stale closure bug in useOffers and useEvents

**Priority:** HIGH
**Type:** Bug
**Effort:** Small
**Status:** Open

## Description

In both `useOffers` and `useEvents`, the `fetchOffers`/`fetchEvents` function is wrapped in `useCallback` with deps `[userLocation, radius]`, but it reads `searchQuery` and `filterType` inside its body. When these values change, the callback reference stays the same, so it captures the **stale** values from the previous render.

The `useEffect` that calls `fetchOffers()` includes `searchQuery` and `filterType` in its deps, so it re-runs — but it calls the stale function, meaning the Supabase query uses the **old** search query.

## Affected Files

- `hooks/useOffers.ts` (lines 61-172)
- `hooks/useEvents.ts` (lines 61-179)

## Current Code

```ts
const fetchOffers = useCallback(async () => {
  // reads searchQuery (line 82) and filterType (line 140) from closure
}, [userLocation, radius]); // <-- searchQuery, filterType MISSING

useEffect(() => {
  fetchOffers(); // calls stale version
}, [fetchOffers, searchQuery, filterType]);
```

## Expected Fix

Add `searchQuery` and `filterType` to the `useCallback` dependency array:

```ts
const fetchOffers = useCallback(async () => {
  // ...
}, [userLocation, radius, searchQuery, filterType]);
```

Or remove the `useCallback` entirely since the `useEffect` already guards re-execution.

## Why It Matters

This is an active bug. Search filtering may appear to work (the effect fires) but actually sends the previous query to Supabase. Users may see stale/wrong results when searching.
