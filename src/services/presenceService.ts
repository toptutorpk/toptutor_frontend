import { http } from '@/api/client';

/** Presence heartbeat — keeps the signed-in account marked "active" so others see them online. */
export const presenceService = {
  heartbeat: () => http.post<void>('/presence/heartbeat'),
};
