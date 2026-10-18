import { http } from '@/api/client';
import { env } from '@/config/env';
import { BOOKING_HOLD_MINUTES, BOOKING_PAYMENT_METHODS, type BookingPaymentMethod } from '@/constants/payment';
import { bookingService, type CreateSessionInput } from '@/services/bookingService';

/**
 * Session payments across every method.
 *
 * <p>The booking (and the hold on its slot) is created once; the learner then pays for it by
 * whichever method they pick, and may switch method on the same booking while the hold lasts.
 *
 * <p>Card goes through the existing Safepay checkout. The wallet and bank-transfer calls describe
 * the endpoints the server will expose for them; until it does, those methods are marked non-live
 * and only reachable in mock mode, where the simulated provider below answers instead.
 */

/** A booking whose slot is held while the learner pays. */
export interface PaymentHold {
  bookingId: number;
  amount: number;
  currency: string;
  /** ISO instant the slot is released if still unpaid. */
  expiresAt: string;
  /** Safepay hosted-checkout URL — present only when the hold was created for a card payment. */
  checkoutUrl?: string;
}

export interface WalletRequest {
  /** ISO instant the push request lapses in the wallet app. */
  expiresAt: string;
}

export type PaymentState = 'PENDING' | 'PAID' | 'FAILED' | 'UNDER_REVIEW';

export interface PaymentStatus {
  bookingId: number;
  state: PaymentState;
  method?: BookingPaymentMethod;
  /** Provider's transaction ID, once paid. */
  transactionId?: string;
  /** Our human-facing booking reference, e.g. TT-20481. */
  reference: string;
  /** Masked account the money came from, e.g. "0300 ••• 4567". */
  paidFrom?: string;
  /** Plain-language reason when `state` is FAILED. */
  failureReason?: string;
}

export interface WalletDetails {
  /** National significant number: ten digits starting with 3. */
  msisdn: string;
  /** Last six digits of the payer's CNIC — required by JazzCash's mobile-account API. */
  cnicLast6?: string;
}

export interface BankTransferDetails {
  /** Reference / transaction ID printed on the learner's bank receipt. */
  transactionRef: string;
  /** Screenshot or PDF of the transfer receipt. */
  proof: File;
}

/** Normalises any common spelling of a Pakistani mobile number to its ten national digits. */
export function normaliseMsisdn(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').replace(/^(0092|92|0)/, '');
  return /^3\d{9}$/.test(digits) ? digits : null;
}

/** '3001234567' → '0300 ••• 4567'. */
export function maskMsisdn(msisdn: string): string {
  return `0${msisdn.slice(0, 3)} ••• ${msisdn.slice(-4)}`;
}

export function bookingReference(bookingId: number): string {
  return `TT-${bookingId}`;
}

const live = {
  async hold(input: CreateSessionInput, method: BookingPaymentMethod): Promise<PaymentHold> {
    const res = await bookingService.createSession({ ...input, method });
    return {
      bookingId: res.bookingId,
      amount: res.amount,
      currency: res.currency,
      expiresAt:
        res.holdExpiresAt ?? new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000).toISOString(),
      checkoutUrl: res.checkoutUrl,
    };
  },
  requestWallet: (bookingId: number, method: 'EASYPAISA' | 'JAZZCASH', details: WalletDetails) =>
    http.post<WalletRequest>(`/bookings/${bookingId}/wallet-payments`, { method, ...details }),
  status: (bookingId: number) => http.get<PaymentStatus>(`/bookings/${bookingId}/payment`),
  submitBankTransfer(bookingId: number, details: BankTransferDetails) {
    const form = new FormData();
    form.append('transactionRef', details.transactionRef);
    form.append('proof', details.proof);
    return http.post<PaymentStatus>(`/bookings/${bookingId}/bank-transfer`, form);
  },
};

/**
 * A stand-in provider for design review. Behaves like the real one at the level the UI can see:
 * a wallet request is approved a few seconds after it is sent, and any number ending in 0000 is
 * declined, so both outcomes can be walked through.
 */
const mockState = new Map<number, { method: BookingPaymentMethod; sentAt: number; msisdn?: string; decline?: boolean; review?: boolean }>();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mock: typeof live = {
  async hold() {
    await delay(500);
    const bookingId = 20000 + Math.floor(Math.random() * 9000);
    return {
      bookingId,
      amount: 0,
      currency: 'PKR',
      expiresAt: new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000).toISOString(),
    };
  },
  async requestWallet(bookingId, method, details) {
    await delay(700);
    mockState.set(bookingId, {
      method,
      sentAt: Date.now(),
      msisdn: details.msisdn,
      decline: details.msisdn.endsWith('0000'),
    });
    return { expiresAt: new Date(Date.now() + 3 * 60_000).toISOString() };
  },
  async status(bookingId) {
    await delay(400);
    const s = mockState.get(bookingId);
    const base = { bookingId, reference: bookingReference(bookingId), method: s?.method };
    if (!s) return { ...base, state: 'PENDING' };
    if (s.review) return { ...base, state: 'UNDER_REVIEW' };
    if (Date.now() - s.sentAt < 5000) return { ...base, state: 'PENDING' };
    if (s.decline) {
      return {
        ...base,
        state: 'FAILED',
        failureReason: 'The request was declined in the wallet app, or the balance was too low.',
      };
    }
    return {
      ...base,
      state: 'PAID',
      transactionId: `${s.method === 'JAZZCASH' ? 'JC' : 'EP'}${String(bookingId).padStart(10, '0')}`,
      paidFrom: s.msisdn ? maskMsisdn(s.msisdn) : undefined,
    };
  },
  async submitBankTransfer(bookingId) {
    await delay(900);
    mockState.set(bookingId, { method: 'BANK_TRANSFER', sentAt: Date.now(), review: true });
    return { bookingId, reference: bookingReference(bookingId), method: 'BANK_TRANSFER', state: 'UNDER_REVIEW' };
  },
};

/**
 * Methods the server does not take yet run against the stand-in above when mocks or the dev
 * payment preview are on. Card is always real. A booking created by the stand-in is remembered so
 * every later call for it goes to the stand-in too.
 */
const simulatedBookings = new Set<number>();
const isSimulated = (method: BookingPaymentMethod) =>
  !BOOKING_PAYMENT_METHODS.find((m) => m.id === method)?.live && (env.useMocks || env.paymentPreview);
const route = (bookingId: number) => (simulatedBookings.has(bookingId) ? mock : live);

export const paymentService: typeof live = {
  async hold(input, method) {
    if (!isSimulated(method)) return live.hold(input, method);
    const held = await mock.hold(input, method);
    simulatedBookings.add(held.bookingId);
    return held;
  },
  requestWallet: (bookingId, method, details) => route(bookingId).requestWallet(bookingId, method, details),
  status: (bookingId) => route(bookingId).status(bookingId),
  submitBankTransfer: (bookingId, details) => route(bookingId).submitBankTransfer(bookingId, details),
};
