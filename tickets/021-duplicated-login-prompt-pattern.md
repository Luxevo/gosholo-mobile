# TICKET-021: Duplicated "login required" Alert pattern

**Priority:** LOW
**Type:** DRY
**Effort:** Small
**Status:** Open

## Description

The same Alert.alert pattern for prompting login on favorite/like actions is copy-pasted in multiple screens:

```ts
if (result.needsLogin) {
  Alert.alert(
    t('login_required'),
    t('login_to_access_features'),
    [
      { text: t('cancel'), style: 'cancel' },
      { text: t('login'), onPress: () => router.push('/(auth)/login') }
    ]
  );
}
```

## Affected Files

- `app/(tabs)/offers.tsx` (lines 193-200, 211-219) — twice (favorite + like)
- `app/(tabs)/events.tsx` — same pattern
- Likely compass.tsx as well

## Expected Fix

Extract a `promptLogin(t)` or `showLoginAlert(t)` utility:

```ts
export const showLoginAlert = (t: TFunction) => {
  Alert.alert(
    t('login_required'),
    t('login_to_access_features'),
    [
      { text: t('cancel'), style: 'cancel' },
      { text: t('login'), onPress: () => router.push('/(auth)/login') }
    ]
  );
};
```

## Why It Matters

Minor but adds up — 4-6 copies of the same 8-line block.
