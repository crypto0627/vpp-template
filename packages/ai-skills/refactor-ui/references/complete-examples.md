---
name: refactor-ui
description: Improves UI component architecture, reusability, and maintainability. Use when cleaning up components or when user asks "refactor UI" or "重構 UI 元件".
---

When refactoring UI, always:

1. **Extract reusable components**: DRY (Don't Repeat Yourself)
2. **Improve component composition**: Build composable pieces
3. **Simplify props**: Use reasonable defaults
4. **Separate concerns**: Logic vs presentation
5. **Enhance accessibility**: ARIA labels, keyboard navigation

## UI Refactoring Patterns

### 1. Extract Repeated UI into Components

```tsx
// ❌ BEFORE: Repeated card markup
export function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold">Users</h3>
        <p className="text-3xl font-bold">1,234</p>
        <p className="text-sm text-gray-500">+12% from last month</p>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold">Revenue</h3>
        <p className="text-3xl font-bold">$45,231</p>
        <p className="text-sm text-gray-500">+8% from last month</p>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold">Orders</h3>
        <p className="text-3xl font-bold">573</p>
        <p className="text-sm text-gray-500">-3% from last month</p>
      </div>
    </div>
  );
}

// ✅ AFTER: Extracted StatCard component
interface StatCardProps {
  title: string;
  value: string | number;
  change: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, change }: StatCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      <p
        className={cn(
          "text-sm",
          change.isPositive ? "text-green-600" : "text-red-600",
        )}
      >
        {change.isPositive ? "+" : ""}
        {change.value}% from last month
      </p>
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="Users"
        value="1,234"
        change={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Revenue"
        value="$45,231"
        change={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Orders"
        value="573"
        change={{ value: 3, isPositive: false }}
      />
    </div>
  );
}
```

### 2. Compound Components Pattern

```tsx
// ❌ BEFORE: Monolithic component with many props
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: "default" | "bordered" | "elevated";
  titleClassName?: string;
  contentClassName?: string;
  // ... prop explosion!
}

// ✅ AFTER: Compound components
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("px-6 py-4 border-b", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t bg-gray-50", className)}>
      {children}
    </div>
  );
}

// Usage - Much more flexible!
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Product Details</CardTitle>
      <Button size="sm">Edit</Button>
    </div>
  </CardHeader>
  <CardContent>
    <p>Product description here...</p>
  </CardContent>
  <CardFooter>
    <Button>Buy Now</Button>
  </CardFooter>
</Card>;
```

### 3. Separate Logic from Presentation

```tsx
// ❌ BEFORE: Logic and UI mixed together
export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase()),
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search users..."
      />
      {filtered.map((user) => (
        <div key={user.id} className="border p-4">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}

// ✅ AFTER: Separated concerns
// Custom hook for logic
function useFilteredUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [users, filter]);

  return { users: filtered, loading, filter, setFilter };
}

// Presentation component
function UserCard({ user }: { user: User }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
}

// Container component
export function UserList() {
  const { users, loading, filter, setFilter } = useFilteredUsers();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <SearchInput value={filter} onChange={setFilter} />
      <div className="grid gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
```

### 4. Polymorphic Components

```tsx
// ❌ BEFORE: Duplicated components for different elements
function ButtonLink(props) {
  return <a className="button-styles" {...props} />
}

function Button(props) {
  return <button className="button-styles" {...props} />
}

// ✅ AFTER: Polymorphic component
type ButtonProps<C extends React.ElementType> = {
  as?: C
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
} & React.ComponentPropsWithoutRef<C>

export function Button<C extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps<C>) {
  const Component = as || 'button'

  return (
    <Component
      className={cn(
        'px-4 py-2 rounded-lg font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Usage
<Button>Regular button</Button>
<Button as="a" href="/profile">Link styled as button</Button>
<Button as={Link} to="/profile">Next.js Link as button</Button>
```

### 5. Simplify Complex Forms

```tsx
// ❌ BEFORE: Monolithic form component
export function UserForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  // ... 10 more fields

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation logic
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {/* ... 10 more inputs */}
    </form>
  );
}

// ✅ AFTER: Modular form sections
// components/forms/user-form/BasicInfo.tsx
export function BasicInfoSection({ register, errors }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      <Input
        label="Email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input label="Name" {...register("name")} error={errors.name?.message} />
    </div>
  );
}

// components/forms/user-form/ContactInfo.tsx
export function ContactInfoSection({ register, errors }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <Input
        label="Phone"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Input
        label="Address"
        {...register("address")}
        error={errors.address?.message}
      />
    </div>
  );
}

// components/forms/user-form/UserForm.tsx
export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <BasicInfoSection register={register} errors={errors} />
      <ContactInfoSection register={register} errors={errors} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### 6. Improve Prop Drilling with Context

```tsx
// ❌ BEFORE: Prop drilling nightmare
function App() {
  const [theme, setTheme] = useState("light");
  return <Layout theme={theme} setTheme={setTheme} />;
}

function Layout({ theme, setTheme }) {
  return <Sidebar theme={theme} setTheme={setTheme} />;
}

function Sidebar({ theme, setTheme }) {
  return <ThemeToggle theme={theme} setTheme={setTheme} />;
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} />
  );
}

// ✅ AFTER: Context for shared state
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Usage - No prop drilling!
function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} />
  );
}
```

## UI Refactoring Checklist

```
Component Structure:
  ☐ Break down large components (< 200 lines)
  ☐ Extract repeated UI patterns
  ☐ Use compound components for flexibility
  ☐ Separate logic from presentation

Props:
  ☐ Reduce prop drilling (use Context)
  ☐ Use reasonable defaults
  ☐ Group related props into objects
  ☐ Make components polymorphic when needed

Composition:
  ☐ Prefer composition over configuration
  ☐ Make components composable
  ☐ Use children prop effectively
  ☐ Create layout components

Accessibility:
  ☐ Add ARIA labels
  ☐ Support keyboard navigation
  ☐ Use semantic HTML
  ☐ Test with screen readers
```

## Common Gotcha

**Over-abstraction**: Don't create reusable components until you've used similar code 2-3 times. Premature abstraction can make code harder to change.

**Analogy**: Refactoring UI is like organizing a LEGO collection. You sort pieces by type (extract components), create instruction sheets (prop interfaces), and build modular sections (compound components) that can be combined in different ways. Each piece should be simple and do one thing well.
