import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import type { User } from '@/types';
import type { GoogleAuthResult, LoginPayload, SignupPayload } from '@/services/authService';

/**
 * In-memory draft threaded from tutor signup → OTP verify → profile creation. Held only for the
 * duration of onboarding (never persisted to storage) so the account can be auto-logged-in once
 * the profile is created.
 */
export interface TutorOnboardingDraft {
  tutorId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboarding: TutorOnboardingDraft | null;
  login: (payload: LoginPayload) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  setSession: (user: User, token: string) => void;
  setOnboarding: (draft: TutorOnboardingDraft) => void;
  clearOnboarding: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      onboarding: null,
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
      async loginWithGoogle(idToken) {
        set({ isLoading: true });
        try {
          const result = await authService.loginWithGoogle(idToken);
          const user = await authService.getMe();
          set({ user, token: result.accessToken, isAuthenticated: true, isLoading: false });
          // A not-yet-ACTIVE account still needs a profile — seed the onboarding draft
          // (no password: Google accounts authenticate via Google, and are already signed in).
          if (result.status !== 'ACTIVE') {
            set({
              onboarding: {
                tutorId: result.tutorId,
                firstName: result.firstName ?? '',
                lastName: result.lastName ?? '',
                email: user.email ?? '',
                password: '',
              },
            });
          } else {
            set({ onboarding: null });
          }
          return result;
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },
      setSession(user, token) {
        set({ user, token, isAuthenticated: true });
      },
      setOnboarding(draft) {
        set({ onboarding: draft });
      },
      clearOnboarding() {
        set({ onboarding: null });
      },
      logout() {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false, onboarding: null });
      },
    }),
    { name: 'toptutor.auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) },
  ),
);
