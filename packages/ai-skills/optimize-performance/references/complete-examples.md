# Complete Performance Optimization Examples

## 1. Image Optimization

```tsx
import Image from 'next/image'

// ❌ WRONG: Regular img tag
<img src="/hero.jpg" alt="Hero" />

// ✅ CORRECT: Next.js Image component
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // For above-the-fold images
  quality={85}  // Default: 75
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// External images require domains config
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
}
```

## 2. Code Splitting

```tsx
// Dynamic imports for heavy components
import dynamic from "next/dynamic";

// ❌ WRONG: Import everything upfront
import Chart from "@/components/charts/complex-chart";

// ✅ CORRECT: Lazy load with dynamic import
const Chart = dynamic(() => import("@/components/charts/complex-chart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR for client-only components
});

// Route-based code splitting (automatic in Next.js)
// Each page is automatically code-split

// Component-level code splitting
const HeavyModal = dynamic(() => import("@/components/modals/heavy-modal"));

export function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Open</Button>
      {showModal && <HeavyModal />} // Only loads when opened
    </>
  );
}
```

## 3. Server Components (Default in Next.js)

```tsx
// ✅ Server Component (default - no 'use client')
// Runs on server, sends HTML to client
export default async function ProductPage({ params }) {
  const { id } = await params;

  // Direct database access
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return (
    <div>
      <h1>{product.name}</h1>
      <ProductClient product={product} /> // Client component
    </div>
  );
}

// ✅ Client Component (when needed)
// Only mark as client when you need:
// - useState, useEffect, event handlers
// - Browser APIs
("use client");

export function ProductClient({ product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <Button onClick={() => setQuantity(quantity + 1)}>
      Add {quantity} to cart
    </Button>
  );
}
```

## 4. React Memoization

```tsx
"use client";
import { memo, useMemo, useCallback } from "react";

// ❌ WRONG: Re-renders on every parent render
export function ExpensiveList({ items, filter }) {
  const filtered = items.filter((item) => item.category === filter);
  return (
    <>
      {filtered.map((item) => (
        <Item key={item.id} data={item} />
      ))}
    </>
  );
}

// ✅ CORRECT: Memoize expensive calculations
export function ExpensiveList({ items, filter }) {
  const filtered = useMemo(() => {
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  return (
    <>
      {filtered.map((item) => (
        <Item key={item.id} data={item} />
      ))}
    </>
  );
}

// Memoize components
const Item = memo(function Item({ data }) {
  return <div>{data.name}</div>;
});

// Memoize callbacks
export function Parent() {
  const [count, setCount] = useState(0);

  // ❌ WRONG: New function on every render
  const handleClick = () => setCount(count + 1);

  // ✅ CORRECT: Stable function reference
  const handleClick = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return <Child onClick={handleClick} />;
}
```

## 5. Database Query Optimization

```typescript
// ❌ WRONG: N+1 query problem
const users = await prisma.user.findMany()
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  })
}

// ✅ CORRECT: Use include/select
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
})

// ✅ BETTER: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
})

// ✅ BEST: Add indexes for frequently queried fields
// prisma/schema.prisma
model Post {
  id        String   @id
  title     String
  published Boolean
  authorId  String

  @@index([authorId])         // Index foreign key
  @@index([published])        // Index filter field
  @@index([authorId, published])  // Composite index
}
```

## 6. Caching Strategies

```typescript
// Next.js fetch with caching
async function getData() {
  // Cache forever (default)
  const res = await fetch("https://api.example.com/data", {
    cache: "force-cache",
  });

  // Revalidate every 60 seconds
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 60 },
  });

  // No caching
  const res = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });

  return res.json();
}

// React cache for deduplication
import { cache } from "react";

const getUser = cache(async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
});

// Multiple components can call getUser with same ID
// Only one database query will be made
```

## 7. Virtualization for Long Lists

```tsx
"use client";
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: "500px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 8. Bundle Analysis

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Analyze bundle
ANALYZE=true npm run build
```

## 9. Web Vitals Monitoring

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

// Custom reporting
("use client");
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
    // Send to analytics
  });
}
```

## 10. Compression

```javascript
// next.config.js
module.exports = {
  compress: true, // Gzip compression (enabled by default)

  // Production optimizations
  swcMinify: true,

  // Remove console.logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};
```
