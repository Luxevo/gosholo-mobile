# TICKET-013: Remove legacy type/hook aliases

**Priority:** LOW
**Type:** Cleanliness
**Effort:** Small
**Status:** Open

## Description

Two "backwards compatibility" aliases exist that add confusion without value:

1. `lib/supabase.ts:110`: `export type MobileUserProfile = UserProfile;`
2. `hooks/useMobileUser.ts:132`: `export const useMobileUser = useProfile;`

## Expected Fix

1. Search the codebase for imports of `MobileUserProfile` and `useMobileUser`
2. Replace with `UserProfile` and `useProfile`
3. Delete the alias lines

## Why It Matters

Aliases create confusion about which name is canonical. New developers won't know which to use.
