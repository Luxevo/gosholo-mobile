# TICKET-006: Unify useOffers and useEvents into a generic hook

**Priority:** MEDIUM
**Type:** DRY / Abstraction
**Effort:** Medium
**Status:** Open

## Description

`useOffers` and `useEvents` are ~90% identical. Both implement:
- Module-level cache with listener pattern
- Fetch from Supabase with active/expiry filters
- Join with commerces table
- Calculate distance using Haversine
- Sort by distance
- Same loading/error/refetch state

The only differences are table name, a few filter options (date filters for events), and sort order.

## Affected Files

- `hooks/useOffers.ts` (184 lines)
- `hooks/useEvents.ts` (204 lines)

## Expected Fix

Create a generic `useListWithCommerce<T>` hook or factory function parameterized by:
- Table name (`'offers'` | `'events'`)
- Extra filter logic (date filtering for events)
- Sort configuration

Both `useOffers` and `useEvents` become thin wrappers around the shared hook.

## Why It Matters

~370 lines of near-identical code reduced to ~200 + two small wrappers. Bug fixes (like TICKET-008 stale closure) only need to be applied once.
