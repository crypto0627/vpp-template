---
name: integrate-api
description: Integrates external APIs with proper error handling, caching, and type safety. Use when connecting to third-party services or when user asks "integrate API" or "串接 API".
---

When integrating APIs, always include:

1. **Type-safe client**: Define TypeScript interfaces for responses
2. **Error handling**: Handle network errors, timeouts, rate limits
3. **Caching strategy**: Use Next.js cache or Redis
4. **Environment variables**: Store API keys securely
5. **Loading states**: Provide feedback during API calls

## API Client Pattern

```typescript
// lib/api/base-client.ts
import { z } from "zod";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class BaseAPIClient {
  constructor(
    private baseUrl: string,
    private apiKey?: string,
  ) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          response.status,
          await response.json().catch(() => null),
        );
      }

      const data = await response.json();

      // Validate response with Zod
      if (schema) {
        return schema.parse(data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) throw error;

      throw new APIError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      );
    }
  }

  protected get<T>(
    endpoint: string,
    schema?: z.ZodSchema<T>,
    options?: RequestInit,
  ): Promise<T> {
    return this.request(endpoint, { method: "GET", ...options }, schema);
  }

  protected post<T>(
    endpoint: string,
    body: any,
    schema?: z.ZodSchema<T>,
    options?: RequestInit,
  ): Promise<T> {
    return this.request(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
        ...options,
      },
      schema,
    );
  }
}
```

## Example: Weather API Integration

```typescript
// lib/api/weather.ts
import { z } from "zod";
import { BaseAPIClient } from "./base-client";

// Response schemas
const weatherSchema = z.object({
  current: z.object({
    temp_c: z.number(),
    condition: z.object({
      text: z.string(),
      icon: z.string(),
    }),
    humidity: z.number(),
    wind_kph: z.number(),
  }),
  location: z.object({
    name: z.string(),
    country: z.string(),
  }),
});

export type Weather = z.infer<typeof weatherSchema>;

export class WeatherAPI extends BaseAPIClient {
  constructor() {
    super("https://api.weatherapi.com/v1", process.env.WEATHER_API_KEY);
  }

  async getCurrentWeather(city: string): Promise<Weather> {
    return this.get(
      `/current.json?q=${encodeURIComponent(city)}`,
      weatherSchema,
      {
        // Cache for 30 minutes
        next: { revalidate: 1800 },
      },
    );
  }

  async getForecast(city: string, days: number = 3) {
    const forecastSchema = weatherSchema.extend({
      forecast: z.object({
        forecastday: z.array(
          z.object({
            date: z.string(),
            day: z.object({
              maxtemp_c: z.number(),
              mintemp_c: z.number(),
              condition: z.object({
                text: z.string(),
                icon: z.string(),
              }),
            }),
          }),
        ),
      }),
    });

    return this.get(
      `/forecast.json?q=${encodeURIComponent(city)}&days=${days}`,
      forecastSchema,
    );
  }
}

// Singleton instance
export const weatherAPI = new WeatherAPI();
```

## Server Component Usage

```tsx
// app/weather/[city]/page.tsx
import { weatherAPI } from "@/lib/api/weather";
import { WeatherCard } from "@/components/weather/weather-card";

export default async function WeatherPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  try {
    const weather = await weatherAPI.getCurrentWeather(city);

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">
          Weather in {weather.location.name}
        </h1>
        <WeatherCard weather={weather} />
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4 text-red-500">
          Failed to load weather data
        </h1>
        <p>Please try again later.</p>
      </div>
    );
  }
}
```

## Client Component Usage

```tsx
// components/weather/weather-search.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function WeatherSearch() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(city)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather");
      }

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Search
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {weather && <WeatherDisplay weather={weather} />}
    </div>
  );
}
```

## API Route with Caching

```typescript
// app/api/weather/route.ts
import { NextRequest, NextResponse } from "next/server";
import { weatherAPI } from "@/lib/api/weather";
import { z } from "zod";

const querySchema = z.object({
  city: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { city } = querySchema.parse({
      city: searchParams.get("city"),
    });

    const weather = await weatherAPI.getCurrentWeather(city);

    return NextResponse.json(weather, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 },
    );
  }
}
```

## Rate Limiting

```typescript
// lib/api/rate-limiter.ts
import { LRUCache } from "lru-cache";

type RateLimitOptions = {
  interval: number; // ms
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];

      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
      }

      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage > limit;

      return {
        isRateLimited,
        remaining: isRateLimited ? 0 : limit - currentUsage,
      };
    },
  };
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export async function GET(req: NextRequest) {
  const ip = req.ip ?? "anonymous";
  const { isRateLimited } = limiter.check(ip, 10); // 10 requests per minute

  if (isRateLimited) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Process request...
}
```

## Retry Logic

```typescript
// lib/api/retry.ts
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {},
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(backoff, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}

// Usage
const data = await fetchWithRetry(() => weatherAPI.getCurrentWeather("Tokyo"), {
  maxRetries: 3,
  delay: 1000,
});
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

**Analogy**: Integrating an API is like connecting your house to utilities. The API client is your service connection, error handling is the circuit breaker, caching is the water tank (so you don't always need to draw from the source), and rate limiting is the meter that prevents overuse.
