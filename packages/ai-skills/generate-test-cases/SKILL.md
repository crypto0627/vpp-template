---
name: generate-test-cases
description: Generates comprehensive test cases using Jest and Cypress for components, hooks, API routes, and user flows. Use when writing tests or when user asks "write tests" or "產生測試案例".
---

When generating test cases, always include:

1. **Test structure**: Use Describe, it, expect pattern (AAA: Arrange, Act, Assert)
2. **Edge cases**: Test null, undefined, empty states, and error conditions
3. **Happy path**: Cover normal, expected behavior first
4. **Mocks**: Mock external dependencies (API calls, database, third-party services)
5. **Async handling**: Use proper waitFor and async/await for asynchronous operations

## Quick Start Example

```typescript
// Component test with Jest + React Testing Library
describe('UserCard', () => {
  it('renders user information correctly', () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' }
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={handleEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(handleEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

## Test Coverage Goals

```
Unit Tests (Jest):
  - Components: 70%+ coverage
  - Hooks: 90%+ coverage
  - Utilities: 90%+ coverage
  - API routes: 80%+ coverage

Integration Tests:
  - Component + API interactions
  - Form submissions
  - State management flows

E2E Tests (Cypress):
  - Critical user paths
  - Authentication flows
  - Multi-step processes
```

## Common Gotcha

**Async timing**: Don't forget `await waitFor()` when testing async behavior. Without it, tests might pass even when they shouldn't because they complete before the async operation finishes.

## Analogy

Writing tests is like building safety nets. Unit tests are the fine mesh that catches small bugs. Integration tests are the medium net for feature-level issues. E2E tests are the large net that ensures the whole system works together. You need all three layers for complete coverage.

## Learn More

For complete test examples (hooks, API routes, E2E), see [./references/complete-examples.md](./references/complete-examples.md)
