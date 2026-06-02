---
name: analyze-codebase
description: Analyzes project structure, dependencies, and architecture. Use when understanding a new project, onboarding, or when user asks "analyze this codebase" or "分析專案結構".
---

# Analyze Codebase Skill

When analyzing a codebase, provide a structured overview that helps developers quickly understand the project architecture and make informed decisions.

## The Five-Step Analysis Pattern

When analyzing any codebase, always follow this sequence:

1. **Start with dependencies**: Check `package.json` to identify the tech stack
2. **Map the architecture**: Draw a directory tree with explanations
3. **Identify entry points**: Pages, API routes, and main components
4. **Check data flow**: How data moves through the application
5. **Highlight patterns**: State management, routing, styling approaches

## Quick Analysis Template

```
📦 Project: [Name]
├── Tech Stack: Next.js 16, React 19, TypeScript, Prisma
└── Architecture: App Router with Server Components

📁 Key Directories
/app                    → Next.js App Router
  /(auth)              → Auth pages (route group - no URL segment)
  /(dashboard)         → Protected dashboard routes
  /api                 → API endpoints

/components             → React components
  /ui                  → shadcn/ui reusable components
  /features            → Feature-specific components

/lib                    → Utilities & configurations
  /prisma.ts           → Database client singleton
  /stores              → Zustand state stores
  /validations         → Zod schemas

🔄 Data Flow
User → Server Component → API Route → Prisma → PostgreSQL
                       ↓
                Client Component ← Zustand Store
```

## Key Insights Checklist

Answer these questions in every analysis:

```
Routing:
  □ App Router or Pages Router?
  □ Route groups used?
  □ Dynamic routes present?

Styling:
  □ Tailwind CSS? CSS Modules? styled-components?
  □ Design system in place?
  □ Theme support?

State Management:
  □ Zustand? Context? Redux?
  □ Local state vs global state balance?
  □ Persistence strategy?

Data Fetching:
  □ Server Components? Client-side?
  □ React Query? SWR?
  □ Caching strategy?

Database:
  □ Prisma? Direct SQL? MongoDB?
  □ Migration system?
  □ Seed data available?

Authentication:
  □ JWT? NextAuth? Custom?
  □ Where is auth state stored?
  □ Protected routes implementation?
```

## Technology Stack Analysis Example

```
✅ Next.js 16 (App Router)
   Why: Server Components, built-in routing, optimized builds
   Trade-offs: Learning curve vs performance benefits

✅ TypeScript 5.9
   Why: Type safety, better DX, self-documenting
   Trade-offs: Setup overhead vs bug prevention

✅ Prisma ORM
   Why: Type-safe queries, migrations, great DX
   Trade-offs: CRUD convenience vs complex query flexibility
```

## Common Gotcha

Don't just list files - explain the **why** behind architectural decisions:

- Why are routes grouped? (Shared layouts, logical organization)
- Why Server Components by default? (Performance, smaller bundles)
- Why this state management? (Matches app complexity)

## Analogy

Analyzing a codebase is like being a detective entering a crime scene:

- **Map the layout** (directory structure)
- **Identify key evidence** (entry points, configs)
- **Trace the timeline** (data flow)
- **Understand the motive** (architectural decisions & trade-offs)

## Learn More

For detailed examples including complete directory structure analysis, data flow diagrams, and legacy codebase assessment, see [./references/complete-examples.md](./references/complete-examples.md).
