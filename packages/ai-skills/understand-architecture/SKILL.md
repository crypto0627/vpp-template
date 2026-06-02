---
name: understand-architecture
description: Explains project architecture, design patterns, and architectural decisions. Use when explaining system design or when user asks "explain architecture" or "解釋架構".
---

When explaining architecture, always include:

1. **Visual diagram**: Use ASCII art to show structure and data flow
2. **Data flow**: How information moves through the system layers
3. **Key patterns**: Identify design patterns used (Repository, Service Layer, etc.)
4. **Technology choices**: Explain why each tech was chosen
5. **Trade-offs**: Discuss pros/cons of architectural decisions

## Quick Start Example

```
Next.js Architecture Layers:
┌──────────────────┐
│ Client Component │ ← Interactive UI
└────────↕─────────┘
┌──────────────────┐
│ Server Component │ ← Data fetching
└────────↕─────────┘
┌──────────────────┐
│   API Routes     │ ← Business logic
└────────↕─────────┘
┌──────────────────┐
│  Prisma + DB     │ ← Data persistence
└──────────────────┘
```

## Key Architecture Principles

```
Separation of Concerns:
  - UI components focus on presentation
  - Services handle business logic
  - Repositories manage data access

Single Responsibility:
  - Each function/component has one job
  - Easy to test and maintain

Progressive Enhancement:
  - Server-first (works without JS)
  - Add interactivity where needed
  - Graceful degradation
```

## Common Gotcha

**Over-engineering**: Don't add layers (services, repositories) until you actually need them. Start simple with Server Components → Prisma → Database. Add abstraction layers when patterns emerge.

## Analogy

Architecture is like city planning. You have residential areas (components), commercial districts (services), transportation routes (data flow), and utilities (infrastructure). Each part has its purpose, and they're connected in logical ways. Good architecture makes it easy to navigate and expand.

## Learn More

For complete architecture diagrams, directory structures, and pattern examples, see [./references/complete-examples.md](./references/complete-examples.md)
