# Complete Debugging Examples

Comprehensive debugging strategies, tools, and examples for troubleshooting Next.js applications.

## Complete Debugging Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  SYSTEMATIC DEBUGGING PROCESS                    │
└─────────────────────────────────────────────────────────────────┘

Step 1: IDENTIFY THE ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Read the full error message (don't skip!)
□ Note the error type (TypeError, ReferenceError, etc.)
□ Identify the file and line number
□ Check the stack trace for the error origin
□ Screenshot the error if needed

Step 2: REPRODUCE CONSISTENTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Document exact steps to trigger error
□ Test in different browsers
□ Check if it's environment-specific (dev vs prod)
□ Verify it happens on fresh page load
□ Test with different data/user states

Step 3: ISOLATE THE PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Binary search: Comment out half the code
□ Test in isolation (extract to minimal example)
□ Remove dependencies one by one
□ Check if recent changes caused it
□ Test with clean cache/state

Step 4: FORM HYPOTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ What could cause this behavior?
□ Search for similar issues online
□ Check documentation for API changes
□ Review recent commits
□ Consider environment differences

Step 5: TEST & VERIFY FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Apply fix
□ Test original reproduction steps
□ Test edge cases
□ Add regression test
□ Document the solution
```

## Detailed Issue Examples

### Issue 1: Hydration Mismatch Error

```
Error Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unhandled Runtime Error
Error: Hydration failed because the initial UI does not match
what was rendered on the server.

Warning: Expected server HTML to contain a matching <div> in <div>.
```

**Root Cause Analysis:**
Server and client render different content, causing React hydration to fail.

**Common Causes:**

```tsx
// ❌ CAUSE 1: Random values
export default function Page() {
  return <div id={Math.random()}>{new Date().toString()}</div>;
}

// ❌ CAUSE 2: Browser-only APIs
export default function Page() {
  return <div>{window.innerWidth}</div>;
}

// ❌ CAUSE 3: Conditional rendering based on client state
export default function Page() {
  return <div>{typeof window !== "undefined" && <ClientOnly />}</div>;
}

// ❌ CAUSE 4: Third-party libraries that use window
import SomeLibrary from "library-that-uses-window";

export default function Page() {
  return <SomeLibrary />;
}
```

**Solutions:**

```tsx
// ✅ SOLUTION 1: Use 'use client' with useEffect
"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [randomId, setRandomId] = useState("");

  useEffect(() => {
    setMounted(true);
    setRandomId(Math.random().toString());
  }, []);

  if (!mounted) return null;

  return <div id={randomId}>{new Date().toString()}</div>;
}

// ✅ SOLUTION 2: Use suppressHydrationWarning for specific elements
export default function Page() {
  return <div suppressHydrationWarning>{new Date().toString()}</div>;
}

// ✅ SOLUTION 3: Dynamic imports with ssr: false
import dynamic from "next/dynamic";

const ClientOnlyComponent = dynamic(() => import("@/components/client-only"), {
  ssr: false,
});

export default function Page() {
  return <ClientOnlyComponent />;
}

// ✅ SOLUTION 4: Use custom hook for client-only code
function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

export default function Page() {
  const isClient = useIsClient();

  return <div>{isClient && <ClientOnlyContent />}</div>;
}
```

### Issue 2: API Route Returns 404

```
Error Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET http://localhost:3000/api/users 404 (Not Found)
```

**Debugging Checklist:**

```bash
# ✅ Check 1: Is file named correctly?
# ❌ WRONG: route.tsx (must be .ts)
# ✅ CORRECT: route.ts

# ✅ Check 2: Is file in correct location?
app/api/users/route.ts  # ✅ CORRECT
app/api/users.ts        # ❌ WRONG
pages/api/users.ts      # ❌ WRONG (Pages Router)

# ✅ Check 3: Is function exported?
# ❌ WRONG:
async function GET() { }

# ✅ CORRECT:
export async function GET() { }

# ✅ Check 4: Is HTTP method uppercase?
# ❌ WRONG: export async function get() { }
# ✅ CORRECT: export async function GET() { }

# ✅ Check 5: Check dev server logs
# Look for route registration messages
```

**Complete Working Example:**

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Must be uppercase: GET, POST, PUT, PATCH, DELETE
export async function GET(request: NextRequest) {
  try {
    console.log("✅ GET /api/users called");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("✅ POST /api/users called with:", body);

    const user = await prisma.user.create({
      data: body,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("❌ Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
```

### Issue 3: Environment Variables Not Working

```
Error: process.env.DATABASE_URL is undefined
```

**Debugging Steps:**

```bash
# ✅ Step 1: Check .env file exists
ls -la .env

# ✅ Step 2: Check variable naming
# Client variables MUST have NEXT_PUBLIC_ prefix
NEXT_PUBLIC_API_URL=http://localhost:3000  # ✅ Available in browser
DATABASE_URL=postgresql://...              # ✅ Server-only

# ✅ Step 3: Restart dev server
# Changes to .env require restart
# Ctrl+C then npm run dev

# ✅ Step 4: Check .env.local takes precedence
# Priority: .env.local > .env

# ✅ Step 5: Verify in code
console.log('DATABASE_URL:', process.env.DATABASE_URL)
```

**Common Mistakes:**

```typescript
// ❌ WRONG: Trying to access server var in browser
"use client";
export default function Component() {
  // This will be undefined! DATABASE_URL is server-only
  console.log(process.env.DATABASE_URL);
}

// ✅ CORRECT: Server-side only
// app/api/route.ts (Server)
export async function GET() {
  const dbUrl = process.env.DATABASE_URL; // ✅ Works
}

// ✅ CORRECT: Client-accessible with NEXT_PUBLIC_
("use client");
export default function Component() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // ✅ Works
}
```

### Issue 4: "Cannot read properties of undefined"

```
TypeError: Cannot read properties of undefined (reading 'name')
    at UserCard (UserCard.tsx:10:20)
```

**Debugging Process:**

```tsx
// ❌ PROBLEM CODE:
export function UserCard({ user }) {
  return <div>{user.name}</div>; // Crashes if user is undefined
}

// 🔍 DEBUGGING: Add console logs
export function UserCard({ user }) {
  console.log("UserCard received user:", user);
  console.log("user type:", typeof user);
  console.log("user is null:", user === null);
  console.log("user is undefined:", user === undefined);

  return <div>{user.name}</div>;
}

// ✅ FIX 1: Add null checks
export function UserCard({ user }) {
  if (!user) {
    return <div>No user data</div>;
  }

  return <div>{user.name}</div>;
}

// ✅ FIX 2: Use optional chaining
export function UserCard({ user }) {
  return <div>{user?.name ?? "Unknown"}</div>;
}

// ✅ FIX 3: Add TypeScript + default values
interface UserCardProps {
  user?: {
    name: string;
    email: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  if (!user) return null;

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ FIX 4: Validate at data source
async function fetchUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error("User not found");
  }

  return user; // TypeScript now knows user is not null
}
```

### Issue 5: Infinite Re-render Loop

```
Error: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.
```

**Common Causes & Solutions:**

```tsx
// ❌ CAUSE 1: No dependency array
export function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // Infinite loop!
  }); // Missing dependency array

  return <div>{count}</div>;
}

// ✅ FIX: Add empty dependency array (run once)
useEffect(() => {
  setCount(1);
}, []);

// ❌ CAUSE 2: Object/array in dependencies
export function Component({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData(user).then(setData);
  }, [user]); // If user is new object each render → infinite loop
}

// ✅ FIX: Destructure specific values
useEffect(() => {
  fetchData(user.id).then(setData);
}, [user.id]); // Primitive value, stable reference

// ❌ CAUSE 3: State update in render
export function Component() {
  const [count, setCount] = useState(0);

  setCount(count + 1); // Infinite loop! Don't call setState during render

  return <div>{count}</div>;
}

// ✅ FIX: Move to event handler or useEffect
export function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(1);
  }, []);

  return <div>{count}</div>;
}
```

## Advanced Debugging Tools

### Browser DevTools Console

```javascript
// Log with context
console.log("🔍 User data:", user);
console.log("📊 Props:", { props, state });

// Group related logs
console.group("🔄 Data Fetch");
console.log("Fetching user:", userId);
console.log("URL:", url);
console.groupEnd();

// Table for arrays
console.table(users);

// Trace call stack
console.trace("How did we get here?");

// Time operations
console.time("fetchData");
await fetchData();
console.timeEnd("fetchData"); // fetchData: 123.45ms

// Assert conditions
console.assert(user !== null, "User should not be null");
```

### React DevTools

```
Component Tab:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Inspect component props
- View component state
- See hooks values
- Trace component hierarchy

Profiler Tab:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Record rendering performance
- Identify slow components
- See why components re-rendered
- Find unnecessary re-renders
```

### Network Tab Debugging

```
For API Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Check request URL (typos?)
✅ Verify request method (GET/POST/etc)
✅ Inspect request headers (Authorization?)
✅ View request payload
✅ Check response status code
✅ Read response body
✅ Look for CORS errors
✅ Check timing (slow requests?)
```

### Source Maps & Breakpoints

```typescript
// Add debugger statement
export function problematicFunction(data) {
  debugger; // Execution pauses here

  const result = processData(data);
  return result;
}

// Or use browser breakpoints:
// 1. Open Sources tab in DevTools
// 2. Find your file
// 3. Click line number to add breakpoint
// 4. Trigger the code
// 5. Inspect variables in scope
```

### Custom Debug Utilities

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

export function debugError(context: string, error: any) {
  console.error(`❌ [${context}]`, error);

  if (error instanceof Error) {
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Usage
import { debug, debugTime, debugError } from "@/lib/debug";

export async function fetchUser(id: string) {
  const stopTimer = debugTime("fetchUser");
  debug("fetchUser:input", { id });

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    debug("fetchUser:result", user);
    return user;
  } catch (error) {
    debugError("fetchUser", error);
    throw error;
  } finally {
    stopTimer();
  }
}
```

## Common Error Patterns

### Pattern 1: Prisma Client Not Generated

```bash
Error: @prisma/client did not initialize yet.
Please run "prisma generate" and try to import it again.

# ✅ FIX:
cd apps/web
npx prisma generate

# For type errors after schema changes:
npx prisma generate
# Restart TypeScript server in VSCode
```

### Pattern 2: Module Not Found

```bash
Error: Module not found: Can't resolve '@/components/Button'

# ✅ CHECK LIST:
1. Does file exist? ls components/Button.tsx
2. Is path alias configured? Check tsconfig.json
3. Is extension correct? (.tsx not .ts for components)
4. Is casing correct? (Button vs button)
5. Restart dev server
```

### Pattern 3: Build Errors That Don't Occur in Dev

```bash
# Build succeeds locally but fails in CI/CD

# ✅ COMMON CAUSES:
1. TypeScript strict mode differences
2. Missing environment variables
3. Case-sensitive file systems (Mac vs Linux)
4. Different Node versions
5. Cached dependencies

# ✅ DEBUG STEPS:
npm run build  # Test build locally
rm -rf .next && npm run build  # Clean build
npm ci  # Clean install (instead of npm install)
```
