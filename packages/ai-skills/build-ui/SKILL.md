---
name: build-ui
description: Builds responsive, accessible UI components with shadcn/ui and Tailwind v4. Use when creating interfaces, pages, or when user asks "build a component" or "建立 UI 元件".
---

# Build UI Skill

When building UI components, always prioritize responsive design, accessibility, and reusability using modern patterns with shadcn/ui and Tailwind CSS v4.

## The Five Principles of UI Building

When creating any UI component, always follow these principles:

1. **Mobile-first design**: Start with mobile, add responsive breakpoints
2. **Use shadcn/ui first**: Check if component exists before building custom
3. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
4. **Animations**: Use smooth transitions for better UX
5. **TypeScript props**: Fully typed component interfaces

## Quick Start: Stats Card Component

```tsx
// components/ui/stats-card.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-6",
        "hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600",
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
```

## Responsive Patterns

### Grid Layout (Mobile-First)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

### Flex Layout (Stack on Mobile)

```tsx
<div className="flex flex-col md:flex-row gap-6">
  <aside className="md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

## Accessibility Checklist

```tsx
✅ Semantic HTML
   <nav>, <main>, <article>, <button>

✅ ARIA Labels
   <button aria-label="Close menu">
     <X className="h-4 w-4" />
   </button>

✅ Keyboard Navigation
   onKeyDown={(e) => {
     if (e.key === 'Enter' || e.key === ' ') handleAction()
   }}

✅ Focus Indicators
   className="focus:ring-2 focus:ring-primary focus:ring-offset-2"

✅ Screen Reader Text
   <span className="sr-only">For screen readers only</span>
```

## Common Gotcha

**Tailwind v4 color system**: Use semantic colors (`bg-primary`) instead of fixed colors (`bg-blue-500`) for better theming support. Check the v4 migration guide for breaking changes.

**Mobile testing**: Always test on actual devices, not just browser DevTools. Touch targets should be at least 44x44px for accessibility.

## Analogy

Building UI is like arranging furniture in a room:

- Start with **essentials** (mobile view)
- Add more as **space allows** (responsive breakpoints)
- Components are like **modular furniture** (designed to fit together seamlessly)
- Accessibility is the **doorway** (everyone needs to get in)

## Learn More

For complete examples including advanced stats cards, data tables, mobile navigation, and accessible form components, see [./references/complete-examples.md](./references/complete-examples.md).
