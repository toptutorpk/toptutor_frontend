import { http, setTokens, clearTokens, getRefreshToken, setStoredToken } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';
import type { City, User, UserRole } from '@/types';

/* ============================================================================
   Auth service.

   The TUTOR onboarding + login flow talks to the real backend
   (register → verify phone+email OTP → create profile → login). The
   student/parent helpers remain mock-backed until those backends exist, so the
   rest of the app keeps working in demo mode.
   ========================================================================== */

// ---- Backend DTOs (mirror the Spring API) ----------------------------------
export type TutorAccountStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED';
export type VerificationChannel = 'PHONE' | 'EMAIL';

export interface OtpChallenge {
  tutorId: number;
  status: TutorAccountStatus;
  phoneMasked?: string;
  emailMasked?: string;
  otpExpiresInSeconds: number;
  devPhoneCode?: string; // dev only
  devEmailCode?: string; // dev only
}

interface VerifyOtpResult {
  tutorId: number;
  status: TutorAccountStatus;
  onboardingToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  tutorId: number;
}

export interface GoogleAuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  tutorId: number;
  status: TutorAccountStatus;
  newUser: boolean;
  firstName?: string;
  lastName?: string;
}

/** A single education or certification entry — matches the backend `Credential` record. */
export interface Credential {
  title: string;
  org: string;
  year: string;
}

/** Full tutor profile shape shared by the create-profile request and the profile in TutorResponse. */
export interface TutorProfilePayload {
  firstName: string;
  lastName: string;
  headline?: string;
  bio?: string;
  city?: string;
  area?: string;
  gender?: string;
  teachingLanguage?: string;
  experienceYears?: number;
  photoUrl?: string;
  videoIntroUrl?: string;
  coverUrl?: string;
  hourlyRate?: number;
  monthlyRate?: number;
  subjects?: string[];
  gradeLevels?: string[];
  skills?: string[];
  modes?: string[];
  education?: Credential[];
  certifications?: Credential[];
}

interface TutorResponse {
  id: number;
  email: string;
  phone: string;
  status: TutorAccountStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  profile?: TutorProfilePayload;
  createdAt: string;
}

// ---- Frontend-facing payloads ----------------------------------------------
export interface LoginPayload {
  email: string;
  password: string;
}
export interface SignupPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: UserRole;
  city?: City | string;
}
export interface AuthResult {
  token: string;
  user: User;
}

export interface TutorRegisterPayload {
  email: string;
  phone: string;
  password: string;
}
export interface CreateTutorProfilePayload {
  firstName: string;
  lastName: string;
  headline?: string;
  bio?: string;
  city?: string;
  area?: string;
  gender?: string;
  teachingLanguage?: string;
  experienceYears?: number;
  photoUrl?: string;
  videoIntroUrl?: string;
  coverUrl?: string;
  hourlyRate?: number;
  monthlyRate?: number;
  subjects?: string[];
  gradeLevels?: string[];
  skills?: string[];
  modes?: string[];
  education?: Credential[];
  certifications?: Credential[];
}

/** Maps a backend TutorResponse to the frontend User shape. */
function tutorToUser(t: TutorResponse): User {
  const name = t.profile ? `${t.profile.firstName} ${t.profile.lastName}`.trim() : t.email;
  return {
    id: String(t.id),
    name,
    email: t.email,
    phone: t.phone,
    role: 'tutor',
    city: (t.profile?.city as City | undefined) ?? undefined,
    createdAt: t.createdAt,
  };
}

function mockUser(partial: {
  role: UserRole;
  name?: string;
  phone?: string;
  email?: string;
  city?: City | string;
}): User {
  return {
    id: 'u_' + Math.random().toString(36).slice(2, 9),
    name: partial.name ?? 'Demo User',
    phone: partial.phone ?? '+92 300 0000000',
    email: partial.email,
    role: partial.role,
    city: partial.city as City | undefined,
    avatarUrl: `https://i.pravatar.cc/96?u=${partial.phone ?? 'demo'}`,
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  // ===== Tutor onboarding (real backend) =====================================

  /** Step 1 — register with email, phone & password; backend sends SMS + email OTPs. */
  async registerTutor(payload: TutorRegisterPayload): Promise<OtpChallenge> {
    return http.post<OtpChallenge>('/tutors/register', payload);
  },

  /** Step 2 — verify both OTPs; stores the short-lived onboarding token. */
  async verifyTutorOtp(input: {
    tutorId: number;
    phoneCode: string;
    emailCode: string;
  }): Promise<VerifyOtpResult> {
    const result = await http.post<VerifyOtpResult>('/tutors/verify-otp', input);
    // Authorises the (secured) profile-creation call that follows.
    setStoredToken(result.onboardingToken);
    return result;
  },

  /** Re-send a single channel's OTP (PHONE or EMAIL). */
  async resendTutorOtp(input: {
    tutorId: number;
    channel: VerificationChannel;
  }): Promise<OtpChallenge> {
    return http.post<OtpChallenge>('/tutors/resend-otp', input);
  },

  /** Step 3 — fill in the profile (uses the onboarding token), activating the account. */
  async createTutorProfile(payload: CreateTutorProfilePayload): Promise<User> {
    const tutor = await http.post<TutorResponse>('/tutors/profile', payload);
    return tutorToUser(tutor);
  },

  /** Updates the logged-in tutor's existing profile (from the account/settings page). */
  async updateTutorProfile(payload: CreateTutorProfilePayload): Promise<User> {
    const tutor = await http.put<TutorResponse>('/tutors/profile', payload);
    return tutorToUser(tutor);
  },

  /** The authenticated tutor's own account + profile. */
  async getMe(): Promise<User> {
    const tutor = await http.get<TutorResponse>('/tutors/me');
    return tutorToUser(tutor);
  },

  /** The authenticated tutor's full profile fields (for pre-filling the edit form). */
  async getMyTutorProfile(): Promise<TutorProfilePayload | undefined> {
    const tutor = await http.get<TutorResponse>('/tutors/me');
    return tutor.profile;
  },

  // ===== Login / logout (real backend) =======================================

  /** Email + password login → stores access & refresh tokens, returns the user. */
  async login(payload: LoginPayload): Promise<AuthResult> {
    const tokens = await http.post<TokenResponse>('/auth/login', payload);
    setTokens(tokens.accessToken, tokens.refreshToken);
    const user = await this.getMe();
    return { token: tokens.accessToken, user };
  },

  /** Logs in / signs up via a Google ID token; stores the issued tokens and returns routing info. */
  async loginWithGoogle(idToken: string): Promise<GoogleAuthResult> {
    const result = await http.post<GoogleAuthResult>('/auth/google', { idToken });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  async logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await http.post('/auth/logout', { refreshToken });
      } catch {
        /* best-effort revocation */
      }
    }
    clearTokens();
  },

  // ===== Student / parent (mock, until those backends exist) ==================

  async signup(payload: SignupPayload): Promise<AuthResult> {
    await sleep(700);
    const user = mockUser(payload);
    const token = 'mock-jwt-' + user.id;
    setStoredToken(token);
    return { token, user };
  },

  async requestOtp(phone: string): Promise<{ sent: boolean }> {
    if (env.useMocks) {
      await sleep(500);
      return { sent: true };
    }
    return http.post<{ sent: boolean }>('/auth/otp/request', { phone });
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    await sleep(500);
    if (code.length !== 6) throw new Error('Invalid code');
    const user = mockUser({ role: 'parent', phone });
    const token = 'mock-jwt-' + user.id;
    setStoredToken(token);
    return { token, user };
  },

  // ===== Password reset (real backend) =======================================

  /** Requests a reset link. Always resolves — the backend never reveals if the email exists. */
  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    await http.post('/auth/forgot-password', { email });
    return { sent: true };
  },

  /** Sets a new password using the token from the emailed reset link. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await http.post('/auth/reset-password', { token, newPassword });
  },
};
