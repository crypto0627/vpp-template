/**
 * Authentication Type Definitions
 *
 * Type definitions for authentication and user management.
 */

import type { UserRole } from "@/constants/auth-constants";
import type { SiteId } from "@/types/data-type";

/**
 * User model
 */
export interface User {
  id: string;
  email: string;
  createdAt?: string;
  role: UserRole;
  sitePermissions?: SiteId[];
}

/**
 * Authentication state interface
 * Defines the shape of the auth state including user data and authentication status
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}
