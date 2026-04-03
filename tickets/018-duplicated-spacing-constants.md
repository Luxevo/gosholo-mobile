# TICKET-018: SPACING and border radius constants duplicated across files

**Priority:** LOW
**Type:** DRY / Cleanliness
**Effort:** Small
**Status:** Open

## Description

Similar to TICKET-004 (COLORS), the `SPACING` object and border radius values are redefined locally in many files with slightly different keys and values.

## Examples

```ts
// app/(auth)/login.tsx, register.tsx, profile.tsx, etc.
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// components/OfferCard.tsx
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 }; // missing xxl

// components/OfferCard.tsx
const RAD = { sm: 8, md: 12, lg: 16, pill: 999 };
```

## Expected Fix

Add `SPACING` and `RADIUS` to a shared `constants/Theme.ts` (or extend `constants/Colors.ts` into a full theme file). Import everywhere.

## Why It Matters

Same as TICKET-004 — inconsistency and maintenance burden. Should be addressed together with the COLORS extraction.
