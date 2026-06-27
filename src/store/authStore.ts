import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import type { User } from '@/types';
import type { LoginPayload, SignupPayload } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  setSession: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      async login(payload) {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.login(payload);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return user;
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      async signup(payload) {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.signup(payload);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return user;
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      setSession(user, token) {
        set({ user, token, isAuthenticated: true });
      },
      logout() {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'toptutor.auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) },
  ),
);
