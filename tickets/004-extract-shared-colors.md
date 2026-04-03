# TICKET-004: Extract shared COLORS constant — eliminate 34 local copies

**Priority:** MEDIUM
**Type:** Cleanliness / Maintainability
**Effort:** Medium
**Status:** Open

## Description

There are 34 files that each define their own local `COLORS` object, with slightly different values across files. Meanwhile, `constants/Colors.ts` exports `AppColors` that is rarely used directly by screens or components.

## Affected Files

All 34 files with `const COLORS = {`, including:
- `app/(tabs)/index.tsx`, `offers.tsx`, `events.tsx`, `compass.tsx`, `profile.tsx`, `ai.tsx`
- `app/(auth)/login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`
- `components/OfferCard.tsx`, `EventCard.tsx`, `BusinessDetailModal.tsx`, etc.
- `components/shared/AppHeader.tsx`, `SearchBar.tsx`, etc.

## Current State

- `constants/Colors.ts` — exports `AppColors` (base palette) and `Colors` (themed light/dark)
- Each file redefines: `const COLORS = { primary: '#FF6233', teal: '#016167', ... }`
- Some files add extra colors like `ink: '#111827'`, `lightGray: '#9CA3AF'`, `error: '#EF4444'` that don't exist in `AppColors`

## Expected Fix

1. Extend `AppColors` in `constants/Colors.ts` with all missing colors (`ink`, `lightGray`, `error`, `success`, etc.)
2. Export a single flat `COLORS` constant from that file
3. Replace all 34 local `COLORS` definitions with `import { COLORS } from '@/constants/Colors'`

## Why It Matters

Changing a brand color currently requires editing 34 files. Inconsistent color values across screens create subtle visual bugs.
