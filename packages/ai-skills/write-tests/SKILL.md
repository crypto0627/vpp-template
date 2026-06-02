---
name: write-tests
description: Writes unit, integration, and E2E tests using Jest, React Testing Library, and Cypress. Use when writing tests or when user asks "write tests" or "撰寫測試".
---

When writing tests, always follow:

1. **AAA pattern**: Structure tests as Arrange → Act → Assert
2. **Test behavior, not implementation**: Focus on what users see, not internal details
3. **Descriptive names**: Test names should clearly explain what they test
4. **Cover edge cases**: Test null, empty, undefined, and error states
5. **Keep tests simple**: One concept per test, avoid complex test logic

## Quick Start Example

```typescript
// Component test with Jest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { UserCard } from '@/components/UserCard'

describe('UserCard', () => {
  it('renders user information correctly', () => {
    // Arrange
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' }

    // Act
    render(<UserCard user={mockUser} />)

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={handleEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(handleEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

## Test Pyramid

```
        ┌──────────┐
        │   E2E    │  ← Few tests (slow, expensive)
        │  Tests   │     Critical user flows
        └──────────┘
      ┌──────────────┐
      │ Integration  │  ← More tests (medium speed)
      │    Tests     │     Component + API
      └──────────────┘
    ┌──────────────────┐
    │   Unit Tests     │  ← Most tests (fast, cheap)
    │ Components/Utils │     Individual functions
    └──────────────────┘
```

## Testing Best Practices

```
Test Structure:
  ☐ Use descriptive test names
  ☐ Follow AAA pattern (Arrange, Act, Assert)
  ☐ One assertion per test (when possible)
  ☐ Test behavior, not implementation

Coverage:
  ☐ Happy path (normal usage)
  ☐ Edge cases (empty, null, undefined)
  ☐ Error states (API failures, validation)
  ☐ Loading states

Mocking:
  ☐ Mock external dependencies (API, DB)
  ☐ Don't mock what you're testing
  ☐ Clear mocks between tests
  ☐ Use realistic mock data

Maintenance:
  ☐ Keep tests simple and readable
  ☐ Avoid test interdependence
  ☐ Clean up after tests
  ☐ Run tests in CI/CD pipeline
```

## Common Gotcha

**Testing implementation details**: Don't test how something works internally. Test what the user sees and does. For example, don't test that `useState` was called - test that the UI updates correctly.

## Analogy

Writing tests is like being a quality inspector at a factory. You don't care how the machine works internally - you check if the final product works as expected. Unit tests check individual parts, integration tests check how parts work together, and E2E tests check the complete product from a user's perspective.

## Learn More

For complete test examples (hooks, API routes, E2E, test utilities), see [./references/complete-examples.md](./references/complete-examples.md)
