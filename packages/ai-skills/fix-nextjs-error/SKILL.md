---
name: fix-nextjs-error
description: Resolves Next.js-specific errors including hydration mismatches, routing issues, and build errors. Use when encountering Next.js errors or when user says "fix Next.js error" or "修復 Next.js 錯誤".
---

When fixing Next.js errors, always include:

1. **Error identification**: Read the error type and stack trace carefully
2. **File conventions**: Check lowercase naming (page.tsx, layout.tsx, route.ts)
3. **Client vs Server**: Ensure 'use client' directive where needed
4. **Params handling**: Use 'await params' in Next.js 15+ App Router
5. **Cache clearing**: Delete .next folder if issues persist

## Quick Start Example

```tsx
// Common fix: Hydration mismatch
"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <div>{new Date().toString()}</div>;
}
```

## Quick Diagnostic Checklist

```
File Naming:
  ☐ Is it lowercase? (page.tsx not Page.tsx)
  ☐ API routes named route.ts (not route.tsx)
  ☐ Special files: layout.tsx, loading.tsx, error.tsx

Client vs Server:
  ☐ Using hooks? Need 'use client'
  ☐ Using async/await in component? Keep it Server Component
  ☐ Need browser APIs? Need 'use client'

Dynamic Routes:
  ☐ Params are async in Next.js 15+
  ☐ Use 'await params' for Server Components
  ☐ Use 'use(params)' for Client Components

Environment:
  ☐ Client vars prefixed with NEXT_PUBLIC_?
  ☐ .env file in project root?
  ☐ Restarted dev server after changes?
```

## Common Gotcha

**Cache persistence**: Even after fixing code, you might see old errors because of Next.js caching. When in doubt: `rm -rf .next && npm run dev`

## Analogy

Debugging Next.js is like troubleshooting a car. The error message is your check engine light - it tells you something's wrong. The stack trace is your diagnostic scanner - it points to the specific part that needs fixing. Sometimes you just need to turn it off and on again (clear cache).

## Learn More

For complete error examples and detailed fixes, see [./references/complete-examples.md](./references/complete-examples.md)
