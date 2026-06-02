---
name: write-form
description: Creates forms with react-hook-form, Zod validation, error handling, and submission. Use when building forms or when user asks "create form" or "建立表單".
---

When writing forms, always include:

1. **Validation schema**: Define with Zod before building form
2. **Type-safe**: Use TypeScript for inputs and outputs
3. **Error handling**: Display field-level and form-level errors
4. **Loading states**: Disable form during submission
5. **Accessibility**: Labels, ARIA attributes, keyboard navigation

## Complete Form Pattern

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// 1. Define validation schema
const formSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain uppercase letter")
      .regex(/[0-9]/, "Password must contain number")
      .regex(/[^A-Za-z0-9]/, "Password must contain special character"),

    confirmPassword: z.string(),

    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),

    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),

    role: z.enum(["user", "admin", "moderator"], {
      required_error: "Please select a role",
    }),

    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// 2. Infer TypeScript type
type FormData = z.infer<typeof formSchema>;

// 3. Create form component
export function SignupForm() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Validate on blur
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      bio: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }

      toast({
        title: "Success!",
        description: "Your account has been created",
      });

      reset();
      // Redirect or do something else
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="John Doe"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must be 8+ characters with uppercase, number, and special character
        </p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Bio Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          rows={4}
          {...register("bio")}
        />
        <p className="text-xs text-muted-foreground">
          {watch("bio")?.length || 0} / 500 characters
        </p>
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      {/* Role Select */}
      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
        </Label>
        <select
          id="role"
          {...register("role")}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Checkbox */}
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="acceptTerms"
          {...register("acceptTerms")}
          className="mt-1"
        />
        <Label htmlFor="acceptTerms" className="font-normal">
          I accept the{" "}
          <a href="/terms" className="text-primary underline">
            terms and conditions
          </a>
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
```

## Advanced Form Patterns

### 1. Multi-Step Form

```tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";

const steps = ["basic", "contact", "preferences"] as const;
type Step = (typeof steps)[number];

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm();

  const next = async () => {
    const isValid = await trigger(); // Validate current step
    if (isValid) {
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const prev = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={step}
            className={cn(
              "w-full h-2 rounded",
              index <= steps.indexOf(currentStep)
                ? "bg-blue-500"
                : "bg-gray-200",
            )}
          />
        ))}
      </div>

      <form>
        {currentStep === "basic" && (
          <div>
            <Input {...register("name", { required: true })} />
            <Input {...register("email", { required: true })} />
          </div>
        )}

        {currentStep === "contact" && (
          <div>
            <Input {...register("phone")} />
            <Input {...register("address")} />
          </div>
        )}

        {currentStep === "preferences" && (
          <div>
            <Select {...register("language")} />
            <Select {...register("timezone")} />
          </div>
        )}

        <div className="flex justify-between mt-6">
          {currentStep !== "basic" && (
            <Button type="button" onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep !== "preferences" ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="submit">Submit</Button>
          )}
        </div>
      </form>
    </div>
  );
}
```

### 2. Dynamic Fields (Array Fields)

```tsx
import { useFieldArray } from "react-hook-form";

const schema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "At least one item required"),
});

export function DynamicForm() {
  const { register, control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ name: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input {...register(`items.${index}.name`)} placeholder="Item name" />
          <Input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            placeholder="Quantity"
          />
          <Button
            type="button"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button type="button" onClick={() => append({ name: "", quantity: 1 })}>
        Add Item
      </Button>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### 3. File Upload Form

```tsx
const schema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "File is required")
    .refine(
      (files) => files[0]?.size <= 5000000,
      "File size must be less than 5MB",
    )
    .refine(
      (files) => ["image/jpeg", "image/png"].includes(files[0]?.type),
      "Only .jpg and .png files are allowed",
    ),
});

export function FileUploadForm() {
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(schema),
  });

  const file = watch("file")?.[0];

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append("file", data.file[0]);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="file" {...register("file")} accept="image/*" />

      {file && (
        <div className="mt-4">
          <p>Selected: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      <Button type="submit">Upload</Button>
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

**Analogy**: Building a form is like designing a questionnaire. Each field is a question, validation ensures answers make sense, error messages guide corrections, and submission is the final "submit your answers" step. Good forms feel conversational and helpful, not interrogative.
