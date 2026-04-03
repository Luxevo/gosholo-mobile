# TICKET-012: Rename/merge confusing deep link utility files

**Priority:** LOW
**Type:** Cleanliness
**Effort:** Small
**Status:** Open

## Description

Two files with nearly identical names do completely different things:

- `utils/deepLink.ts` — In-memory pending deep link store (set/consume pattern)
- `utils/deepLinks.ts` — URL generation and share sheet utilities

The naming makes it unclear which to import.

## Affected Files

- `utils/deepLink.ts` (15 lines)
- `utils/deepLinks.ts` (78 lines)

## Expected Fix

Option A: Rename for clarity
- `utils/deepLink.ts` -> `utils/pendingDeepLink.ts`
- `utils/deepLinks.ts` -> `utils/shareLinks.ts`

Option B: Merge into a single `utils/deepLinks.ts` since both are small and related.

## Why It Matters

Developer confusion. When you need deep link functionality, it's a coin flip which file to open.
