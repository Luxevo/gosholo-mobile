# TICKET-005: Extract duplicated calculateDistance to utils

**Priority:** MEDIUM
**Type:** DRY
**Effort:** Small
**Status:** Open

## Description

The Haversine distance formula is copy-pasted verbatim in two hooks. Any bug fix or improvement must be applied twice.

## Affected Files

- `hooks/useOffers.ts` (lines 187-197)
- `hooks/useEvents.ts` (lines 194-204)

## Current Code (identical in both files)

```ts
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

## Expected Fix

1. Create `utils/distance.ts` with the single `calculateDistance` function
2. Import it in both hooks
3. Delete the local copies

## Why It Matters

Single source of truth for distance calculation. If you ever need to adjust precision or add unit options, it's one change.
