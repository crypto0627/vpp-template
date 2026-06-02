---
name: design-schema
description: Designs and modifies Prisma database schemas with relationships, indexes, and constraints. Use when modeling data or when user asks "create database schema" or "設計資料庫結構".
---

# Design Schema Skill

When designing database schemas, create normalized, efficient, and maintainable data models using Prisma ORM.

## The Five Principles of Schema Design

When modeling any database, always follow these principles:

1. **Normalize data**: Avoid duplication, use relationships
2. **Use proper types**: Choose appropriate field types
3. **Add indexes**: For frequently queried fields
4. **Define constraints**: Unique, default values, cascades
5. **Use enums**: For fixed sets of values

## Quick Schema Template

```prisma
// User with One-to-One Profile
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  name     String
  profile  Profile?
  posts    Post[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Profile {
  id     String @id @default(cuid())
  bio    String? @db.Text
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// Post with Many-to-Many Tags
model Post {
  id        String @id @default(cuid())
  title     String
  authorId  String
  author    User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      Tag[]  @relation("PostTags")

  @@index([authorId])
  @@map("posts")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[] @relation("PostTags")

  @@map("tags")
}
```

## Relationship Types

```
One-to-One:   User ↔ Profile (userId @unique)
One-to-Many:  User → Posts (authorId)
Many-to-Many: Posts ↔ Tags (join table auto-created)
```

## Essential Migration Commands

```bash
npx prisma generate           # Generate client
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Production
npx prisma studio             # GUI viewer
npx prisma format             # Format schema
```

## Common Gotcha

**Self-relations need explicit names**: When a model references itself (like nested comments), you must name both sides of the relation:

```prisma
model Comment {
  id       String    @id
  parentId String?
  parent   Comment?  @relation("Replies", fields: [parentId], references: [id])
  replies  Comment[] @relation("Replies")
}
```

## Analogy

Designing a schema is like architecting a city:

- **Models** = Buildings
- **Relationships** = Roads connecting them
- **Indexes** = Highways for quick access
- **Constraints** = Zoning laws ensuring rules are followed

## Learn More

For complete examples including advanced relationships, enums, indexes, and migration strategies, see [./references/complete-examples.md](./references/complete-examples.md).
