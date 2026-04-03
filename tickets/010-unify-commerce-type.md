# TICKET-010: Unify Commerce type — currently defined in 3 places

**Priority:** MEDIUM
**Type:** Cleanliness / Type Safety
**Effort:** Small
**Status:** Open

## Description

The `Commerce` type is defined in three separate locations with different fields and shapes. They drift out of sync as features are added.

## Affected Files

- `lib/supabase.ts` (line 17) — `export type Commerce` with hardcoded category union
- `hooks/useCommerces.ts` (line 4) — `export interface Commerce` with different nullable fields
- `hooks/useOffers.ts` (line 5) / `hooks/useEvents.ts` (line 5) — inline `commerces: { ... }` shape

## Differences

| Field | supabase.ts | useCommerces.ts | useOffers inline |
|-------|-------------|-----------------|-----------------|
| category | Hardcoded union | `{ name_en, name_fr }` | `{ name_en, name_fr }` |
| sub_category | Missing | Present | Missing |
| like_count | Missing | Present | Missing |
| follower_count | Missing | Present | Missing |
| linkedin_url | Missing | Present | Missing |

## Expected Fix

1. Define one canonical `Commerce` type (ideally generated from Supabase schema with `supabase gen types typescript`)
2. Import it everywhere
3. For partial/joined shapes, use `Pick<Commerce, ...>` or a specific query result type

## Why It Matters

Type mismatches cause runtime surprises. The hardcoded category union in `supabase.ts` is already wrong — the DB has 106 categories, not 12.
