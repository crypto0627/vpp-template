---
name: write-form
description: Creates forms with react-hook-form, Zod validation, error handling, and submission. Use when building forms or when user asks "create form" or "建立表單".
---

When writing forms, always include:

1. **Validation schema**: Define Zod schema before building the form
2. **Type-safe**: Use TypeScript with inferred types from Zod schemas
3. **Error handling**: Display field-level errors and form-level errors
4. **Loading states**: Disable form and show spinner during submission
5. **Accessibility**: Use proper labels, ARIA attributes, and keyboard navigation

## Quick Start Example

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof loginSchema>;

// 2. Create form component
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register("email")} />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
```

## Form Best Practices

```
Validation:
  ☐ Define Zod schema first
  ☐ Show errors below fields
  ☐ Validate on blur (not on every keystroke)
  ☐ Show field-specific error messages

UX:
  ☐ Disable submit during submission
  ☐ Show loading indicator
  ☐ Clear form after success
  ☐ Mark required fields with *

Accessibility:
  ☐ Use proper label elements
  ☐ Add aria-invalid for errors
  ☐ Use aria-describedby for error messages
  ☐ Support keyboard navigation

Security:
  ☐ Validate on server-side too
  ☐ Sanitize inputs
  ☐ Use CSRF tokens
  ☐ Rate limit submissions
```

## Common Gotcha

**Client-side only validation**: Always validate on the server too. Never trust client-side validation alone - users can bypass it. The Zod schema should be shared between client and server.

## Analogy

Building a form is like designing a questionnaire. Each field is a question, validation ensures answers make sense, error messages guide corrections, and submission is the final "submit your answers" step. Good forms feel conversational and helpful, not interrogative.

## Learn More

For complete form examples (multi-step, dynamic fields, file upload), see [./references/complete-examples.md](./references/complete-examples.md)
