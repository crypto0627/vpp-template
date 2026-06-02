---
name: debug-project
description: Systematically debugs errors, performance issues, and unexpected behavior. Use when troubleshooting problems or when user says "fix this error" or "除錯問題".
---

# Debug Project Skill

When debugging, follow a systematic approach to identify, isolate, and resolve issues efficiently.

## The Five-Step Debugging Process

When encountering any error, always follow this sequence:

1. **Read the full error message**: Don't skip the stack trace
2. **Reproduce the issue**: Understand exact steps to trigger it
3. **Check recent changes**: What was modified before it broke?
4. **Use systematic elimination**: Test one hypothesis at a time
5. **Add logging strategically**: Log at decision points and boundaries

## Quick Debugging Workflow

```
1. Identify → 2. Reproduce → 3. Isolate → 4. Hypothesize → 5. Fix & Verify
```

## Essential Debug Utility

```typescript
// lib/debug.ts
const DEBUG = process.env.NODE_ENV === "development";

export function debug(context: string, data: any) {
  if (DEBUG) {
    console.log(`🔍 [${context}]`, JSON.stringify(data, null, 2));
  }
}

export function debugTime(label: string) {
  if (DEBUG) console.time(`⏱️  ${label}`);
  return () => {
    if (DEBUG) console.timeEnd(`⏱️  ${label}`);
  };
}

// Usage
const stopTimer = debugTime("fetchData");
debug("input", data);
// ... operation ...
stopTimer();
```

## Browser DevTools Quick Checks

```
Console:  Check errors and warnings
Network:  Verify API status codes and payloads
React:    Inspect props, state, re-renders
Sources:  Add breakpoints and step through code
```

## Common Quick Fixes

```tsx
// Hydration Mismatch
'use client'
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null

// API 404
// - Check: route.ts (not .tsx)
// - Check: export async function GET()
// - Check: app/api/ location

// Env Variables
// Server: process.env.DATABASE_URL
// Client: process.env.NEXT_PUBLIC_API_URL

// Prisma Sync
npx prisma generate
npx prisma migrate dev
```

## Common Gotcha

**Silent failures**: Always check both browser console AND terminal. Next.js logs errors in different places depending on whether code runs on client or server. Don't just fix what you see - find the root cause.

## Analogy

Debugging is like being a detective:

- **Error message** = First clue
- **Stack trace** = Crime scene
- **Logs** = Evidence trail
- **Hypothesis** = Theory
- **Fix** = Case solved

Test one theory at a time until you find the culprit.

## Learn More

For detailed examples including hydration errors, API debugging, infinite loops, and advanced debugging tools, see [./references/complete-examples.md](./references/complete-examples.md).
