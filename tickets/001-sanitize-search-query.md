# TICKET-001: Sanitize search query input in Supabase filters

**Priority:** HIGH
**Type:** Security
**Effort:** Small
**Status:** Open

## Description

The `searchQuery` parameter is interpolated directly into PostgREST `.or()` filter strings without any sanitization. A crafted input could manipulate the filter logic.

## Affected Files

- `hooks/useOffers.ts` (line 82)
- `hooks/useEvents.ts` (line 82)

## Current Code

```ts
offersQuery = offersQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
```

## Expected Fix

Escape or strip special PostgREST filter characters (commas, dots, parentheses) from `searchQuery` before interpolating. For example:

```ts
const sanitized = searchQuery.replace(/[,.*()]/g, '');
offersQuery = offersQuery.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
```

Alternatively, use individual `.ilike()` calls chained with `.or` to avoid string interpolation entirely.

## Why It Matters

A user typing `,id.eq.` or similar could inject additional filter conditions, potentially exposing data that should be filtered out.
