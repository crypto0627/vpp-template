---
name: refactor-ui
description: Improves UI component architecture, reusability, and maintainability. Use when cleaning up components or when user asks "refactor UI" or "重構 UI 元件".
---

When refactoring UI, always:

1. **Extract reusable components**: Apply DRY (Don't Repeat Yourself) principle
2. **Improve component composition**: Build small, composable pieces instead of monoliths
3. **Simplify props**: Use reasonable defaults and avoid prop explosion
4. **Separate concerns**: Split business logic from presentation
5. **Enhance accessibility**: Add ARIA labels and keyboard navigation

## Quick Start Example

```tsx
// Before: Repeated card markup
<div className="border rounded-lg p-6">
  <h3>Users</h3>
  <p className="text-3xl">1,234</p>
  <p className="text-gray-500">+12% from last month</p>
</div>;

// After: Extracted StatCard component
interface StatCardProps {
  title: string;
  value: string | number;
  change: { value: number; isPositive: boolean };
}

export function StatCard({ title, value, change }: StatCardProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      <p
        className={cn(
          "text-sm",
          change.isPositive ? "text-green-600" : "text-red-600",
        )}
      >
        {change.isPositive ? "+" : ""}
        {change.value}% from last month
      </p>
    </div>
  );
}
```

## UI Refactoring Checklist

```
Component Structure:
  ☐ Break down large components (< 200 lines)
  ☐ Extract repeated UI patterns
  ☐ Use compound components for flexibility
  ☐ Separate logic from presentation

Props:
  ☐ Reduce prop drilling (use Context)
  ☐ Use reasonable defaults
  ☐ Group related props into objects
  ☐ Make components polymorphic when needed

Composition:
  ☐ Prefer composition over configuration
  ☐ Make components composable
  ☐ Use children prop effectively
  ☐ Create layout components

Accessibility:
  ☐ Add ARIA labels
  ☐ Support keyboard navigation
  ☐ Use semantic HTML
  ☐ Test with screen readers
```

## Common Gotcha

**Over-abstraction**: Don't create reusable components until you've used similar code 2-3 times. Premature abstraction can make code harder to change.

## Analogy

Refactoring UI is like organizing a LEGO collection. You sort pieces by type (extract components), create instruction sheets (prop interfaces), and build modular sections (compound components) that can be combined in different ways. Each piece should be simple and do one thing well.

## Learn More

For complete UI refactoring patterns (compound components, polymorphic components, separation of concerns), see [./references/complete-examples.md](./references/complete-examples.md)
