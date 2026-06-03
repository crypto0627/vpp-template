import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "@/types/auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error || "Sign in failed" };
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (e) {
          set({ isLoading: false });
          return { success: false, error: e instanceof Error ? e.message : "Network error" };
        }
      },

      signUp: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error || "Sign up failed" };
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (e) {
          set({ isLoading: false });
          return { success: false, error: e instanceof Error ? e.message : "Network error" };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await fetch("/api/auth/signout", { method: "POST" });
        } catch {
          // silent
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const user = await res.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: "fe-auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
