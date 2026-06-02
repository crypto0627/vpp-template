---
name: refactor-code
description: Improves code quality, readability, and maintainability through systematic refactoring. Use when cleaning up code or when user asks "refactor code" or "重構程式碼".
---

When refactoring code, always:

1. **Have tests first**: Ensure existing functionality works
2. **Refactor in small steps**: One change at a time
3. **Keep tests green**: Run tests after each change
4. **Extract patterns**: DRY (Don't Repeat Yourself)
5. **Improve names**: Make code self-documenting

## Refactoring Patterns

### 1. Extract Function

```typescript
// ❌ BEFORE: Long, complex function
export async function createOrder(data: any) {
  if (!data.items || data.items.length === 0) {
    throw new Error("Items required");
  }

  const total = data.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  if (data.discount) {
    total = total * (1 - data.discount / 100);
  }

  const tax = total * 0.1;
  const finalTotal = total + tax;

  const order = await prisma.order.create({
    data: {
      userId: data.userId,
      total: finalTotal,
      items: { create: data.items },
    },
  });

  await sendEmail(data.userId, "Order created", `Your order #${order.id}`);

  return order;
}

// ✅ AFTER: Extracted to focused functions
export async function createOrder(data: CreateOrderInput) {
  validateOrderData(data);

  const pricing = calculatePricing(data.items, data.discount);

  const order = await saveOrder({
    userId: data.userId,
    total: pricing.finalTotal,
    items: data.items,
  });

  await notifyOrderCreated(data.userId, order.id);

  return order;
}

function validateOrderData(data: CreateOrderInput) {
  if (!data.items?.length) {
    throw new Error("Items required");
  }
}

function calculatePricing(items: OrderItem[], discount?: number) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discounted = discount ? subtotal * (1 - discount / 100) : subtotal;

  const tax = discounted * 0.1;
  const finalTotal = discounted + tax;

  return { subtotal, discounted, tax, finalTotal };
}

async function saveOrder(data: OrderData) {
  return prisma.order.create({
    data: {
      userId: data.userId,
      total: data.total,
      items: { create: data.items },
    },
  });
}

async function notifyOrderCreated(userId: string, orderId: string) {
  await sendEmail(userId, "Order created", `Your order #${orderId}`);
}
```

### 2. Extract Custom Hook

```typescript
// ❌ BEFORE: Repeated logic in components
function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{user.name}</div>
}

function UserSettings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // ... same pattern repeated
}

// ✅ AFTER: Custom hook
function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { user, loading, error }
}

// Usage
function UserProfile() {
  const { user, loading, error } = useUser()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{user.name}</div>
}
```

### 3. Replace Conditional with Polymorphism

```typescript
// ❌ BEFORE: Type checking everywhere
function processPayment(payment: Payment) {
  if (payment.type === "credit_card") {
    return processCreditCard(payment);
  } else if (payment.type === "paypal") {
    return processPayPal(payment);
  } else if (payment.type === "crypto") {
    return processCrypto(payment);
  }
}

// ✅ AFTER: Strategy pattern
interface PaymentProcessor {
  process(payment: Payment): Promise<PaymentResult>;
}

class CreditCardProcessor implements PaymentProcessor {
  async process(payment: Payment) {
    // Credit card logic
  }
}

class PayPalProcessor implements PaymentProcessor {
  async process(payment: Payment) {
    // PayPal logic
  }
}

class CryptoProcessor implements PaymentProcessor {
  async process(payment: Payment) {
    // Crypto logic
  }
}

const processors: Record<PaymentType, PaymentProcessor> = {
  credit_card: new CreditCardProcessor(),
  paypal: new PayPalProcessor(),
  crypto: new CryptoProcessor(),
};

function processPayment(payment: Payment) {
  const processor = processors[payment.type];
  return processor.process(payment);
}
```

### 4. Introduce Parameter Object

```typescript
// ❌ BEFORE: Too many parameters
function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
  address: string,
  city: string,
  country: string,
) {
  // ...
}

// ✅ AFTER: Parameter object
interface CreateUserParams {
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  contact: {
    phone: string;
    address: string;
    city: string;
    country: string;
  };
}

function createUser(params: CreateUserParams) {
  // ...
}

// Usage
createUser({
  email: "user@example.com",
  password: "secure123",
  profile: {
    firstName: "John",
    lastName: "Doe",
  },
  contact: {
    phone: "+1234567890",
    address: "123 Main St",
    city: "New York",
    country: "USA",
  },
});
```

### 5. Replace Magic Numbers with Constants

```typescript
// ❌ BEFORE: Magic numbers everywhere
function calculateDiscount(price: number, customerType: string) {
  if (customerType === "premium") {
    return price * 0.15; // What's 0.15?
  } else if (customerType === "regular") {
    return price * 0.05; // What's 0.05?
  }
  return 0;
}

function isPremium(orderTotal: number) {
  return orderTotal > 1000; // Why 1000?
}

// ✅ AFTER: Named constants
const DISCOUNT_RATES = {
  PREMIUM: 0.15, // 15% discount for premium customers
  REGULAR: 0.05, // 5% discount for regular customers
} as const;

const PREMIUM_THRESHOLD = 1000; // $1000 order minimum

function calculateDiscount(price: number, customerType: string) {
  if (customerType === "premium") {
    return price * DISCOUNT_RATES.PREMIUM;
  } else if (customerType === "regular") {
    return price * DISCOUNT_RATES.REGULAR;
  }
  return 0;
}

function isPremium(orderTotal: number) {
  return orderTotal > PREMIUM_THRESHOLD;
}
```

### 6. Simplify Conditional Logic

```typescript
// ❌ BEFORE: Nested conditions
function canUserAccess(user: User, resource: Resource) {
  if (user) {
    if (user.isActive) {
      if (user.role === "admin") {
        return true;
      } else if (user.role === "user") {
        if (resource.isPublic) {
          return true;
        } else if (resource.ownerId === user.id) {
          return true;
        }
      }
    }
  }
  return false;
}

// ✅ AFTER: Early returns
function canUserAccess(user: User, resource: Resource) {
  if (!user || !user.isActive) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (user.role === "user") {
    return resource.isPublic || resource.ownerId === user.id;
  }

  return false;
}
```

### 7. Improve Type Safety

```typescript
// ❌ BEFORE: Loose types
function processData(data: any) {
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    value: item.value,
  }));
}

// ✅ AFTER: Strict types
interface DataItem {
  id: string;
  name: string;
  value: number;
}

interface ProcessedItem {
  id: string;
  name: string;
  value: number;
}

function processData(data: DataItem[]): ProcessedItem[] {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
  }));
}
```

### 8. Extract Service Layer

```typescript
// ❌ BEFORE: Business logic in API routes
// app/api/users/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
    },
  });

  await sendEmail(user.email, "Welcome!");

  return NextResponse.json(user);
}

// ✅ AFTER: Service layer
// services/user-service.ts
export class UserService {
  async createUser(data: CreateUserInput) {
    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
    });

    await this.emailService.sendWelcome(user.email);

    return user;
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}

// app/api/users/route.ts
const userService = new UserService();

export async function POST(req: Request) {
  const body = await req.json();
  const user = await userService.createUser(body);
  return NextResponse.json(user);
}
```

## Refactoring Checklist

```
Before Refactoring:
  ☐ Have test coverage
  ☐ Commit current code
  ☐ Identify the problem

During Refactoring:
  ☐ Make one change at a time
  ☐ Run tests after each change
  ☐ Improve naming
  ☐ Remove duplication

After Refactoring:
  ☐ All tests pass
  ☐ Code is more readable
  ☐ Performance hasn't degraded
  ☐ Commit with clear message
```

## Code Smells to Look For

```
Long Functions (> 20 lines)
  → Extract smaller functions

Duplicated Code
  → Extract to reusable function/component

Too Many Parameters (> 3)
  → Use parameter object

Magic Numbers/Strings
  → Extract to named constants

Deep Nesting (> 3 levels)
  → Use early returns, extract functions

Large Classes (> 200 lines)
  → Split into smaller classes

Long Parameter Lists
  → Use objects, builder pattern

Comments Explaining Code
  → Improve naming instead
```

## Common Gotcha

**Big bang refactoring**: Don't try to refactor everything at once. Make small, incremental improvements. Each refactoring should be independently commit-able and tested.

**Analogy**: Refactoring is like organizing a messy room. You don't throw everything out and start over. Instead, you group similar items (extract functions), label boxes clearly (better naming), and create a system that makes things easy to find (patterns). One section at a time, test that you can still find what you need.
