# TICKET-011: Decompose compass.tsx (2,467-line god component)

**Priority:** MEDIUM
**Type:** Architecture / Maintainability
**Effort:** Large
**Status:** Open

## Description

`app/(tabs)/compass.tsx` is a 2,467-line monolith handling:
- Map rendering with Mapbox
- Marker clustering and rendering (platform-specific)
- Search overlay for addresses and businesses
- Turn-by-turn navigation with voice guidance
- Route alternatives and traffic-aware routing
- Multiple routing profiles (driving, walking, cycling)
- Business detail modal
- Offer detail modal
- Event detail modal
- Location picker
- Deep link handling
- Category filtering

This makes the file extremely hard to navigate, debug, or modify safely.

## Affected Files

- `app/(tabs)/compass.tsx` (2,467 lines)

## Expected Fix

Extract into focused modules:

1. **`hooks/useMapNavigation.ts`** — Route fetching, step tracking, voice guidance, ETA calculation
2. **`hooks/useMapMarkers.ts`** — Marker clustering, commerce marker data preparation
3. **`components/map/MapMarkers.tsx`** — Platform-specific marker rendering (the `CommerceMarker` and `ClusterMarker` components)
4. **`components/map/NavigationPanel.tsx`** — Navigation UI (banner, bottom sheet, route alternatives)
5. **`components/map/MapSearchOverlay.tsx`** — Address/business search on the map

The screen file should orchestrate these pieces at ~300-400 lines max.

## Why It Matters

A single change (e.g., tweaking marker appearance) currently requires navigating a 2,467-line file. Risk of introducing regressions is high. Code review is painful.
