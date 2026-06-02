---
name: integrate-api
description: Integrates external APIs with proper error handling, caching, and type safety. Use when connecting to third-party services or when user asks "integrate API" or "串接 API".
---

When integrating APIs, always include:

1. **Type-safe client**: Define TypeScript interfaces and Zod schemas for API responses
2. **Error handling**: Handle network errors, timeouts, HTTP status codes, and rate limits
3. **Caching strategy**: Use Next.js cache, React cache, or Redis for performance
4. **Environment variables**: Store API keys securely in .env (never in client code)
5. **Loading states**: Provide user feedback during API calls with loading indicators

## Quick Start Example

```typescript
// Type-safe API client with Zod validation
import { z } from "zod";

const weatherSchema = z.object({
  temp_c: z.number(),
  condition: z.object({
    text: z.string(),
    icon: z.string(),
  }),
});

export class WeatherAPI {
  async getCurrentWeather(city: string) {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?q=${city}`,
      {
        headers: { Authorization: `Bearer ${process.env.WEATHER_API_KEY}` },
        next: { revalidate: 1800 }, // Cache for 30 minutes
      },
    );

    if (!response.ok) throw new Error("Failed to fetch weather");

    const data = await response.json();
    return weatherSchema.parse(data); // Runtime validation
  }
}
```

## Integration Checklist

```
Setup:
  ☐ Create API client class
  ☐ Define Zod schemas for responses
  ☐ Store API keys in environment variables
  ☐ Add TypeScript types

Error Handling:
  ☐ Handle network errors
  ☐ Handle API errors (4xx, 5xx)
  ☐ Add retry logic for transient failures
  ☐ Display user-friendly error messages

Performance:
  ☐ Implement caching strategy
  ☐ Add rate limiting if needed
  ☐ Use Server Components when possible
  ☐ Consider request deduplication

Security:
  ☐ Never expose API keys to client
  ☐ Validate all inputs
  ☐ Use HTTPS
  ☐ Implement CORS if needed
```

## Common Gotcha

**API keys in client code**: Never put API keys directly in client components or expose them via `NEXT_PUBLIC_` environment variables. Always proxy API calls through your own API routes to keep keys secure on the server.

## Analogy

Integrating an API is like connecting your house to utilities. The API client is your service connection, error handling is the circuit breaker, caching is the water tank (so you don't always need to draw from the source), and rate limiting is the meter that prevents overuse.

## Learn More

For complete API integration patterns (retry logic, rate limiting, proxying), see [./references/complete-examples.md](./references/complete-examples.md)
