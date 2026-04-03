# TICKET-017: calculateDistance duplicated a THIRD time in offers screen

**Priority:** MEDIUM
**Type:** DRY
**Effort:** Small
**Status:** Open

## Description

TICKET-005 identified `calculateDistance` duplicated in `useOffers.ts` and `useEvents.ts`. But there's a **third** copy inside the offers screen component itself.

## Affected Files

- `app/(tabs)/offers.tsx` (lines 102-112) — inline helper
- `hooks/useOffers.ts` (lines 187-197)
- `hooks/useEvents.ts` (lines 194-204)

## Why It Exists

The screen does its own client-side distance filtering (100m, 250m, 500m, 1km pills) on top of the hook's distance calculation. This means distance is calculated twice per offer: once in the hook, once in the screen.

## Expected Fix

Extract to `utils/distance.ts` (per TICKET-005) and also remove the redundant recalculation in `offers.tsx` — the hook already provides `offer.distance`, which the screen should use directly for filtering instead of recalculating.
