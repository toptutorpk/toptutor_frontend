import { http, setTokens, clearTokens, getRefreshToken, setStoredToken } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';
import { toE164 } from '@/lib/phone';
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

/**
 * Identifies a sign-up in progress — not an account.
 *
 * <p>Submitting the form no longer creates anything in the accounts table; the backend stages the
 * details and issues codes against a `registrationId`, and an account is created only once both
 * codes are verified. That is what makes an abandoned sign-up retryable with the same email and
 * phone: there is nothing holding them.
 */
export interface OtpChallenge {
  registrationId: number;
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

/** A course a tutor offers — matches the backend `Course` record. */
export interface Course {
  abbreviation: string;
  title: string;
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
  courses?: Course[];
}

interface TutorResponse {
  id: number;
  email: string;
  phone: string;
  status: TutorAccountStatus;
  role?: 'TUTOR' | 'ADMIN';
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

/** Login either completes (tokens + user) or asks for a two-factor code (challengeId). */
export type LoginOutcome =
  | { twoFactorRequired: true; challengeId: string }
  | ({ twoFactorRequired: false } & AuthResult);

/** Shape of the backend LoginResponse. */
interface LoginResponseDto {
  twoFactorRequired: boolean;
  challengeId?: string;
  tokens?: TokenResponse;
}

export interface TutorRegisterPayload {
  firstName?: string;
  lastName?: string;
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
  courses?: Course[];
}

/** Maps a backend TutorResponse to the frontend User shape. */
function tutorToUser(t: TutorResponse): User {
  // A freshly-verified tutor has an empty profile (no name yet) — fall back to the email.
  const fullName = [t.profile?.firstName, t.profile?.lastName].filter(Boolean).join(' ').trim();
  const name = fullName || t.email;
  return {
    id: String(t.id),
    name,
    email: t.email,
    phone: t.phone,
    role: t.role === 'ADMIN' ? 'admin' : 'tutor',
    city: (t.profile?.city as City | undefined) ?? undefined,
    createdAt: t.createdAt,
  };
}

/** Role-aware identity from GET /accounts/me. */
interface AccountMe {
  id: number;
  email?: string;
  phone: string;
  role: 'TUTOR' | 'STUDENT' | 'PARENT' | 'ADMIN';
  status: string;
  name?: string;
  city?: string;
  photoUrl?: string;
}

const ROLE_MAP: Record<AccountMe['role'], UserRole> = {
  TUTOR: 'tutor',
  STUDENT: 'student',
  PARENT: 'parent',
  ADMIN: 'admin',
};

function accountMeToUser(m: AccountMe): User {
  return {
    id: String(m.id),
    name: m.name ?? m.email ?? m.phone,
    email: m.email,
    phone: m.phone,
    role: ROLE_MAP[m.role],
    city: (m.city as City | undefined) ?? undefined,
    avatarUrl: m.photoUrl,
    createdAt: new Date().toISOString(),
  };
}

export interface RegisterAccountPayload {
  role: 'STUDENT' | 'PARENT';
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  password: string;
  acceptedTerms: boolean;
}

export interface Child {
  id: number;
  name: string;
  gradeLevel?: string;
  school?: string;
  gender?: string;
  notes?: string;
}
export type ChildPayload = Omit<Child, 'id'>;

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
    // Canonical even in mock data: a fixture in a shape the validator would reject teaches the
    // wrong format to everything that reads it.
    phone: partial.phone ?? '+923000000000',
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

  /**
   * Step 2 — verify both OTPs. This is the call that actually creates the account.
   *
   * <p>Up to this point the sign-up exists only as a staged attempt, so a tutor who never reaches
   * here has no account and can start again with the same email and phone.
   */
  async verifyTutorOtp(input: {
    registrationId: number;
    phoneCode: string;
    emailCode: string;
  }): Promise<VerifyOtpResult> {
    // Verification creates the account and an empty profile; the client then routes the tutor to
    // the login page (no immediate secured call), so we don't store the token here.
    return http.post<VerifyOtpResult>('/tutors/verify-otp', input);
  },

  /** Re-send a single channel's OTP (PHONE or EMAIL). */
  async resendTutorOtp(input: {
    registrationId: number;
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

  /** Role-aware identity of the signed-in account (works for tutor/student/parent/admin). */
  async getMe(): Promise<User> {
    const me = await http.get<AccountMe>('/accounts/me');
    return accountMeToUser(me);
  },

  /** Registers a STUDENT or PARENT (email optional), stores the tokens, and returns the user. */
  async registerAccount(payload: RegisterAccountPayload): Promise<User> {
    const tokens = await http.post<TokenResponse>('/accounts/register', payload);
    setTokens(tokens.accessToken, tokens.refreshToken);
    return this.getMe();
  },

  /** Parent → children management. */
  async listChildren(): Promise<Child[]> {
    return http.get<Child[]>('/parents/children');
  },
  async addChild(child: ChildPayload): Promise<Child> {
    return http.post<Child>('/parents/children', child);
  },
  async removeChild(id: number): Promise<void> {
    await http.del<void>(`/parents/children/${id}`);
  },

  /** The authenticated tutor's full profile fields (for pre-filling the edit form). */
  async getMyTutorProfile(): Promise<TutorProfilePayload | undefined> {
    const tutor = await http.get<TutorResponse>('/tutors/me');
    return tutor.profile;
  },

  // ===== Login / logout (real backend) =======================================

  /**
   * Email + password login. Completes with tokens + user, or — when the account has 2FA enabled —
   * returns `{ twoFactorRequired: true, challengeId }` so the caller can collect the emailed code.
   */
  async login(payload: LoginPayload): Promise<LoginOutcome> {
    const res = await http.post<LoginResponseDto>('/auth/login', payload);
    if (res.twoFactorRequired || !res.tokens) {
      return { twoFactorRequired: true, challengeId: res.challengeId ?? '' };
    }
    setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    const user = await this.getMe();
    return { twoFactorRequired: false, token: res.tokens.accessToken, user };
  },

  /** Completes a two-factor login with the emailed code → stores tokens and returns the user. */
  async verifyTwoFactor(challengeId: string, code: string): Promise<AuthResult> {
    const tokens = await http.post<TokenResponse>('/auth/2fa/verify', { challengeId, code });
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
    // Canonicalised at the boundary rather than trusted from the caller. An OTP addressed to
    // 03001234567 and an account keyed by +923001234567 are the same person, and a code sent to
    // the wrong spelling of a number is indistinguishable from one that never arrived.
    return http.post<{ sent: boolean }>('/auth/otp/request', { phone: toE164(phone) ?? phone });
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
