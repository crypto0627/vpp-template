---
name: add-api-endpoint
description: Creates new API routes in Next.js App Router with validation, error handling, and authentication. Use when adding new endpoints or when user asks "create an API" or "新增 API 路由".
---

When adding API endpoints, always include:

1. **Use App Router structure**: Place in `app/api/[name]/route.ts`
2. **Validate with Zod**: Define schema for request body/params
3. **Handle errors properly**: Try-catch with standardized responses
4. **Add authentication**: Check JWT tokens for protected routes
5. **Type the response**: Ensure type-safe API responses

## Quick Start

Create a new API route at `app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Your logic here

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

## HTTP Methods

```typescript
export async function GET(req: NextRequest) {
  /* ... */
}
export async function POST(req: NextRequest) {
  /* ... */
}
export async function PATCH(req: NextRequest) {
  /* ... */
}
export async function DELETE(req: NextRequest) {
  /* ... */
}
```

## Common Gotcha

**File naming**: API routes MUST be named `route.ts` (not `route.tsx`). Next.js won't recognize `.tsx` files as API routes.

**Analogy**: Think of API routes like restaurant kitchen windows - they're the interface where the waiter (client) passes orders (requests) and receives dishes (responses). The Zod schema is like the order ticket that ensures everything is spelled correctly before the kitchen starts cooking.

## Learn More

- [Complete examples with authentication, pagination, and error handling](./references/complete-example.md)
