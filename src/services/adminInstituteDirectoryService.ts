import { http } from '@/api/client';
import type { InstituteProfile } from './instituteService';

export interface AdminInstituteRow extends InstituteProfile {
  email?: string;
  planTier?: 'LISTED' | 'GROWTH' | 'INSTITUTION';
  subscriptionStatus?: string;
  subscriptionSpend: number;
}
export interface AdminInstituteStats {
  totalInstitutes: number;
  awaitingReview: number;
  paidSubscribers: number;
  subscriptionSpend: number;
}
export const adminInstituteDirectoryService = {
  list: (
    params: { page: number; size: number; status?: string; plan?: string; search?: string },
    signal?: AbortSignal,
  ) => http.getPage<AdminInstituteRow>('/admin/institutes/directory', { params, signal }),
  stats: () => http.get<AdminInstituteStats>('/admin/institutes/directory/stats'),
};
