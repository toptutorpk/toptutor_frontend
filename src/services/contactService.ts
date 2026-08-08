import { http } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';

/** Payload submitted by the public contact form. */
export interface ContactEnquiry {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  role: string;
  /** One or more help topics the enquirer selected. */
  topics: string[];
  requirement?: string;
  heardFrom: string;
  /** Only populated when `heardFrom` is "other". */
  heardFromOther?: string;
  comments?: string;
}

export const contactService = {
  /**
   * Submit a contact enquiry.
   *
   * TODO: point at the real endpoint once the backend exposes it. The path
   * below is the expected shape, not a confirmed contract.
   */
  async submit(payload: ContactEnquiry): Promise<{ reference: string }> {
    if (env.useMocks) {
      await sleep(700);
      return { reference: `TT-${Date.now().toString(36).toUpperCase()}` };
    }
    return http.post<{ reference: string }>('/contact', payload);
  },

  /** Newsletter opt-in from the contact page band. */
  async subscribe(email: string): Promise<void> {
    if (env.useMocks) {
      await sleep(500);
      return;
    }
    await http.post<void>('/newsletter/subscribe', { email });
  },
};
