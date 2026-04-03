# TICKET-015: Remove `as any` type casts and add proper types

**Priority:** LOW
**Type:** Type Safety
**Effort:** Small
**Status:** Open

## Description

Several `as any` casts are used to work around TypeScript errors instead of properly typing the data. This defeats TypeScript's purpose and hides potential bugs.

## Examples

```ts
// hooks/useAIChat.ts:84
category: (c.category as any)?.name_en,

// utils/deepLinks.ts:66
const shareOptions: any = { ... };
```

## Expected Fix

- For `useAIChat.ts`: Type the `commercesMap` properly with the Supabase query result shape instead of `Record<string, any>`
- For `deepLinks.ts`: Use the proper `ShareOptions` type from `react-native-share`

## Why It Matters

`as any` hides type errors that could surface as runtime bugs. Proper typing enables IDE autocomplete and catch mistakes at compile time.
