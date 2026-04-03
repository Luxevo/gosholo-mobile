# TICKET-024: Multiple redundant auth state listeners

**Priority:** MEDIUM
**Type:** Performance / Architecture
**Effort:** Medium
**Status:** Open

## Description

At least 5 components/contexts each independently call `supabase.auth.onAuthStateChange()`:

1. `contexts/FavoritesContext.tsx` (line 135)
2. `contexts/LikesContext.tsx` (line 197)
3. `contexts/FollowsContext.tsx` (line 115)
4. `hooks/useMobileUser.ts` (line 105)
5. `app/(tabs)/profile.tsx` (line 112)

Each creates its own subscription. On every auth event (login, logout, token refresh), all 5 fire independently and each calls `supabase.auth.getUser()` — resulting in **5 parallel API calls** to check the same user.

## Expected Fix

Create a single `AuthContext` at the root level that:
1. Maintains one `onAuthStateChange` subscription
2. Exposes `user`, `session`, `isAuthenticated` to all children
3. Other contexts/hooks read from `AuthContext` instead of creating their own subscriptions

## Why It Matters

- 5x redundant auth listeners and API calls on every auth event
- Race conditions possible if listeners fire in different order
- Simplifies the mental model — one place for auth state
