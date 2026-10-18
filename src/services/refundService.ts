import { http } from '@/api/client';

/** Where a learner can ask for their refund to be sent. Mirrors the server's accepted methods. */
export type RefundMethod = 'EASYPAISA' | 'JAZZCASH' | 'BANK';
/** AWAITING_DETAILS: the tutor cancelled and the learner hasn't said where to send the money yet. */
export type RefundStatus = 'AWAITING_DETAILS' | 'PENDING' | 'REFUNDED';
export type CancelledBy = 'LEARNER' | 'TUTOR';

/** What cancelling a booking would mean — fetched before the learner commits. */
export interface CancellationQuote {
  bookingId: number;
  cancellable: boolean;
  /** Why not, in words for the learner; null when cancellable. */
  reason: string | null;
  /** Last moment it may be cancelled — ISO local date-time, Pakistan time. */
  deadline: string | null;
  cutoffHours: number;
  amountPaid: number;
  /** Fraction, e.g. 0.05 for 5%. */
  feeRate: number;
  feeAmount: number;
  refundAmount: number;
  currency: string;
  refundWithinHours: number;
}

export interface CancelBookingInput {
  method: RefundMethod;
  /** Required for BANK. */
  bankName?: string;
  accountTitle: string;
  /** Wallet mobile number or IBAN. Sent in the body only — never in a URL. */
  accountNumber: string;
  reason?: string;
  /** The learner ticked the refund-terms box. The server refuses the request without it. */
  acknowledged: boolean;
}

/** A refund as the learner sees it — the destination only as provider + last four digits. */
export interface LearnerRefund {
  id: number;
  status: RefundStatus;
  amountPaid: number;
  feeAmount: number;
  refundAmount: number;
  currency?: string;
  method?: RefundMethod | null;
  /** Null until the learner gives a destination (tutor cancellations). */
  provider: string | null;
  accountMasked: string | null;
  requestedAt: string;
  refundedAt: string | null;
  reference: string | null;
  cancelledBy?: CancelledBy;
}

/** A refund in the admin queue. Masked; the full number only comes from {@link adminRefundService.reveal}. */
export interface AdminRefund {
  id: number;
  bookingId: number;
  status: RefundStatus;
  learnerId: number;
  learnerName: string;
  learnerEmail: string | null;
  learnerPhone: string | null;
  learnerRole: string | null;
  tutorId: number;
  tutorName: string;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  amountPaid: number;
  feeRate: number;
  feeAmount: number;
  refundAmount: number;
  currency: string;
  method: RefundMethod | null;
  provider: string | null;
  accountTitle: string | null;
  accountMasked: string | null;
  reason: string | null;
  requestedAt: string;
  /** When the learner was promised it by. */
  dueBy: string | null;
  refundedAt: string | null;
  refundedBy: string | null;
  reference: string | null;
  note: string | null;
  cancelledBy: CancelledBy;
}

/** Whether a tutor may cancel a session now, and what the learner would get back. */
export interface TutorCancellationQuote {
  bookingId: number;
  cancellable: boolean;
  reason: string | null;
  /** Last moment the tutor may cancel — ISO local date-time, Pakistan time. */
  deadline: string | null;
  cutoffHours: number;
  /** Everything the learner paid, processing fee included. */
  learnerRefund: number;
  currency: string;
}

export type TutorCancelReason = 'EMERGENCY' | 'ILLNESS' | 'SCHEDULE_CONFLICT' | 'OTHER';

export const TUTOR_CANCEL_REASON_LABEL: Record<TutorCancelReason, string> = {
  EMERGENCY: 'Emergency',
  ILLNESS: 'Illness',
  SCHEDULE_CONFLICT: 'Schedule conflict',
  OTHER: 'Other',
};

export interface RefundDestinationInput {
  method: RefundMethod;
  bankName?: string;
  accountTitle: string;
  accountNumber: string;
}

export const refundService = {
  quote: (bookingId: number) => http.get<CancellationQuote>(`/bookings/${bookingId}/cancellation`),
  cancel: (bookingId: number, input: CancelBookingInput) =>
    http.post<LearnerRefund>(`/bookings/${bookingId}/cancel`, input),
  /** Learner: where to send the refund for a session the tutor cancelled. */
  provideDestination: (bookingId: number, input: RefundDestinationInput) =>
    http.post<LearnerRefund>(`/bookings/${bookingId}/refund-destination`, input),
  /** Tutor: may I cancel this session now? */
  tutorQuote: (bookingId: number) =>
    http.get<TutorCancellationQuote>(`/bookings/${bookingId}/tutor-cancellation`),
  /** Tutor: cancel it. The learner gets a full refund; the tutor gets a reliability strike. */
  tutorCancel: (
    bookingId: number,
    input: { reason: TutorCancelReason; note?: string; acknowledged: boolean },
  ) =>
    http.post<{ bookingId: number; learnerRefund: number; currency: string }>(
      `/bookings/${bookingId}/tutor-cancel`,
      input,
    ),
};

export const adminRefundService = {
  list: () => http.getAllPages<AdminRefund>('/admin/refunds'),
  get: (refundId: number) => http.get<AdminRefund>(`/admin/refunds/${refundId}`),
  /** Returns the full account number. The server records every call against the admin. */
  async reveal(refundId: number): Promise<string> {
    const res = await http.post<{ accountNumber: string }>(`/admin/refunds/${refundId}/reveal`);
    return res.accountNumber;
  },
  complete: (refundId: number, reference: string, note?: string) =>
    http.post<AdminRefund>(`/admin/refunds/${refundId}/complete`, {
      reference,
      note: note || undefined,
    }),
};

/** 0.05 → '5%'. */
export function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
  BANK: 'Bank transfer',
};
