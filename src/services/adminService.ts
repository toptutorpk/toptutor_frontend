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

/**
 * Where a tutor's introduction video has got to in processing.
 *
 * <p>Surfaced so a reviewer finalising an application can tell the branded cut is live before
 * marking the tutor public - and, when it is not, whether it is still queued or has failed.
 */
export interface IntroVideoStatus {
  /** QUEUED | PROCESSING | UPLOADED | FAILED, or absent when nothing is queued yet. */
  status?: string;
  /** The one thing a reviewer needs: is the branded video live? */
  ready: boolean;
  /** Where it was published - an R2 URL when it went to storage. */
  outputUrl?: string;
  /** Set instead of outputUrl when the video was published to YouTube. */
  youtubeId?: string;
  /** 'C' Cloudflare R2 or 'Y' YouTube - where this video actually went. */
  uploadMode?: string;
  attempts: number;
  lastError?: string;
  queuedAt?: string;
  completedAt?: string;
}

export interface AdminTutorDetail {
  summary: AdminTutorSummary;
  profile?: AdminProfile;
  verification: VerificationView;
  introVideo?: IntroVideoStatus;
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

/** Where a misconduct report has got to. Mirrors the backend's ReportStatus. */
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';

/** One row of the misconduct queue. Carries an excerpt, never the full statement. */
export interface ReportSummary {
  id: number;
  reference: string;
  category: string;
  urgent: boolean;
  subjectName: string | null;
  subjectRole: string | null;
  channel: string | null;
  excerpt: string | null;
  anonymous: boolean;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportDetail extends Omit<ReportSummary, 'excerpt'> {
  subjectProfileUrl: string | null;
  subjectAccountId: number | null;
  occurredOn: string | null;
  description: string;
  /** Null throughout for an anonymous report — never stored, not merely hidden. */
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  reporterAccountId: number | null;
  adminNotes: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

/** A tutor's reliability record (mirrors AdminStrikeController.StandingView). */
export interface TutorStanding {
  points: number;
  windowDays: number;
  warnPoints: number;
  pausePoints: number;
  paused: boolean;
  pausedAt: string | null;
  strikes: {
    id: number;
    bookingId: number | null;
    kind: 'CANCELLED' | 'LATE_CANCEL' | 'NO_SHOW';
    label: string;
    points: number;
    note: string | null;
    automatic: boolean;
    createdAt: string;
  }[];
}

export const adminService = {
  stats: () => http.get<AdminStats>('/admin/stats'),
  tutors: () => http.getAllPages<AdminTutorSummary>('/admin/tutors'),
  tutor: (id: number) => http.get<AdminTutorDetail>(`/admin/tutors/${id}`),
  // Alerts (e.g. contact-info violations)
  notifications: () => http.getAllPages<AdminNotification>('/admin/notifications'),
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
    http.post<AdminTutorDetail>(`/admin/tutors/${id}/documents/${slotKey}/decision`, {
      decision,
      notes,
    }),
  setStatus: (id: number, status: 'active' | 'suspended') =>
    http.post<AdminTutorDetail>(`/admin/tutors/${id}/status?status=${status}`),
  // Reliability strikes
  tutorStanding: (tutorId: number) => http.get<TutorStanding>(`/admin/tutors/${tutorId}/strikes`),
  /** Strikes only a person can judge; in-app cancellations are recorded automatically. */
  addStrike: (
    tutorId: number,
    input: { kind: 'LATE_CANCEL' | 'NO_SHOW'; bookingId?: number; note?: string },
  ) => http.post<TutorStanding>(`/admin/tutors/${tutorId}/strikes`, input),
  resumeBookings: (tutorId: number) =>
    http.post<TutorStanding>(`/admin/tutors/${tutorId}/resume-bookings`),

  // Misconduct reports (the public "Report Misconduct" queue)
  /** One page is enough here: the queue is worked newest-first and filtered by status. */
  reports: (status?: ReportStatus) =>
    http.get<ReportSummary[]>(`/admin/reports${status ? `?status=${status}` : ''}`),
  report: (id: number) => http.get<ReportDetail>(`/admin/reports/${id}`),
  openReportCount: () =>
    http.get<{ open: number }>('/admin/reports/open-count').then((r) => r.open),
  decideReport: (id: number, status: ReportStatus, notes?: string) =>
    http.post<ReportDetail>(`/admin/reports/${id}/decision`, { status, notes }),
};
