# TICKET-023: OfferCard has hardcoded pixel widths per platform

**Priority:** LOW
**Type:** UX / Responsiveness
**Effort:** Small
**Status:** Open

## Description

The OfferCard uses hardcoded pixel widths that don't adapt to screen size:

```ts
// components/OfferCard.tsx:180
width: Platform.OS === 'android' ? 320 : 336,
alignSelf: 'center',
```

On smaller devices (iPhone SE) or larger tablets/foldables, the card either overflows or wastes space.

## Expected Fix

Use a percentage-based or `Dimensions`-relative width:

```ts
width: Math.min(Dimensions.get('window').width - 32, 360),
```

Or use `flex` with horizontal padding on the parent container.

## Why It Matters

The app supports various device sizes. Hardcoded pixels look wrong on anything other than a standard phone.
