import { http } from '@/api/client';
export interface TutorPlanQuote {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
  currency: string;
  commissionDiscountRate: number;
}
export interface TutorCommission {
  profileExists: boolean;
  version: number;
  customRate: number | null;
  customLoyalRate: number | null;
  systemRate: number;
  systemLoyalRate: number;
  loyaltyThreshold: number;
  completedSessions: number;
  sessionsToLoyalRate: number;
  baseRate: number;
  discountRate: number;
  effectiveRate: number;
  effectiveLoyalRate: number;
  subscription: {
    id: number;
    planName: string;
    status: string;
    startsAt: string;
    endsAt: string;
    discountRate: number;
    cancelAtPeriodEnd: boolean;
  } | null;
  subscriptionStatus: string;
  plans: TutorPlanQuote[];
  monthlyPrice: number;
  sixMonthDiscountPercent: number;
  checkoutAvailable: boolean;
  recentChanges: {
    id: number;
    actorId: number;
    previousRate: number | null;
    previousLoyalRate: number | null;
    newRate: number | null;
    newLoyalRate: number | null;
    note: string;
    createdAt: string;
  }[];
}
export interface UpdateTutorRates {
  standardRate: number | null;
  loyalRate: number | null;
  version: number;
  note: string;
}
export interface UpdateTutorPricing {
  monthlyPrice: number;
  sixMonthDiscountPercent: number;
  expectedMonthlyPrice: number;
  expectedSixMonthDiscountPercent: number;
  note: string;
}
export const tutorCommissionService = {
  admin: (id: number, signal?: AbortSignal) =>
    http.get<TutorCommission>(`/admin/tutors/${id}/commission`, { signal }),
  mine: () => http.get<TutorCommission>('/tutors/me/commission'),
  update: (id: number, request: UpdateTutorRates) =>
    http.put<TutorCommission>(`/admin/tutors/${id}/commission`, request),
  updatePricing: (request: UpdateTutorPricing, password: string) =>
    http.put<void>('/admin/tutor-subscription-plans/pricing', { pricing: request, password }),
};
