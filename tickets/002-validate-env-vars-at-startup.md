# TICKET-002: Validate environment variables at startup

**Priority:** MEDIUM
**Type:** Security / DX
**Effort:** Small
**Status:** Open

## Description

The Supabase client uses non-null assertions (`!`) on environment variables. If either is missing, the app crashes deep inside the Supabase client with an opaque error instead of a clear message.

## Affected Files

- `lib/supabase.ts` (lines 4-5)

## Current Code

```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

## Expected Fix

```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}
```

## Why It Matters

Developers cloning the repo or CI environments missing `.env` will get an immediate, actionable error instead of a confusing runtime crash.
