# TICKET-022: Map marker components duplicate iOS/Android branches

**Priority:** LOW
**Type:** DRY
**Effort:** Medium
**Status:** Open

## Description

In `compass.tsx`, there are 4 marker components (`CommerceMarker`, `ClusteredMarker`, `OfferMarker`, `EventMarker`) that each duplicate the same iOS vs Android branching pattern:

```ts
if (isAndroid) {
  return <PointAnnotation ...>  // Android
} else {
  return <MarkerView ...>       // iOS with TouchableOpacity + boost glow
}
```

Each marker has ~50-60 lines, with the platform logic accounting for most of the code. The four markers total ~300 lines of mostly structural duplication.

## Affected Files

- `app/(tabs)/compass.tsx` (lines 96-357)

## Expected Fix

Create a generic `PlatformMarker` component that handles the iOS/Android branching once:

```tsx
function PlatformMarker({ id, coordinate, isBoosted, onPress, children }) {
  if (Platform.OS === 'android') {
    return <PointAnnotation ...>{children}</PointAnnotation>;
  }
  return <MarkerView ...><TouchableOpacity ...>{children}</TouchableOpacity></MarkerView>;
}
```

Each specific marker becomes a thin wrapper that passes its icon/content as children.

## Why It Matters

Part of the compass.tsx decomposition (TICKET-011). Reduces ~300 lines to ~120.
