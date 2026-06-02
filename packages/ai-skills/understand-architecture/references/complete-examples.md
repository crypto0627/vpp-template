# Complete Architecture Examples

## Next.js App Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Client Components                    │ │
│  │  - Interactive UI (useState, useEffect)                │ │
│  │  - Event handlers                                      │ │
│  │  - Browser APIs                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS SERVER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Server Components (RSC)                │ │
│  │  - Async data fetching                                 │ │
│  │  - Direct database access                              │ │
│  │  - Server-side rendering                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                             ↕                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 API Routes                             │ │
│  │  - RESTful endpoints                                   │ │
│  │  - Authentication                                      │ │
│  │  - Business logic                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                             ↕                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Service Layer (Optional)                  │ │
│  │  - Business logic                                      │ │
│  │  - Data transformation                                 │ │
│  │  - External API integration                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Prisma ORM                             │ │
│  │  - Type-safe queries                                   │ │
│  │  - Migrations                                          │ │
│  │  - Schema management                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                             ↕                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                       │ │
│  │  - Persistent storage                                  │ │
│  │  - ACID transactions                                   │ │
│  │  - Complex queries                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure Explained

```
my-nextjs-app/
├── app/                      # App Router (Next.js 13+)
│   ├── (auth)/              # Route group (layout isolation)
│   │   ├── login/
│   │   │   └── page.tsx     # /login route
│   │   └── signup/
│   │       └── page.tsx     # /signup route
│   │
│   ├── (dashboard)/         # Protected routes group
│   │   ├── layout.tsx       # Shared dashboard layout
│   │   ├── page.tsx         # /dashboard route
│   │   └── settings/
│   │       └── page.tsx     # /dashboard/settings route
│   │
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   │   └── route.ts     # POST /api/auth
│   │   └── users/
│   │       ├── route.ts     # GET, POST /api/users
│   │       └── [id]/
│   │           └── route.ts # GET, PATCH, DELETE /api/users/:id
│   │
│   ├── layout.tsx           # Root layout (wraps all pages)
│   ├── page.tsx             # Homepage (/)
│   ├── loading.tsx          # Loading UI
│   ├── error.tsx            # Error boundary
│   └── not-found.tsx        # 404 page
│
├── components/              # React components
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   │
│   └── features/            # Feature-specific components
│       ├── auth/
│       │   ├── login-form.tsx
│       │   └── signup-form.tsx
│       └── posts/
│           ├── post-list.tsx
│           └── post-card.tsx
│
├── lib/                     # Utilities and configurations
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # JWT utilities
│   ├── utils.ts            # Helper functions (cn, etc.)
│   ├── validations/        # Zod schemas
│   │   ├── auth.ts
│   │   └── user.ts
│   └── stores/             # Zustand stores
│       ├── user-store.ts
│       └── cart-store.ts
│
├── prisma/                  # Database
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts            # Seed data
│
├── public/                  # Static files
│   ├── images/
│   └── fonts/
│
├── __tests__/              # Tests
│   ├── components/         # Component tests
│   ├── api/               # API route tests
│   └── e2e/               # End-to-end tests
│
├── .env                    # Environment variables (gitignored)
├── .env.example           # Example env file
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## Request Flow Examples

### 1. Page Request Flow (Server Component)

```
User visits /dashboard
       ↓
Next.js Router matches route
       ↓
Executes Server Component (app/dashboard/page.tsx)
       ↓
Fetches data from Prisma
       ↓
Renders HTML on server
       ↓
Sends HTML + minimal JS to client
       ↓
Browser hydrates interactive elements
       ↓
Page is interactive
```

### 2. API Request Flow

```
Client calls fetch('/api/users')
       ↓
Next.js routes to app/api/users/route.ts
       ↓
Verifies JWT token (authentication)
       ↓
Validates request with Zod schema
       ↓
Calls Prisma to query database
       ↓
Transforms data (if needed)
       ↓
Returns JSON response
       ↓
Client receives data
```

## Design Pattern Examples

### Repository Pattern (Data Access)

```typescript
// lib/repositories/user-repository.ts
export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data });
  }
}

// Usage in API route
const userRepository = new UserRepository();
const user = await userRepository.findById(id);
```

### Service Layer Pattern (Business Logic)

```typescript
// services/user-service.ts
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
  ) {}

  async createUser(data: CreateUserInput) {
    // Business logic
    const hashedPassword = await this.hashPassword(data.password);

    // Data access
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Side effects
    await this.emailService.sendWelcome(user.email);

    return user;
  }
}
```

## Architectural Decisions & Trade-offs

### App Router vs Pages Router

```
✅ App Router (Current)
- Server Components by default (better performance)
- Nested layouts
- Streaming and suspense
- Better TypeScript support

❌ Pages Router (Legacy)
- Simpler mental model
- More mature ecosystem
- Better documentation (for now)
```

### Server Components vs Client Components

```
✅ Server Components (Default)
- Direct database access
- No JavaScript sent to client
- Better performance
- Automatic code splitting

✅ Client Components ('use client')
- Interactivity (useState, useEffect)
- Event handlers
- Browser APIs
- Third-party libraries that need window
```

## Key Principles

```
1. Separation of Concerns
   - UI components focus on presentation
   - Services handle business logic
   - Repositories manage data access

2. Single Responsibility
   - Each function/component has one job
   - Easy to test and maintain

3. DRY (Don't Repeat Yourself)
   - Extract reusable components
   - Create utility functions
   - Use hooks for shared logic

4. Dependency Injection
   - Pass dependencies as parameters
   - Makes testing easier
   - Loose coupling

5. Progressive Enhancement
   - Server-first (works without JS)
   - Add interactivity where needed
   - Graceful degradation
```
