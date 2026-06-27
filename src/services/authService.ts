import { apiClient, setStoredToken } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';
import type { City, User, UserRole } from '@/types';

export interface LoginPayload {
  phone: string;
  password?: string;
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
  async login(payload: LoginPayload): Promise<AuthResult> {
    if (env.useMocks) {
      await sleep(700);
      const user = mockUser({ role: 'student', phone: payload.phone, name: 'Ali Raza' });
      const token = 'mock-jwt-' + user.id;
      setStoredToken(token);
      return { token, user };
    }
    const { data } = await apiClient.post<AuthResult>('/auth/login', payload);
    setStoredToken(data.token);
    return data;
  },

  async signup(payload: SignupPayload): Promise<AuthResult> {
    if (env.useMocks) {
      await sleep(900);
      const user = mockUser(payload);
      const token = 'mock-jwt-' + user.id;
      setStoredToken(token);
      return { token, user };
    }
    const { data } = await apiClient.post<AuthResult>('/auth/signup', payload);
    setStoredToken(data.token);
    return data;
  },

  async requestOtp(phone: string): Promise<{ sent: boolean }> {
    if (env.useMocks) {
      await sleep(600);
      return { sent: true };
    }
    const { data } = await apiClient.post('/auth/otp/request', { phone });
    return data;
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    if (env.useMocks) {
      await sleep(700);
      if (code.length !== 6) throw new Error('Invalid code');
      const user = mockUser({ role: 'parent', phone });
      const token = 'mock-jwt-' + user.id;
      setStoredToken(token);
      return { token, user };
    }
    const { data } = await apiClient.post<AuthResult>('/auth/otp/verify', { phone, code });
    setStoredToken(data.token);
    return data;
  },

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    if (env.useMocks) {
      await sleep(600);
      return { sent: true };
    }
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  logout() {
    setStoredToken(null);
  },
};
