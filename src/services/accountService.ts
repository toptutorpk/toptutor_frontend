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

/** Which verified detail a change targets. */
export type ContactChannel = 'PHONE' | 'EMAIL';

export interface ContactChangeStart {
  changeId: number;
  /** Where the code went, masked — safe to show back on a shared screen. */
  maskedDestination: string;
  otpExpiresInSeconds: number;
  devCode?: string; // dev only
}

/** The account's contact details after a change is applied. */
export interface ContactDetails {
  phone: string;
  email?: string;
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

  /**
   * Step 1 of changing a verified phone or email: sends a code to the NEW value.
   *
   * <p>Nothing on the account moves here. The code goes to the destination being claimed, not the
   * one already held, because only a reply from the new address proves it belongs to the person
   * asking.
   */
  startContactChange: (channel: ContactChannel, newValue: string) =>
    http.post<ContactChangeStart>('/accounts/me/contact/start', { channel, newValue }),

  /** Step 2: applies the change once the code proves the new value. */
  confirmContactChange: (changeId: number, code: string) =>
    http.post<ContactDetails>('/accounts/me/contact/confirm', { changeId, code }),
};
