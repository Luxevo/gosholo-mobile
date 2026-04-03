# TICKET-003: Replace Date.now() message IDs with proper unique IDs

**Priority:** LOW
**Type:** Bug
**Effort:** Small
**Status:** Open

## Description

AI chat messages use `Date.now().toString()` as IDs. The assistant message uses `(Date.now() + 1).toString()` as a hack to avoid collisions. Two messages created within the same millisecond would still collide, causing React key warnings and potential UI bugs.

## Affected Files

- `hooks/useAIChat.ts` (lines 139, 213)

## Current Code

```ts
id: Date.now().toString(),       // user message
id: (Date.now() + 1).toString(), // assistant message (hack)
```

## Expected Fix

Use `crypto.randomUUID()` (available in React Native's Hermes engine) or a simple counter:

```ts
let messageCounter = 0;
const generateId = () => `msg_${Date.now()}_${++messageCounter}`;
```

## Why It Matters

Eliminates potential key collisions and removes the `+1` hack.
