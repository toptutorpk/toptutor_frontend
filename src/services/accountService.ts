import { http } from '@/api/client';

/** Signed-in account identity + security settings (mirrors backend AccountMeResponse). */
export interface AccountMe {
  id: number;
  email?: string;
  phone: string;
  role: 'TUTOR' | 'STUDENT' | 'PARENT' | 'ADMIN';
  status: string;
  name?: string;
  city?: string;
  photoUrl?: string;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
}

export const accountService = {
  /** The signed-in account (includes the 2FA flag for the Security settings). */
  me: () => http.get<AccountMe>('/accounts/me'),
  /** Enable/disable email two-factor authentication. */
  setTwoFactor: (enabled: boolean) => http.post<void>('/accounts/2fa', { enabled }),
  /** Sets the profile photo to an already-uploaded (cropped) image URL. */
  updatePhoto: (photoUrl: string) => http.post<void>('/accounts/me/photo', { photoUrl }),
  /** Changes the account password (verifies the current one server-side). */
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<void>('/accounts/me/password', { currentPassword, newPassword }),
  /** Permanently delete (anonymise + deactivate) the signed-in account after password confirmation. */
  deleteAccount: (password: string) => http.del<void>('/accounts/me', { data: { password } }),
};
