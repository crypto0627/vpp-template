export type UserRole = "admin" | "viewer" | "worker";

export interface User {
  id: string;
  email: string;
  createdAt?: string;
  role: UserRole;
  sitePermissions?: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}
