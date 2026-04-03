# TICKET-016: Remove hardcoded category union type

**Priority:** MEDIUM
**Type:** Type Safety
**Effort:** Small
**Status:** Open

## Description

The `Commerce` type in `lib/supabase.ts` has a hardcoded union of 12 category strings, but the database has 106 categories. This type is already wrong and will become more wrong over time.

## Affected Files

- `lib/supabase.ts` (line 22)

## Current Code

```ts
category: 'Restaurant' | 'Café' | 'Boulangerie' | 'Épicerie' | 'Commerce' | 'Service' | 'Santé' | 'Beauté' | 'Sport' | 'Culture' | 'Éducation' | 'Autre';
```

## Expected Fix

Since the app uses `category_id` (FK) with a joined category table providing `name_en`/`name_fr`, this field should be:

```ts
category_id: number | null;
```

The old `category` string field appears to be a leftover from before the category table was introduced. If it still exists in the DB, type it as `string`. If not, remove it entirely.

Ideally, run `supabase gen types typescript` to generate all types from the actual schema (see TICKET-010).

## Why It Matters

The hardcoded union gives a false sense of type safety. Any commerce with a category not in the list will cause TypeScript errors despite being valid data.
