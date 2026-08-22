import { http } from '@/api/client';
import type { VerificationView } from '@/services/verificationService';
import type { AccountStatus, VerifyStatus } from '@/services/mock/admin';

export interface AdminStats {
  totalTutors: number;
  activeTutors: number;
  suspendedTutors: number;
  verifiedTutors: number;
  pendingApprovals: number;
  newThisMonth: number;
}

export interface AdminTutorSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: AccountStatus;
  verification: VerifyStatus;
  stepsPassed: number;
  stepsTotal: number;
  createdAt: string;
}

export interface AdminCredential {
  title: string;
  org: string;
  year: string;
}

export interface AdminProfile {
  firstName?: string;
  lastName?: string;
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
  education?: AdminCredential[];
  certifications?: AdminCredential[];
}

export interface AdminTutorDetail {
  summary: AdminTutorSummary;
  profile?: AdminProfile;
  verification: VerificationView;
}

export interface AdminNotification {
  id: number;
  type: string;
  subjectAccountId?: number;
  subjectName?: string;
  subjectRole?: string;
  title: string;
  body?: string;
  occurrences: number;
  status: string;
  createdAt: string;
}

export interface SystemParameter {
  key: string;
  value: string;
  description?: string;
}

export const adminService = {
  stats: () => http.get<AdminStats>('/admin/stats'),
  tutors: () => http.get<AdminTutorSummary[]>('/admin/tutors'),
  tutor: (id: number) => http.get<AdminTutorDetail>(`/admin/tutors/${id}`),
  // Alerts (e.g. contact-info violations)
  notifications: () => http.get<AdminNotification[]>('/admin/notifications'),
  notificationCount: () =>
    http.get<{ count: number }>('/admin/notifications/count').then((r) => r.count),
  resolveNotification: (id: number) => http.post<void>(`/admin/notifications/${id}/resolve`),
  // System parameters
  parameters: () => http.get<SystemParameter[]>('/admin/parameters'),
  updateParameter: (key: string, value: string) =>
    http.put<SystemParameter[]>(`/admin/parameters/${key}?value=${encodeURIComponent(value)}`),
  decide: (id: number, decision: 'APPROVE' | 'REJECT' | 'FLAG', notes?: string) =>
    http.post<AdminTutorDetail>(`/admin/tutors/${id}/decision`, { decision, notes }),
  /** Approve or reject a single uploaded document. */
  reviewDocument: (id: number, slotKey: string, decision: 'APPROVE' | 'REJECT', notes?: string) =>
    http.post<AdminTutorDetail>(`/admin/tutors/${id}/documents/${slotKey}/decision`, { decision, notes }),
  setStatus: (id: number, status: 'active' | 'suspended') =>
    http.post<AdminTutorDetail>(`/admin/tutors/${id}/status?status=${status}`),
};
