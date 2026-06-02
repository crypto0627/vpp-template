# Complete UI Building Examples

Comprehensive examples for building responsive, accessible UI components with shadcn/ui and Tailwind CSS v4.

## Complete Component Examples

### Example 1: Advanced Stats Card with Animations

```tsx
// components/ui/stats-card.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  loading = false,
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-6",
        "hover:shadow-lg hover:border-primary/50",
        "transition-all duration-300",
        className,
      )}
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header: Icon and Trend */}
        <div className="flex items-center justify-between mb-4">
          <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded w-2/3" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Optional bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </motion.div>
  );
}

// Usage Example
export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Revenue"
        value="$45,231.89"
        subtitle="+20.1% from last month"
        icon={DollarSign}
        trend={{ value: 20.1, isPositive: true }}
      />
      <StatsCard
        title="Active Users"
        value="2,543"
        subtitle="+180 from last week"
        icon={Users}
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatsCard
        title="Pending Orders"
        value="234"
        subtitle="-15 from yesterday"
        icon={ShoppingCart}
        trend={{ value: 5.4, isPositive: false }}
      />
      <StatsCard
        title="Server Status"
        value="99.9%"
        subtitle="All systems operational"
        icon={Activity}
        loading={false}
      />
    </div>
  );
}
```

### Example 2: Responsive Data Table Component

```tsx
// components/ui/data-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchable && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {search && (
            <Button variant="ghost" onClick={() => setSearch("")} size="sm">
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {typeof column.accessor === "function"
                        ? column.accessor(row)
                        : row[column.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {data.length} results
      </div>
    </div>
  );
}

// Usage Example
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

export function UsersTable({ users }: { users: User[] }) {
  return (
    <DataTable
      data={users}
      searchable
      searchPlaceholder="Search users..."
      columns={[
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Role", accessor: "role", className: "capitalize" },
        {
          header: "Status",
          accessor: (row) => (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                row.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800",
              )}
            >
              {row.status}
            </span>
          ),
        },
        {
          header: "Actions",
          accessor: (row) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600">
                Delete
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
```

### Example 3: Mobile-First Navigation Component

```tsx
// components/navigation/navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="font-bold text-xl">Brand</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-screen border-b" : "max-h-0",
        )}
      >
        <div className="container mx-auto px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 space-y-2 border-t">
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Example 4: Accessible Form Components

```tsx
// components/forms/input-field.tsx
import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        <Input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={cn(
            hint && hintId,
            error && errorId
          )}
          className={cn(error && "border-destructive", className)}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)

InputField.displayName = 'InputField'

// Usage
<InputField
  label="Email"
  type="email"
  required
  hint="We'll never share your email"
  error={errors.email?.message}
  {...register('email')}
/>
```

## Responsive Design Patterns

### Breakpoint Strategy

```tsx
// Mobile First Approach
<div className="
  w-full              // Mobile: full width
  md:w-1/2            // Tablet: half width
  lg:w-1/3            // Desktop: third width
  xl:w-1/4            // Large: quarter width
">
  Content
</div>

// Grid Responsive Pattern
<div className="
  grid
  grid-cols-1         // Mobile: 1 column
  sm:grid-cols-2      // Small: 2 columns
  md:grid-cols-3      // Medium: 3 columns
  lg:grid-cols-4      // Large: 4 columns
  gap-4               // Consistent gap
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Flex Responsive Pattern
<div className="
  flex
  flex-col            // Mobile: stack vertically
  md:flex-row         // Tablet+: horizontal
  gap-6
">
  <aside className="md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

## Accessibility Checklist

```tsx
// ✅ Semantic HTML
<nav>...</nav>
<main>...</main>
<article>...</article>

// ✅ ARIA Labels
<button aria-label="Close menu">
  <X className="h-4 w-4" />
</button>

// ✅ Focus Management
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</Button>

// ✅ Keyboard Navigation
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleAction()
  }
}}

// ✅ Color Contrast (WCAG AA minimum)
// Use Tailwind's default colors which meet contrast requirements
<p className="text-foreground bg-background">
  High contrast text
</p>

// ✅ Screen Reader Text
<span className="sr-only">
  This text is only for screen readers
</span>
```

## Animation Best Practices

```tsx
// Framer Motion - Stagger Children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Tailwind Animations
<div className="
  animate-fade-in      // Fade in on mount
  hover:animate-pulse  // Pulse on hover
  transition-all       // Smooth transitions
  duration-300         // 300ms duration
">
  Content
</div>

// Reduced Motion Support
<motion.div
  initial={{ opacity: 0, x: -100 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{
    duration: 0.5,
    // Respect user's motion preferences
    ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? { duration: 0 }
      : {})
  }}
>
  Animated content
</motion.div>
```
