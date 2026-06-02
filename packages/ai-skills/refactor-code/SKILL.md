---
name: refactor-code
description: Improves code quality, readability, and maintainability through systematic refactoring. Use when cleaning up code or when user asks "refactor code" or "重構程式碼".
---

When refactoring code, always:

1. **Have tests first**: Ensure existing functionality is covered by tests
2. **Refactor in small steps**: Make one change at a time, commit frequently
3. **Keep tests green**: Run tests after each change to ensure nothing breaks
4. **Extract patterns**: Apply DRY principle and identify common patterns
5. **Improve names**: Make code self-documenting with clear variable/function names

## Quick Start Example

```typescript
// Before: Long, complex function
export async function createOrder(data: any) {
  if (!data.items || data.items.length === 0) throw new Error("Items required");
  const total = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = total * 0.1;
  const order = await prisma.order.create({
    data: { userId: data.userId, total: total + tax },
  });
  await sendEmail(data.userId, "Order created");
  return order;
}

// After: Extracted to focused functions
export async function createOrder(data: CreateOrderInput) {
  validateOrderData(data);
  const pricing = calculatePricing(data.items);
  const order = await saveOrder(data.userId, pricing.finalTotal, data.items);
  await notifyOrderCreated(data.userId, order.id);
  return order;
}

function calculatePricing(items: OrderItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  return { subtotal, tax, finalTotal: subtotal + tax };
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
```

## Common Gotcha

**Big bang refactoring**: Don't try to refactor everything at once. Make small, incremental improvements. Each refactoring should be independently commit-able and tested.

## Analogy

Refactoring is like organizing a messy room. You don't throw everything out and start over. Instead, you group similar items (extract functions), label boxes clearly (better naming), and create a system that makes things easy to find (patterns). One section at a time, test that you can still find what you need.

## Learn More

For complete refactoring patterns (extract function, parameter object, strategy pattern), see [./references/complete-examples.md](./references/complete-examples.md)
