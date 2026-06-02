---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?" or "這怎麼運作的？"
---

# Explain Code Skill

When explaining code, always include four essential elements to make complex concepts clear and memorable.

## The Four-Part Explanation Pattern

When explaining any piece of code, always follow this structure:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
3. **Walk through the code**: Explain step-by-step what happens
4. **Highlight a gotcha**: What's a common mistake or misconception?

## Quick Start Example: Explaining useEffect

### Analogy

useEffect is like setting up automatic notifications on your phone. You tell it what to watch for (dependencies), and when those things change, it runs your code (the effect). The cleanup function is like unsubscribing when you don't need notifications anymore.

### Diagram

```
Component Lifecycle
┌──────────────┐
│ Mount        │
├──────────────┤
│ useEffect    │ ← Runs after render
├──────────────┤
│ Deps change? │
│  ├─ YES      │ → Cleanup → Effect again
│  └─ NO       │ → Nothing happens
├──────────────┤
│ Unmount      │ → Final cleanup
└──────────────┘
```

### Walkthrough

```tsx
useEffect(() => {
  // 1. Runs after component renders
  const subscription = api.subscribe(userId, setData);

  // 2. Cleanup (runs before next effect or unmount)
  return () => subscription.unsubscribe();
}, [userId]); // 3. Re-run only when userId changes
```

### Gotcha

**Infinite loops**: If you update state inside useEffect without a dependency array, it creates an infinite loop. Always include a dependency array, even if it's empty `[]`.

## Common Gotchas to Explain

When explaining code, always include what NOT to do:

```tsx
// ❌ WRONG: This seems logical but breaks
const badExample = () => {
  /* ... */
};

// ✅ CORRECT: This is the right way
const goodExample = () => {
  /* ... */
};

// Explain WHY the first one breaks
```

## Analogy Library

Good analogies for common concepts:

- **useState**: Component memory (like sticky notes on your desk)
- **useEffect**: Automatic notification system
- **Props**: Function parameters for components
- **Components**: LEGO blocks that snap together
- **Promises**: IOU for a future value
- **Async/await**: Waiting in line (you pause until it's your turn)
- **Context**: Company-wide announcement board
- **Zustand**: Shared whiteboard in an office
- **Prisma relations**: Contacts in your phone (one person, many numbers)

## Learn More

For detailed examples of explaining complex concepts like Prisma relationships, Server vs Client Components, and Zustand state management, see [./references/complete-examples.md](./references/complete-examples.md).
