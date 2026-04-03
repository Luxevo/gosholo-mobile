# TICKET-019: Profile screen uses `any` for modal state and duplicates fetch logic

**Priority:** MEDIUM
**Type:** Type Safety / DRY
**Effort:** Medium
**Status:** Open

## Description

The profile screen has three sets of modal state typed as `any`:

```ts
// app/(tabs)/profile.tsx:102-107
const [selectedOffer, setSelectedOffer] = useState<any>(null);
const [selectedEvent, setSelectedEvent] = useState<any>(null);
const [selectedCommerce, setSelectedCommerce] = useState<any>(null);
```

And the `handleItemPress` function (lines 234-296) fetches full item data from Supabase by doing sequential queries (item + commerce join) — the exact same pattern that exists in `ai.tsx:196-230`.

## Expected Fix

1. Type the modal state properly (`OfferWithCommerce | null`, etc.)
2. Extract the "fetch item + commerce for modal" logic into a shared utility or hook (used by both `profile.tsx` and `ai.tsx`)

## Why It Matters

- `any` types hide bugs — if the modal component's props change, TypeScript won't catch the mismatch
- The fetch-for-modal logic is duplicated between profile and AI screens
