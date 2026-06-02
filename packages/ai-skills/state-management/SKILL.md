---
name: state-management
description: Manages application state with Zustand, React Context, and Server State patterns. Use when handling global state or when user asks "manage state" or "狀態管理".
---

When managing state, always consider:

1. **Choose the right tool**: Pick appropriate state management based on scope and use case
2. **Minimize global state**: Keep state as local as possible (prefer useState)
3. **Type-safe**: Use TypeScript for all state stores and context
4. **Persist when needed**: Use localStorage/sessionStorage for user preferences
5. **Optimize rerenders**: Prevent unnecessary updates by subscribing to specific slices

## Quick Start Example

```typescript
// Zustand store for global state
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "user-storage" },
  ),
);

// Usage: Subscribe to specific slice
const user = useUserStore((state) => state.user);
const logout = useUserStore((state) => state.logout);
```

## State Management Decision Tree

```
Is it server data? (API responses, DB data)
  YES → Use Server Components / SWR / React Query
  NO  ↓

Is it needed by multiple distant components?
  YES → Use Zustand or Context
  NO  ↓

Is it UI state (forms, toggles, etc)?
  YES → Use useState in component
  NO  ↓

Is it URL-dependent (filters, pagination)?
  YES → Use URL search params
```

## State Management Best Practices

```
Choose the Right Tool:
  ☐ useState for local UI state
  ☐ Zustand for global app state
  ☐ Context for theme, i18n, auth
  ☐ URL params for filters, pagination
  ☐ Server Components for data fetching

Optimization:
  ☐ Split stores by domain (user, cart, settings)
  ☐ Subscribe to specific slices in Zustand
  ☐ Memoize expensive selectors
  ☐ Avoid storing derived state

Persistence:
  ☐ Use Zustand persist middleware
  ☐ Store auth tokens securely
  ☐ Clear sensitive data on logout
  ☐ Sync across tabs when needed
```

## Common Gotcha

**Over-globalizing state**: Don't put everything in global state. Ask: "Do multiple distant components need this?" If no, keep it local with useState.

## Analogy

State management is like organizing your home. Some things belong in your pocket (local state), some on the kitchen counter where everyone can reach (global state), some need to be written down (persisted state), and some should just be looked up when needed (server state).

## Learn More

For complete state management examples (Zustand, Context, URL state), see [./references/complete-examples.md](./references/complete-examples.md)
