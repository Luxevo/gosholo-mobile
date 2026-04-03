# TICKET-007: Unify Favorites/Likes/Follows into a generic toggle context

**Priority:** LOW
**Type:** DRY / Abstraction
**Effort:** Medium
**Status:** Open

## Description

`FavoritesContext`, `LikesContext`, and `FollowsContext` all implement the same pattern:
- Fetch user's items on mount
- Listen to auth state changes
- Optimistic toggle with rollback on error
- `useMemo` for the context value

The structural code is nearly identical across all three. A generic `createToggleContext()` factory could eliminate the repetition.

## Affected Files

- `contexts/FavoritesContext.tsx` (169 lines)
- `contexts/LikesContext.tsx` (234 lines)
- `contexts/FollowsContext.tsx` (149 lines)

## Expected Fix

Create a `createToggleContext` factory that accepts:
- Table name(s) and column mapping
- Optional RPC calls for count updates (likes/follows have `increment_*`/`decrement_*`)

Each context becomes a thin wrapper: ~10 lines calling the factory.

## Why It Matters

~550 lines reduced to ~200 + three thin wrappers. Consistent behavior guaranteed across all three social features.
