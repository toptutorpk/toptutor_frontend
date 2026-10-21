import { http } from '@/api/client';
import type { AccountStatus } from '@/services/mock/admin';

export interface AdminLearner {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: 'STUDENT' | 'PARENT';
  city?: string;
  photoUrl?: string;
  status: AccountStatus;
  bookings: number;
  plan: string | null;
  createdAt?: string;
}
export interface AdminLearnerStats {
  totalAccounts: number;
  students: number;
  parents: number;
  subscriptionBillingEnabled: boolean;
  premiumSubscribers: number | null;
  subscriptionSpend: number | null;
}
export interface AdminLearnerDetail {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'STUDENT' | 'PARENT';
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  city?: string;
  photoUrl?: string;
  gradeLevel?: string;
  school?: string;
  createdAt?: string;
  lastActiveAt?: string;
  children: {
    id: number;
    name: string;
    gradeLevel?: string;
    school?: string;
    gender?: string;
    notes?: string;
  }[];
}
export const adminLearnerService = {
  setStatus: (id: number, status: 'active' | 'suspended') =>
    http.post<AdminLearnerDetail>(`/admin/learners/${id}/status?status=${status}`),
  detail: (id: number, signal?: AbortSignal) =>
    http.get<AdminLearnerDetail>(`/admin/learners/${id}`, { signal }),
  list: (
    params: { page: number; size: number; status?: string; search?: string },
    signal?: AbortSignal,
  ) => http.getPage<AdminLearner>('/admin/learners', { params, signal }),
  stats: () => http.get<AdminLearnerStats>('/admin/learners/stats'),
};
