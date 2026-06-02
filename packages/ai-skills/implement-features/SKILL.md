---
name: implement-features
description: Implements complete features following best practices from schema to UI. Use when building new functionality or when user asks "implement feature" or "實作功能".
---

When implementing features, always follow:

1. **Plan first**: Define data model, API endpoints, and UI components before coding
2. **Bottom-up approach**: Start with Database → API → Components → Integration
3. **Type-safe**: Use TypeScript and Zod validation throughout the entire stack
4. **Validate data**: Implement runtime validation with Zod for all inputs
5. **Test as you go**: Write unit tests for each layer before moving to the next

## Quick Start Example

```typescript
// Feature implementation flow

// Step 1: Define Prisma schema
model Todo {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  userId    String
  createdAt DateTime @default(now())
}

// Step 2: Create Zod validation
const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
})

// Step 3: Build API route
export async function POST(req: NextRequest) {
  const body = await req.json()
  const data = createTodoSchema.parse(body)
  const todo = await prisma.todo.create({ data })
  return NextResponse.json({ todo }, { status: 201 })
}

// Step 4: Create component
export function CreateTodoForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(createTodoSchema),
  })
  // ...form implementation
}
```

## Implementation Checklist

```
Planning:
  ☐ Define data model and relationships
  ☐ Identify API endpoints needed
  ☐ Sketch UI components

Backend:
  ☐ Create Prisma schema
  ☐ Run migrations
  ☐ Create Zod validation schemas
  ☐ Build API routes with error handling

Frontend:
  ☐ Create reusable components
  ☐ Implement forms with react-hook-form
  ☐ Add loading and error states
  ☐ Handle API responses

Testing:
  ☐ Write unit tests for components
  ☐ Write API route tests
  ☐ Test edge cases
```

## Common Gotcha

**Scope creep**: Start with MVP (Minimum Viable Product). Get basic CRUD working first, then add features like filtering, sorting, pagination. Don't try to build everything at once.

## Analogy

Implementing a feature is like building a house. You start with the foundation (database schema), then the frame (API), then the walls and roof (UI), and finally the interior (polish and UX). Each layer depends on the one below it being solid.

## Learn More

For complete feature implementation examples, see [./references/complete-examples.md](./references/complete-examples.md)
