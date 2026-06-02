# Complete Next.js Error Fix Examples

## 1. Hydration Mismatch

**Error Message:**

```
Error: Hydration failed because the initial UI does not match
what was rendered on the server.
```

**Cause:** Server and client render different content

```tsx
// ❌ WRONG: Random values differ between server/client
export default function Page() {
  return <div id={Math.random()}>{new Date().toString()}</div>;
}

// ✅ FIX 1: Use 'use client' with useEffect
("use client");
import { useEffect, useState } from "react";

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <div>{new Date().toString()}</div>;
}

// ✅ FIX 2: Use suppressHydrationWarning for specific elements
export default function Page() {
  return (
    <div suppressHydrationWarning>
      {typeof window !== "undefined" && new Date().toString()}
    </div>
  );
}
```

## 2. Module Not Found

**Error Message:**

```
Module not found: Can't resolve '@/components/Header'
```

**Fixes:**

```bash
# 1. Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]  // Ensure this maps correctly
    }
  }
}

# 2. Verify file exists
ls components/Header.tsx

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Restart dev server
# Kill the process and run npm run dev again
```

## 3. API Route Not Found (404)

**Error:** API returns 404

```typescript
// ❌ WRONG: Named route.tsx (won't work!)
// app/api/users/route.tsx

// ✅ CORRECT: Must be route.ts
// app/api/users/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}

// ❌ WRONG: No export
async function GET() {}

// ✅ CORRECT: Must export
export async function GET() {}
```

## 4. "You're importing a component that needs X"

**Error Message:**

```
You're importing a component that needs useState.
It only works in a Client Component but none of its
parents are marked with "use client"
```

**Fix:**

```tsx
// Add 'use client' directive at the top
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## 5. "Cannot read properties of undefined"

**Error:** Reading property of undefined object

```tsx
// ❌ WRONG: No null check
export default function Page({ posts }) {
  return posts.map((post) => <div key={post.id}>{post.title}</div>);
}

// ✅ FIX: Add null checks
export default function Page({ posts }) {
  if (!posts || posts.length === 0) {
    return <p>No posts found</p>;
  }

  return posts.map((post) => <div key={post.id}>{post.title}</div>);
}

// ✅ BETTER: Use optional chaining
export default function Page({ posts }) {
  return (
    <>
      {posts?.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </>
  );
}
```

## 6. Build Errors

**Error:** Build fails with various errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Build with debug info
npm run build -- --debug

# Check environment variables
# Ensure all NEXT_PUBLIC_* vars are set at build time
```

## 7. Layout Not Applying

**Issue:** Layout component not wrapping pages

```
✅ CORRECT structure:
app/
  layout.tsx       ← Root layout (wraps all pages)
  page.tsx         ← Homepage
  dashboard/
    layout.tsx     ← Dashboard layout (wraps dashboard pages only)
    page.tsx       ← Dashboard page

❌ WRONG:
app/
  Layout.tsx       ← Wrong: Must be lowercase 'layout.tsx'
  Page.tsx         ← Wrong: Must be lowercase 'page.tsx'
```

## 8. Dynamic Route Parameters

**Error:** Params undefined in dynamic routes

```tsx
// ❌ WRONG: Old Pages Router syntax
export default function Page({ params }) {
  const { id } = params; // undefined in App Router!
}

// ✅ CORRECT: App Router syntax (async)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>Post ID: {id}</div>;
}

// For Client Components
("use client");
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <div>Post ID: {id}</div>;
}
```

## 9. Environment Variables Not Working

```bash
# ❌ WRONG: Not prefixed (won't work in client)
API_KEY=secret

# ✅ CORRECT: Prefix with NEXT_PUBLIC_ for client access
NEXT_PUBLIC_API_KEY=secret

# In code:
// ✅ Server-side (API routes, Server Components)
process.env.DATABASE_URL

// ✅ Client-side (must use NEXT_PUBLIC_)
process.env.NEXT_PUBLIC_API_KEY

# Restart dev server after changing .env
```

## 10. Infinite Revalidation Loop

**Error:** Page keeps revalidating

```tsx
// ❌ WRONG: Creates infinite loop
export default async function Page() {
  const res = await fetch("http://localhost:3000/api/data", {
    next: { revalidate: 0 }, // Revalidates on every request!
  });
}

// ✅ FIX: Set reasonable revalidate time
export default async function Page() {
  const res = await fetch("http://localhost:3000/api/data", {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
}

// ✅ OR: Use static rendering
export default async function Page() {
  const res = await fetch("http://localhost:3000/api/data", {
    cache: "force-cache", // Cache forever (default)
  });
}
```
