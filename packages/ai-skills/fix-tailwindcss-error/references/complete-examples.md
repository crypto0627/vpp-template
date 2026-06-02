# Complete Tailwind CSS v4 Error Fix Examples

## 1. Styles Not Applying

**Problem:** Classes don't have any effect

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    // ✅ CORRECT: Scan all relevant files
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

```css
/* app/globals.css */
/* ✅ CORRECT: Import order matters */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom styles go after */
@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded;
  }
}
```

```tsx
// app/layout.tsx
// ✅ CORRECT: Import globals.css
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## 2. Dynamic Classes Not Working

**Problem:** Dynamically constructed classes don't apply

```tsx
// ❌ WRONG: String concatenation breaks PurgeCSS
<div className={`text-${color}-500`}>  // Won't work!

// ❌ WRONG: Template literals with variables
<div className={`bg-${isActive ? 'blue' : 'gray'}-500`}>  // Won't work!

// ✅ FIX 1: Use complete class names with conditions
<div className={color === 'blue' ? 'text-blue-500' : 'text-red-500'}>

// ✅ FIX 2: Use clsx or cn utility
import { cn } from '@/lib/utils'

<div className={cn(
  'text-base',
  color === 'blue' && 'text-blue-500',
  color === 'red' && 'text-red-500',
  isActive && 'font-bold'
)}>

// ✅ FIX 3: Use CSS variables for truly dynamic values
<div
  className="text-primary"
  style={{ '--primary-color': dynamicColor } as React.CSSProperties}
>
```

## 3. Custom Colors Not Working

**Problem:** Custom theme colors undefined

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        // ✅ CORRECT: Define custom colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        },
        brand: '#1a73e8',  // Single color
      },
    },
  },
} satisfies Config

// Usage in components
<div className="bg-primary-500 text-primary-50">
<div className="bg-brand">
```

## 4. Responsive Classes Not Working

```tsx
// ❌ WRONG: Multiple responsive classes for same property
<div className="w-full md:w-full lg:w-1/2">
// md:w-full is redundant

// ✅ CORRECT: Mobile-first approach
<div className="w-full lg:w-1/2">
// Default: full width
// Large screens: half width

// ✅ CORRECT: All breakpoints
<div className="text-sm md:text-base lg:text-lg xl:text-xl">

// Tailwind breakpoints:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

## 5. Important Not Working

**Problem:** Styles being overridden

```tsx
// ❌ WRONG: Inline !important
<div className="text-red-500 !important">

// ✅ FIX 1: Use ! prefix (Tailwind way)
<div className="!text-red-500">

// ✅ FIX 2: Increase specificity
<div className="text-red-500 hover:text-red-600">

// ✅ FIX 3: Use layer priority in globals.css
@layer components {
  .custom-style {
    @apply text-red-500 !important;
  }
}
```

## 6. Dark Mode Not Working

```javascript
// tailwind.config.ts
export default {
  darkMode: 'class', // or 'media' for system preference
  // ...
} satisfies Config
```

```tsx
// app/layout.tsx
<html lang="en" className="dark">
  {" "}
  {/* Add 'dark' class */}
  <body>
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
      {children}
    </div>
  </body>
</html>;

// Or use next-themes for toggle
("use client");
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle theme
    </button>
  );
}
```

## 7. Arbitrary Values Not Working

```tsx
// ❌ WRONG: Invalid syntax
<div className="w-[500]">  // Missing unit

// ✅ CORRECT: Include unit
<div className="w-[500px]">
<div className="top-[117px]">
<div className="bg-[#1da1f2]">
<div className="grid-cols-[200px_1fr_100px]">

// Complex arbitrary values
<div className="bg-[url('/img/bg.png')]">
<div className="before:content-['Hello_World']">
```

## 8. Plugins Not Loading

```bash
# Install plugin
npm install @tailwindcss/forms @tailwindcss/typography

# tailwind.config.ts
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

export default {
  plugins: [forms, typography],
} satisfies Config

# Restart dev server
# Ctrl+C then npm run dev
```

## 9. Conflicting Styles

```tsx
// ❌ WRONG: Conflicting utilities (last one wins unpredictably)
<div className="p-4 p-6">  // Which padding applies?

// ✅ CORRECT: Use one utility
<div className="p-6">

// ✅ CORRECT: Use responsive variants
<div className="p-4 md:p-6 lg:p-8">

// Use cn utility to handle conflicts
import { cn } from '@/lib/utils'

<div className={cn('p-4', isLarge && 'p-6')}>
```

## lib/utils.ts (cn helper)

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
import { cn } from '@/lib/utils'

<div className={cn(
  'rounded-lg border p-4',
  isActive && 'bg-blue-50 border-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

## Quick Fixes

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Tailwind is installed
npm list tailwindcss

# Restart dev server
# Ctrl+C then npm run dev

# Check browser DevTools
# Inspect element → Computed → See if Tailwind classes exist
```
