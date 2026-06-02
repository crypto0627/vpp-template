---
name: optimize-performance
description: Optimizes Next.js app performance through code splitting, image optimization, caching, and database query optimization. Use when improving performance or when user asks "optimize performance" or "效能優化".
---

When optimizing performance, always measure:

1. **Benchmark first**: Use Lighthouse, Web Vitals, React DevTools to establish baseline
2. **Identify bottlenecks**: Find the slowest operations causing performance issues
3. **Optimize strategically**: Focus on high-impact changes that matter most
4. **Measure again**: Verify improvements with metrics before and after
5. **Don't over-optimize**: Balance performance gains vs code complexity

## Quick Start Example

```tsx
// Image optimization with Next.js Image component
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
  quality={85}
/>

// Dynamic imports for code splitting
const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false,
})
```

## Performance Optimization Layers

```
1. Network & Assets
   - Image optimization (Next.js Image)
   - Code splitting (dynamic imports)
   - Compression (gzip/brotli)

2. Rendering Strategy
   - Server Components (default)
   - Static Generation
   - ISR (Incremental Static Regeneration)

3. React Performance
   - Memoization (useMemo, useCallback)
   - Lazy loading (React.lazy)
   - Virtualization (long lists)

4. Database & API
   - Query optimization
   - Caching (Next.js cache, Redis)
   - Connection pooling
```

## Performance Metrics

```
Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

Other Metrics:
- FCP (First Contentful Paint): < 1.8s
- TTFB (Time to First Byte): < 600ms
- Bundle Size: < 200KB (gzipped)
```

## Common Gotcha

**Premature optimization**: Always measure before optimizing. Use Chrome DevTools Performance tab and Lighthouse to identify real bottlenecks. Don't optimize things that aren't actually slow.

## Analogy

Optimizing performance is like tuning a car engine. You need to know what each part does, measure current performance (benchmark), identify the bottleneck (diagnostic), make targeted improvements (tune), and verify the results (test drive). Changing random parts won't make the car faster.

## Learn More

For complete optimization techniques and examples, see [./references/complete-examples.md](./references/complete-examples.md)
