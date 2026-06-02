# Complete Test Examples

## Component Test Template

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
  // Happy path
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/avatar.jpg')
  })

  // Edge case: No avatar
  it('renders fallback when avatar is missing', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null }
    render(<UserCard user={userWithoutAvatar} />)

    expect(screen.getByText('JD')).toBeInTheDocument() // Initials
  })

  // Interaction
  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={handleEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    expect(handleEdit).toHaveBeenCalledWith(mockUser)
    expect(handleEdit).toHaveBeenCalledTimes(1)
  })

  // Edge case: Loading state
  it('shows skeleton when loading', () => {
    render(<UserCard user={mockUser} loading />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  // Edge case: Error state
  it('displays error message when error prop is passed', () => {
    render(<UserCard user={mockUser} error="Failed to load" />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  // Accessibility
  it('has proper ARIA labels', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'User card for John Doe')
  })
})
```

## Custom Hook Test

```typescript
// __tests__/hooks/useUser.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useUser } from "@/hooks/useUser";

// Mock fetch
global.fetch = jest.fn();

describe("useUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and returns user data", async () => {
    const mockUser = { id: "1", name: "John" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useUser("1"));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useUser("1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.user).toBeNull();
  });

  it("refetches when userId changes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1" }),
    });

    const { result, rerender } = renderHook(({ id }) => useUser(id), {
      initialProps: { id: "1" },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change userId
    rerender({ id: "2" });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
```

## API Route Test

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
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn().mockResolvedValue({ userId: "1" }),
}));

describe("POST /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates user with valid data", async () => {
    const mockUser = {
      id: "1",
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

    expect(response.status).toBe(400);
  });

  it("returns 401 without auth token", async () => {
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
});

describe("GET /api/users", () => {
  it("returns paginated users", async () => {
    const mockUsers = [
      { id: "1", name: "User 1" },
      { id: "2", name: "User 2" },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const request = new NextRequest("http://localhost:3000/api/users?page=1");

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

## E2E Test (Cypress)

```typescript
// cypress/e2e/auth.cy.ts
describe("Authentication Flow", () => {
  beforeEach(() => {
    // Reset database or use fixtures
    cy.task("db:seed");
  });

  it("allows user to sign up and login", () => {
    // Visit signup page
    cy.visit("/signup");

    // Fill out form
    cy.get('input[name="email"]').type("newuser@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get('input[name="confirmPassword"]').type("SecurePass123!");
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome").should("be.visible");

    // Logout
    cy.get('button[aria-label="User menu"]').click();
    cy.contains("Logout").click();

    // Login again
    cy.visit("/login");
    cy.get('input[name="email"]').type("newuser@example.com");
    cy.get('input[name="password"]').type("SecurePass123!");
    cy.get('button[type="submit"]').click();

    // Should be back in dashboard
    cy.url().should("include", "/dashboard");
  });

  it("shows error for invalid credentials", () => {
    cy.visit("/login");

    cy.get('input[name="email"]').type("wrong@example.com");
    cy.get('input[name="password"]').type("wrongpass");
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid credentials").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("validates form fields", () => {
    cy.visit("/signup");

    // Try submitting empty form
    cy.get('button[type="submit"]').click();

    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");

    // Invalid email
    cy.get('input[name="email"]').type("notanemail");
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid email").should("be.visible");
  });
});
```

## Test Utilities

```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything
export * from '@testing-library/react'
```
