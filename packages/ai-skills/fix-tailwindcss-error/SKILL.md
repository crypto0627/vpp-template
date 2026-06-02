---
name: fix-tailwindcss-error
description: Resolves Tailwind CSS v4 styling issues, configuration problems, and class conflicts. Use when styles aren't applying or when user says "fix Tailwind" or "修復樣式問題".
---

When fixing Tailwind issues, always check:

1. **Content paths**: Ensure Tailwind scans the right files in tailwind.config.ts
2. **Configuration**: Verify tailwind.config.ts is correct and in project root
3. **Import order**: CSS imports (@tailwind directives) must come before components
4. **Class format**: Use complete class names, not dynamic string interpolation
5. **Cache**: Clear .next folder and restart dev server if styles persist incorrectly

## Quick Start Example

```tsx
// Common fix: Dynamic classes not working
import { cn } from '@/lib/utils'

// ❌ WRONG: String interpolation
<div className={`text-${color}-500`}>

// ✅ CORRECT: Use cn utility
<div className={cn(
  'text-base',
  color === 'blue' && 'text-blue-500',
  color === 'red' && 'text-red-500'
)}>
```

## Debugging Checklist

```
Configuration:
  ☐ Is tailwind.config.ts in project root?
  ☐ Are content paths correct?
  ☐ Is globals.css imported in layout?
  ☐ Are @tailwind directives present?

Classes:
  ☐ Using complete class names (no string interpolation)?
  ☐ Are custom colors defined in config?
  ☐ Using correct breakpoint syntax?
  ☐ Have you cleared .next cache?

Build:
  ☐ Restart dev server after config changes
  ☐ Check browser console for CSS errors
  ☐ Inspect element to see if classes are compiled
  ☐ Try npm run build to see build-time errors
```

## Common Gotcha

**Cache issues**: Tailwind's JIT compiler is aggressive. If classes worked before but stopped working, clear `.next` folder and restart dev server. Also check browser cache (hard refresh with Cmd+Shift+R).

**VSCode IntelliSense**: Install "Tailwind CSS IntelliSense" extension for autocomplete and error detection.

## Analogy

Tailwind is like a paint-by-numbers kit. Each class is a pre-mixed color (utility). If the color isn't showing up, check: (1) Is the color in the kit? (content paths), (2) Are you using the right brush? (correct syntax), (3) Did you shake the paint? (clear cache).

## Learn More

For complete error examples and detailed fixes, see [./references/complete-examples.md](./references/complete-examples.md)
