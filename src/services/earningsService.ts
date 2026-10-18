import { http } from '@/api/client';

/* ============================================================================
   Earnings service — a tutor's own income, read from the real booking ledger.

   Every amount here comes from the commission split stamped on each booking at
   the moment it was paid, so a row's `commissionRate` is the rate that applied
   THAT day and may differ from the tutor's current one.
   ========================================================================== */

/** One session's earnings, as shown in the payouts table. */
export interface EarningLine {
  bookingId: number;
  /** ISO date of the class. */
  sessionDate: string;
  startTime: string;
  endTime: string;
  learnerName: string;
  learnerAvatar?: string;
  /** What the learner was charged. */
  gross: number;
  /** The rate stamped on THIS booking — not the tutor's current rate. */
  commissionRate: number;
  platformFee: number;
  /** What the tutor earned. */
  net: number;
  /** True once the escrow window has passed and the money is withdrawable. */
  released: boolean;
  /** True once a withdrawal request has taken this session. */
  claimed: boolean;
}

/** One bar on the earnings chart. Months with no earnings are present with `net: 0`. */
export interface MonthlyPoint {
  label: string;
  year: number;
  month: number;
  net: number;
}

export interface EarningsView {
  available: number;
  pending: number;
  thisMonth: number;
  lifetime: number;
  /** Net already claimed by a withdrawal request. */
  withdrawn: number;
  currency: string;
  /** The rate NEW sessions will be stamped at. */
  commissionRate: number;
  loyalCommissionRate: number;
  /** Completed sessions still needed to reach the reduced rate; 0 once reached. */
  sessionsToLoyalRate: number;
  escrowReleaseHours: number;
  minWithdrawal: number;
  monthly: MonthlyPoint[];
  lines: EarningLine[];
}

export interface TutorAnalyticsView {
  thisMonthEarnings: number;
  completedSessions: number;
  activeStudents: number;
  /** Undefined when nobody has rated yet — distinct from 0, which would read as a bad tutor. */
  averageRating?: number;
  ratingCount: number;
  verifiedSteps: number;
  totalSteps: number;
  currency: string;
  monthly: MonthlyPoint[];
}

export const earningsService = {
  /** The signed-in tutor's earnings. The server takes the account from the token, never a param. */
  async get(): Promise<EarningsView> {
    return http.get<EarningsView>('/earnings');
  },

  /** The signed-in tutor's dashboard figures. */
  async analytics(): Promise<TutorAnalyticsView> {
    return http.get<TutorAnalyticsView>('/analytics/tutor');
  },
};
