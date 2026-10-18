import { useEffect, useState } from 'react';
import type { SessionPackage, Tutor } from '@/types';
import { env } from '@/config/env';
import { BOOKING_PAYMENT_METHODS, type BookingPaymentMethod } from '@/constants/payment';
import { formatTime } from '@/services/availabilityService';

/** One bookable session: a concrete start and end carved out of a published window. */
export interface SessionSlot {
  weeklySlotId: number;
  start: string;
  end: string;
}

/** Everything chosen on the schedule step — what the payment steps are paying for. */
export interface BookingDraft {
  tutor: Tutor;
  pkg: SessionPackage;
  packageId: string;
  date: string; // 'YYYY-MM-DD'
  slot: SessionSlot;
  minutes: number;
  total: number;
}

/**
 * '08:00' + '09:00' → '8:00 – 9:00 AM'.
 *
 * <p>The opening meridiem is dropped when both ends share it, which is the common case and the
 * difference between a chip that reads as one span and a chip that reads as two timestamps.
 */
export function formatSlotRange(start: string, end: string): string {
  const from = formatTime(start);
  const to = formatTime(end);
  return from.slice(-2) === to.slice(-2) ? `${from.slice(0, -3)} – ${to}` : `${from} – ${to}`;
}

/** '2026-10-20' → 'Tue, 20 Oct'. */
export function formatDay(date: string, withYear = false): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** Seconds left until an ISO instant, ticking once a second; null while there is no deadline. */
export function useCountdown(until: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (!until) return null;
  return Math.max(0, Math.round((new Date(until).getTime() - now) / 1000));
}

/** 155 → '02:35'. */
export function formatClock(seconds: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

export function methodInfo(id: BookingPaymentMethod) {
  return BOOKING_PAYMENT_METHODS.find((m) => m.id === id)!;
}

/**
 * Whether a method runs against the simulated provider rather than a real one — true for every
 * non-live method in mock mode or a dev payment preview. Such a method is badged "Preview" so a
 * reviewer never mistakes it for a working payment.
 */
export function isSimulated(id: BookingPaymentMethod): boolean {
  return !methodInfo(id).live && (env.useMocks || env.paymentPreview);
}

export interface Charge {
  /** The session price. */
  subtotal: number;
  /** Processing fee for the method — 0 when it is free. */
  fee: number;
  feePercent: number;
  /** What the learner actually pays. */
  total: number;
}

/**
 * What a session costs when paid by a given method. The fee is rounded to the whole rupee, the
 * smallest unit PKR is charged in; the server applies the same rule when it sets the amount.
 */
export function chargeFor(subtotal: number, method: BookingPaymentMethod): Charge {
  const feePercent = methodInfo(method).feePercent ?? 0;
  const fee = Math.round((subtotal * feePercent) / 100);
  return { subtotal, fee, feePercent, total: subtotal + fee };
}

/** Whether a method can be chosen right now. */
export function isMethodAvailable(id: BookingPaymentMethod): boolean {
  return methodInfo(id).live || isSimulated(id);
}

/**
 * Per-method colour, used for the tile, the method's primary button and its focus ring.
 *
 * <p>Wallets wear their provider's colour because that is what the learner is looking for on a
 * payment screen — a green button reads as "Easypaisa" before the label does. Card and bank stay on
 * the TopTutor blue/slate so the page does not turn into a row of competing brands.
 */
export const METHOD_TONE: Record<
  BookingPaymentMethod,
  { tile: string; button: string; ring: string; soft: string; text: string }
> = {
  CARD: {
    tile: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    button:
      'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] hover:brightness-105',
    ring: 'focus-within:ring-brand-500/30 focus-within:border-brand-500',
    soft: 'bg-brand-50 dark:bg-brand-500/10',
    text: 'text-brand-600 dark:text-brand-300',
  },
  EASYPAISA: {
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    button:
      'bg-emerald-600 text-white shadow-[0_8px_24px_-8px_rgba(5,150,105,0.6)] hover:bg-emerald-700',
    ring: 'focus-within:ring-emerald-500/30 focus-within:border-emerald-600',
    soft: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  JAZZCASH: {
    tile: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    button: 'bg-red-600 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.55)] hover:bg-red-700',
    ring: 'focus-within:ring-red-500/30 focus-within:border-red-600',
    soft: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
  },
  BANK_TRANSFER: {
    tile: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    button:
      'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] hover:brightness-105',
    ring: 'focus-within:ring-brand-500/30 focus-within:border-brand-500',
    soft: 'bg-slate-50 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-200',
  },
};
