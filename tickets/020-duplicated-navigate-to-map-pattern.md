# TICKET-020: "Navigate to map" pattern duplicated across 3+ screens

**Priority:** LOW
**Type:** DRY
**Effort:** Small
**Status:** Open

## Description

The pattern for closing a modal and navigating to the compass screen with coordinates is copy-pasted across multiple screens:

```ts
onNavigateToMap={(address, coordinates) => {
  setShowModal(false);
  setSelected(null);
  setTimeout(() => {
    if (coordinates) {
      router.push({ pathname: '/compass', params: { destination: `${coordinates[0]},${coordinates[1]}`, type: 'coordinates' } });
    } else if (address) {
      router.push({ pathname: '/compass', params: { destination: address, type: 'address' } });
    }
  }, 100);
}}
```

## Affected Files

- `app/(tabs)/offers.tsx` (lines 353-380)
- `app/(tabs)/ai.tsx` (lines 386-413) — duplicated twice (offer + event modals)
- `app/(tabs)/events.tsx` (likely same pattern)

## Expected Fix

Extract a `navigateToMap(address?, coordinates?)` utility function:

```ts
export const navigateToMap = (address?: string, coordinates?: [number, number]) => {
  if (coordinates) {
    router.push({ pathname: '/compass', params: { destination: `${coordinates[0]},${coordinates[1]}`, type: 'coordinates' } });
  } else if (address) {
    router.push({ pathname: '/compass', params: { destination: address, type: 'address' } });
  }
};
```

## Why It Matters

Four copies of the same navigation logic. If the compass screen's param contract changes, all four break.
