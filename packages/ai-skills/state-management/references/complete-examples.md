---
name: state-management
description: Manages application state with Zustand, React Context, and Server State patterns. Use when handling global state or when user asks "manage state" or "狀態管理".
---

When managing state, always consider:

1. **Choose the right tool**: Local state vs global state vs server state
2. **Minimize global state**: Keep state as local as possible
3. **Type-safe**: Use TypeScript for state management
4. **Persist when needed**: Use localStorage/sessionStorage
5. **Optimize rerenders**: Prevent unnecessary updates

## State Management Decision Tree

```
Is it server data? (API responses, DB data)
  YES → Use React Query / SWR
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

## 1. Local Component State (useState)

```tsx
// ✅ Use for UI state local to component
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// ✅ Complex local state with useReducer
type State = {
  count: number;
  step: number;
};

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setStep"; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

export function AdvancedCounter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <input
        type="number"
        value={state.step}
        onChange={(e) =>
          dispatch({ type: "setStep", payload: Number(e.target.value) })
        }
      />
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </div>
  );
}
```

## 2. Global State (Zustand)

```typescript
// lib/stores/user-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
}

interface UserStore {
  user: User | null
  isAuthenticated: boolean

  // Actions
  setUser: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Usage in components
'use client'
import { useUserStore } from '@/lib/stores/user-store'

export function UserProfile() {
  // Subscribe to specific slice
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)

  if (!user) return <div>Please log in</div>

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

// Multiple stores for different concerns
// lib/stores/cart-store.ts
interface CartItem {
  id: string
  quantity: number
  price: number
}

interface CartStore {
  items: CartItem[]
  total: number

  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.id === item.id)

    if (existing) {
      return {
        items: state.items.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
        total: state.total + (item.price * item.quantity),
      }
    }

    return {
      items: [...state.items, item],
      total: state.total + (item.price * item.quantity),
    }
  }),

  removeItem: (id) => set((state) => {
    const item = state.items.find(i => i.id === id)
    if (!item) return state

    return {
      items: state.items.filter(i => i.id !== id),
      total: state.total - (item.price * item.quantity),
    }
  }),

  clearCart: () => set({ items: [], total: 0 }),
}))
```

## 3. React Context (for Theme, i18n)

```tsx
// contexts/theme-context.tsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("theme") as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("theme", theme);

    // Resolve system theme
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(isDark ? "dark" : "light");
    } else {
      setResolvedTheme(theme);
    }

    // Apply to document
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Usage
("use client");
import { useTheme } from "@/contexts/theme-context";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

## 4. Server State (Fetch in Server Components)

```tsx
// app/posts/page.tsx
import { prisma } from "@/lib/prisma";

// ✅ Server Component - fetch directly
export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// For client-side data fetching, use SWR or React Query
("use client");
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PostsList() {
  const { data, error, isLoading } = useSWR("/api/posts", fetcher, {
    refreshInterval: 60000, // Refresh every 60s
    revalidateOnFocus: true,
  });

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## 5. URL State (Search Params)

```tsx
"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export function ProductFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const category = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "popular";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <select
        value={category}
        onChange={(e) => updateFilter("category", e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => updateFilter("sort", e.target.value)}
      >
        <option value="popular">Popular</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>
  );
}

// Server Component reads search params
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "all";
  const sortBy = params.sort || "popular";

  const products = await getProducts({ category, sortBy });

  return <ProductGrid products={products} />;
}
```

## 6. Form State (react-hook-form)

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await login(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register("password")} />
      {errors.password && <span>{errors.password.message}</span>}

      <button disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Login"}
      </button>
    </form>
  );
}
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

**Analogy**: State management is like organizing your home. Some things belong in your pocket (local state), some on the kitchen counter where everyone can reach (global state), some need to be written down (persisted state), and some should just be looked up when needed (server state).
