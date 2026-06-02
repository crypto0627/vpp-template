# Complete Database Schema Design Examples

Comprehensive Prisma schema patterns with relationships, indexes, and advanced features.

## Complete E-commerce Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          UserRole  @default(USER)
  emailVerified DateTime?

  profile       Profile?
  addresses     Address[]
  orders        Order[]
  cart          CartItem[]
  reviews       Review[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@map("users")
}

model Profile {
  id        String   @id @default(cuid())
  bio       String?  @db.Text
  avatar    String?
  phone     String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Address {
  id        String  @id @default(cuid())
  street    String
  city      String
  state     String
  zipCode   String
  country   String  @default("USA")
  isDefault Boolean @default(false)

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders    Order[]

  @@index([userId])
  @@map("addresses")
}

// Product Catalog
model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  images      String[]
  featured    Boolean  @default(false)

  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])

  cartItems   CartItem[]
  orderItems  OrderItem[]
  reviews     Review[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([categoryId])
  @@index([featured])
  @@map("products")
}

model Category {
  id          String     @id @default(cuid())
  name        String     @unique
  slug        String     @unique
  description String?
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]

  @@index([slug])
  @@map("categories")
}

// Shopping Cart
model CartItem {
  id        String  @id @default(cuid())
  quantity  Int     @default(1)

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId])
  @@index([userId])
  @@map("cart_items")
}

// Orders
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  status        OrderStatus   @default(PENDING)
  subtotal      Decimal       @db.Decimal(10, 2)
  tax           Decimal       @db.Decimal(10, 2)
  shipping      Decimal       @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)

  userId        String
  user          User          @relation(fields: [userId], references: [id])

  addressId     String
  address       Address       @relation(fields: [addressId], references: [id])

  items         OrderItem[]
  payment       Payment?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Decimal @db.Decimal(10, 2)

  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}

model Payment {
  id              String        @id @default(cuid())
  amount          Decimal       @db.Decimal(10, 2)
  status          PaymentStatus @default(PENDING)
  method          String
  transactionId   String?       @unique

  orderId         String        @unique
  order           Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status])
  @@map("payments")
}

// Reviews
model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1-5
  title     String
  comment   String?  @db.Text

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId])
  @@index([productId])
  @@index([rating])
  @@map("reviews")
}
```

## Advanced Patterns

### Self-Referencing Relations (Category Tree)

```prisma
model Category {
  id       String     @id @default(cuid())
  name     String
  parentId String?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
}

// Usage:
// Electronics
//   ├─ Laptops
//   ├─ Phones
//   └─ Accessories
//        ├─ Cases
//        └─ Chargers
```

### Composite Unique Constraints

```prisma
model CartItem {
  userId    String
  productId String

  @@unique([userId, productId]) // User can only have one cart item per product
}
```

### Composite Indexes for Performance

```prisma
model Post {
  authorId  String
  published Boolean

  @@index([authorId, published]) // Fast lookup for "user's published posts"
}
```

### Custom ID Generation

```prisma
model Order {
  id          String @id @default(cuid())
  orderNumber String @unique @default(uuid()) // Human-readable order number
}
```

### JSON Fields

```prisma
model Product {
  id         String @id @default(cuid())
  metadata   Json?  // Store flexible data
  attributes Json?  // Example: { "color": "red", "size": "L" }
}
```

### Full-Text Search (PostgreSQL)

```prisma
model Post {
  id      String @id @default(cuid())
  title   String
  content String @db.Text

  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

## Migration Best Practices

```bash
# Development workflow
npx prisma migrate dev --name add_user_profile
npx prisma generate

# Production deployment
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only
```

## Schema Organization Tips

```prisma
// Group related models together with comments

// ============================================
// Authentication & Users
// ============================================
model User { }
model Profile { }
model Session { }

// ============================================
// Content Management
// ============================================
model Post { }
model Comment { }
model Tag { }

// ============================================
// E-commerce
// ============================================
model Product { }
model Order { }
model Payment { }
```
