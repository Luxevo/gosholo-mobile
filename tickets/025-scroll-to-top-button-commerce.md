# TICKET-025: Add scroll-to-top button on Commerce (Home) page

**Priority:** LOW
**Type:** UX
**Effort:** Small
**Status:** Open

## Description

The Commerce page (`app/(tabs)/index.tsx`) uses a `SectionList` with alphabetical grouping. When the user scrolls far down the list, there's no quick way to get back to the top. Add a floating "scroll to top" arrow button that appears when the user scrolls past a threshold.

## Expected Behavior

- Button appears after scrolling down ~300px
- Positioned bottom-right, above the tab bar
- Tapping it scrolls the list to the top with animation
- Fades in/out smoothly
- Uses an up-arrow icon (e.g. `chevron.up` or `arrow.up`)
- Styled with brand teal (`#016167`) or primary orange (`#FF6233`)

## Implementation Notes

- Track scroll position via `onScroll` on the `SectionList`
- Use `scrollToLocation({ sectionIndex: 0, itemIndex: 0 })` or `scrollTo({ y: 0 })`
- Use `Animated.Value` for fade in/out opacity
- Position with `position: 'absolute'` to float over the list

## Affected Files

- `app/(tabs)/index.tsx`
