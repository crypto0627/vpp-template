---
name: write-tests
description: Writes unit, integration, and E2E tests using Jest, React Testing Library, and Cypress. Use when writing tests or when user asks "write tests" or "撰寫測試".
---

When writing tests, always follow:

1. **AAA pattern**: Arrange → Act → Assert
2. **Test behavior, not implementation**: Focus on what, not how
3. **Descriptive names**: Test names should explain what they test
4. **Cover edge cases**: Null, empty, error states
5. **Keep tests simple**: One concept per test

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

## 1. Component Testing (Jest + React Testing Library)

```typescript
// __tests__/components/UserCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserCard } from '@/components/UserCard'

// Mock data
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatar.jpg',
}

describe('UserCard', () => {
  // Basic rendering test
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', '/avatar.jpg')
  })

  // Testing with different props
  it('renders fallback avatar when image is missing', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null }
    render(<UserCard user={userWithoutAvatar} />)

    expect(screen.getByText('JD')).toBeInTheDocument() // Initials
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  // Testing user interactions
  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={handleEdit} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(handleEdit).toHaveBeenCalledWith(mockUser)
    expect(handleEdit).toHaveBeenCalledTimes(1)
  })

  // Testing conditional rendering
  it('shows loading skeleton when loading prop is true', () => {
    render(<UserCard user={mockUser} loading />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  // Testing error states
  it('displays error message when error prop is provided', () => {
    render(<UserCard user={mockUser} error="Failed to load user" />)

    expect(screen.getByText(/failed to load user/i)).toBeInTheDocument()
  })

  // Testing accessibility
  it('has proper ARIA attributes', () => {
    render(<UserCard user={mockUser} />)

    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label', 'User card for John Doe')
  })

  // Testing async operations
  it('fetches and displays user data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockUser,
      })
    ) as jest.Mock

    render(<UserCard userId="1" />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/users/1')
  })
})
```

## 2. Hook Testing

```typescript
// __tests__/hooks/useCounter.test.ts
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "@/hooks/useCounter";

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it("resets count to initial value", () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(12);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

## 3. API Route Testing

```typescript
// __tests__/api/users/route.test.ts
import { POST, GET } from "@/app/api/users/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn().mockResolvedValue({ userId: "user-1" }),
}));

describe("POST /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates user with valid data", async () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    };

    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });
  });

  it("returns 400 for invalid email", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        email: "invalid-email",
        name: "Test",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
  });

  it("returns 401 without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("handles database errors", async () => {
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});

describe("GET /api/users", () => {
  it("returns paginated users", async () => {
    const mockUsers = [
      { id: "1", name: "User 1", email: "user1@example.com" },
      { id: "2", name: "User 2", email: "user2@example.com" },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = new NextRequest(
      "http://localhost:3000/api/users?page=1&limit=10",
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toEqual(mockUsers);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      take: 10,
      skip: 0,
    });
  });
});
```

## 4. E2E Testing (Cypress)

```typescript
// cypress/e2e/auth.cy.ts
describe("Authentication Flow", () => {
  beforeEach(() => {
    // Reset database before each test
    cy.task("db:seed");
    cy.visit("/login");
  });

  it("allows user to sign up and login", () => {
    // Navigate to signup
    cy.contains("Sign up").click();
    cy.url().should("include", "/signup");

    // Fill out signup form
    cy.get('input[name="email"]').type("newuser@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get('input[name="confirmPassword"]').type("SecurePass123!");
    cy.get('input[name="name"]').type("New User");
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome, New User").should("be.visible");

    // Logout
    cy.get('[aria-label="User menu"]').click();
    cy.contains("Logout").click();

    // Should redirect to homepage
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // Login again
    cy.visit("/login");
    cy.get('input[name="email"]').type("newuser@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get('button[type="submit"]').click();

    // Should be back in dashboard
    cy.url().should("include", "/dashboard");
  });

  it("shows validation errors for invalid inputs", () => {
    // Try to submit empty form
    cy.get('button[type="submit"]').click();

    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");

    // Invalid email
    cy.get('input[name="email"]').type("notanemail");
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid email").should("be.visible");
  });

  it("shows error for invalid credentials", () => {
    cy.get('input[name="email"]').type("wrong@example.com");
    cy.get('input[name="password"]').type("wrongpass");
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid credentials").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("persists session after page refresh", () => {
    // Login
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/dashboard");

    // Refresh page
    cy.reload();

    // Should still be logged in
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome").should("be.visible");
  });
});

// cypress/e2e/todos.cy.ts
describe("Todo Management", () => {
  beforeEach(() => {
    cy.login("test@example.com", "password123"); // Custom command
    cy.visit("/todos");
  });

  it("creates a new todo", () => {
    cy.get('input[name="title"]').type("Buy groceries");
    cy.get('textarea[name="description"]').type("Milk, eggs, bread");
    cy.get('select[name="priority"]').select("high");
    cy.get('button[type="submit"]').click();

    cy.contains("Buy groceries").should("be.visible");
    cy.contains("Milk, eggs, bread").should("be.visible");
  });

  it("marks todo as complete", () => {
    cy.contains("Buy groceries")
      .parent()
      .find('input[type="checkbox"]')
      .check();

    cy.contains("Buy groceries").parent().should("have.class", "line-through");
  });

  it("deletes a todo", () => {
    cy.contains("Buy groceries")
      .parent()
      .find('button[aria-label="Delete"]')
      .click();

    cy.contains("Are you sure?").should("be.visible");
    cy.contains("button", "Delete").click();

    cy.contains("Buy groceries").should("not.exist");
  });
});
```

## Test Utilities

```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create custom render with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'

// Custom matchers
export const customMatchers = {
  toBeInTheDocument: expect.extend({
    toBeInTheDocument(received) {
      // Custom matcher logic
    },
  }),
}
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

**Analogy**: Writing tests is like being a quality inspector at a factory. You don't care how the machine works internally - you check if the final product works as expected. Unit tests check individual parts, integration tests check how parts work together, and E2E tests check the complete product from a user's perspective.
