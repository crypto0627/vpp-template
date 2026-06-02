# Complete Feature Implementation Example: Todo Feature

## Step 1: Define Prisma Schema

```prisma
// prisma/schema.prisma
model Todo {
  id          String    @id @default(cuid())
  title       String
  description String?
  completed   Boolean   @default(false)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([completed])
  @@map("todos")
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## Step 2: Create Validation Schemas

```typescript
// lib/validations/todo.ts
import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
});

export const updateTodoSchema = createTodoSchema.partial().extend({
  completed: z.boolean().optional(),
});

export const todoQuerySchema = z.object({
  completed: z.boolean().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoQuery = z.infer<typeof todoQuerySchema>;
```

## Step 3: Build API Routes

```typescript
// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTodoSchema, todoQuerySchema } from "@/lib/validations/todo";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyToken(token);

    const { searchParams } = new URL(req.url);
    const query = todoQuerySchema.parse({
      completed: searchParams.get("completed") === "true",
      priority: searchParams.get("priority"),
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 10,
    });

    const where = {
      userId: payload.userId,
      ...(query.completed !== undefined && { completed: query.completed }),
      ...(query.priority && { priority: query.priority }),
    };

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        take: query.limit,
        skip: (query.page - 1) * query.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.todo.count({ where }),
    ]);

    return NextResponse.json({
      todos,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("GET /api/todos error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyToken(token);

    const body = await req.json();
    const data = createTodoSchema.parse(body);

    const todo = await prisma.todo.create({
      data: {
        ...data,
        userId: payload.userId,
      },
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// app/api/todos/[id]/route.ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyToken(token);

    const body = await req.json();
    const data = updateTodoSchema.parse(body);

    const todo = await prisma.todo.update({
      where: { id, userId: payload.userId },
      data,
    });

    return NextResponse.json({ todo });
  } catch (error) {
    // Handle errors...
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyToken(token);

    await prisma.todo.delete({
      where: { id, userId: payload.userId },
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    // Handle errors...
  }
}
```

## Step 4: Create Components

```tsx
// components/todos/create-todo-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTodoSchema, type CreateTodoInput } from "@/lib/validations/todo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function CreateTodoForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
  });

  const onSubmit = async (data: CreateTodoInput) => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create todo");

      toast({ title: "Success", description: "Todo created!" });
      reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create todo",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select {...register("priority")}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Todo
      </Button>
    </form>
  );
}

// components/todos/todo-list.tsx
("use client");

import { useEffect, useState } from "react";
import { TodoItem } from "./todo-item";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos");
      const data = await response.json();
      setTodos(data.todos);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
      ))}
    </div>
  );
}
```

## Step 5: Integration

```tsx
// app/todos/page.tsx
import { CreateTodoForm } from "@/components/todos/create-todo-form";
import { TodoList } from "@/components/todos/todo-list";

export default function TodosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Todos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Create Todo</h2>
          <CreateTodoForm />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">All Todos</h2>
          <TodoList />
        </div>
      </div>
    </div>
  );
}
```
