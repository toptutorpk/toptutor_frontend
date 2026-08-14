import { apiClient, http } from '@/api/client';

export interface SessionBooking {
  bookingId: number;
  amount: number;
  currency: string;
  checkoutUrl: string;
}

export interface BookingStatus {
  id: number;
  tutorId: number;
  status: string;
  paymentStatus: string; // NONE | PENDING | PAID | FAILED
  canMessage: boolean;
}

/** A row in the learner's "My Bookings" list (mirrors backend BookingSummaryResponse). */
export interface BookingSummary {
  id: number;
  tutorId: number;
  tutorName: string;
  tutorAvatar: string | null;
  mode: string | null; // ONLINE | HOME | DEMO
  bookingType: string; // SESSION | INTRO
  sessionDate: string; // 'YYYY-MM-DD'
  dayOfWeek: string; // MONDAY..SUNDAY
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  amount: number | null;
  currency: string | null;
  status: string; // UPCOMING | COMPLETED | CANCELLED (derived server-side)
  paymentStatus: string; // NONE | PENDING | PAID | FAILED
  canMessage: boolean;
}

/** A row in the tutor's "Sessions" list (mirrors backend TutorBookingResponse). */
export interface TutorBooking {
  id: number;
  studentId: number;
  studentName: string;
  studentAvatar: string | null;
  mode: string | null; // ONLINE | HOME | DEMO
  bookingType: string; // SESSION | INTRO
  sessionDate: string; // 'YYYY-MM-DD'
  dayOfWeek: string; // MONDAY..SUNDAY
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  amount: number | null;
  currency: string | null;
  status: string; // UPCOMING | COMPLETED | CANCELLED (derived server-side)
  paymentStatus: string; // NONE | PENDING | PAID | FAILED
}

/** A learner's chosen slice of one of the tutor's recurring weekly windows, on a concrete date. */
export interface CreateSessionInput {
  tutorId: number;
  weeklySlotId: number;
  sessionDate: string; // 'YYYY-MM-DD'
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
  packageId: string;
}

/**
 * Mirrors the server's pricing so the dialog shows what will actually be charged.
 *
 * <p>The rate is per hour, so a 90-minute session costs 1.5×; package discounts then apply to that
 * duration-scaled figure. The server recomputes all of this from the tutor's own rate and ignores
 * whatever the client believes — this exists to keep the two in visible agreement, not to set price.
 */
export function priceForSession(hourlyRate: number, packageId: string, minutes: number): number {
  const perSession = (hourlyRate * minutes) / 60;
  switch (packageId) {
    case 'weekly':
      return Math.round(perSession * 0.9) * 8;
    case 'intensive':
      return Math.round(perSession * 0.82) * 16;
    default:
      return Math.round(perSession);
  }
}

export const bookingService = {
  /** Creates a paid session booking and returns the Safepay checkout URL to redirect to. */
  createSession: (input: CreateSessionInput) => http.post<SessionBooking>('/bookings/session', input),
  /** Confirms payment on return from checkout. */
  confirm: (bookingId: number) => http.post<BookingStatus>(`/bookings/${bookingId}/confirm`),
  /** Polls a booking's status. */
  get: (bookingId: number) => http.get<BookingStatus>(`/bookings/${bookingId}`),
  /** The signed-in learner's bookings for the student dashboard "My Bookings" list. */
  list: () => http.get<BookingSummary[]>('/bookings'),
  /** The signed-in tutor's incoming bookings for the tutor dashboard "Sessions" list. */
  listAsTutor: () => http.get<TutorBooking[]>('/bookings/tutor'),
  /**
   * Opens the paid-session receipt PDF in a new tab (view + download). Fetches the bytes with the
   * auth header, then hands the browser a local blob URL so the new tab needs no credentials.
   */
  async openReceipt(bookingId: number): Promise<void> {
    const res = await apiClient.get(`/bookings/${bookingId}/receipt`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
