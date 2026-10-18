import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarPlus, Check, Clock, Hourglass, RefreshCw } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import { downloadIcs } from '@/lib/calendar';
import type { BookingPaymentMethod } from '@/constants/payment';
import type { PaymentStatus } from '@/services/paymentService';
import { formatTime } from '@/services/availabilityService';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type BookingDraft, chargeFor, formatClock, formatDay, formatSlotRange, isSimulated, methodInfo, useCountdown } from './flow';
import { FinePrint, TutorAvatar } from './FlowChrome';
import { ReceiptButton } from './ReceiptButton';
import { PaymentMethodIcon } from './PaymentMethodIcon';

function Hero({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'brand' | 'success' | 'danger' | 'warning';
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  const ring = {
    brand: 'bg-brand-100 dark:bg-brand-500/20',
    success: 'bg-emerald-100 dark:bg-emerald-500/20',
    danger: 'bg-red-100 dark:bg-red-500/20',
    warning: 'bg-amber-100 dark:bg-amber-500/20',
  }[tone];
  const dot = {
    brand: 'bg-brand-600',
    success: 'bg-emerald-600',
    danger: 'bg-red-600',
    warning: 'bg-amber-500',
  }[tone];
  return (
    <div className="pt-2 text-center">
      <span className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full', ring)}>
        <span className={cn('flex h-14 w-14 items-center justify-center rounded-full text-white', dot)}>
          <Icon className="h-7 w-7" strokeWidth={2.5} />
        </span>
      </span>
      <DialogTitle className="mt-4 font-display text-2xl font-extrabold">{title}</DialogTitle>
      <DialogDescription asChild>
        <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</div>
      </DialogDescription>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export function ProcessingView({ draft }: { draft: BookingDraft }) {
  return (
    <>
      <div className="pt-4 text-center">
        <span className="mx-auto block h-16 w-16 animate-spin rounded-full border-[5px] border-brand-100 border-t-brand-600 dark:border-brand-500/20 dark:border-t-brand-400" />
        <DialogTitle className="mt-5 font-display text-2xl font-extrabold">Confirming your payment…</DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          This usually takes a few seconds. Please don’t close or refresh this window.
        </DialogDescription>
      </div>
      <dl className="space-y-2 rounded-xl border bg-secondary/40 p-4 text-sm">
        <Row label="Session" value={`${formatDay(draft.date)} · ${formatTime(draft.slot.start)}`} />
        <Row label="Tutor" value={draft.tutor.name} />
        <Row label="Amount" value={formatPKR(draft.total)} strong />
      </dl>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export function ConfirmedView({ draft, status }: { draft: BookingDraft; status: PaymentStatus }) {
  const first = draft.tutor.name.split(' ')[0];
  const method = status.method ? methodInfo(status.method).name : 'Card';
  const simulated = status.method ? isSimulated(status.method) : false;
  const paid = chargeFor(draft.total, status.method ?? 'CARD');
  return (
    <>
      <Hero tone="success" icon={Check} title="You’re booked!">
        Payment of <strong className="text-foreground">{formatPKR(paid.total)}</strong> received. {first} has been
        notified and a receipt is on its way to your email.
      </Hero>

      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-3 bg-secondary/40 p-3.5">
          <TutorAvatar tutor={draft.tutor} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {draft.pkg.title} · {draft.tutor.name}
            </p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {formatDay(draft.date, true)} · {formatSlotRange(draft.slot.start, draft.slot.end)} (PKT)
            </p>
          </div>
        </div>
        <dl className="space-y-2 border-t border-dashed p-3.5 text-sm">
          <Row
            label="Paid with"
            value={
              <span className="inline-flex items-center gap-1.5">
                {status.method && <PaymentMethodIcon method={status.method} size="sm" />}
                {status.paidFrom ? `${method} · ${status.paidFrom}` : method}
              </span>
            }
          />
          {status.transactionId && <Row label="Transaction ID" value={status.transactionId} mono />}
          <Row label="Booking ref." value={status.reference} mono />
          {paid.fee > 0 && <Row label={`Card processing fee · ${paid.feePercent}%`} value={formatPKR(paid.fee)} />}
          <div className="mt-1 flex items-baseline justify-between border-t pt-2.5">
            <dt className="font-semibold">Total paid</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatPKR(paid.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2">
        <Button variant="gradient" size="lg" className="w-full" asChild>
          <Link to="/dashboard/student/bookings">View my bookings</Link>
        </Button>
        {/* A simulated booking has no server-side receipt to open. */}
        <div className={cn('grid gap-2', simulated ? 'grid-cols-1' : 'grid-cols-2')}>
          <Button
            variant="outline"
            onClick={() =>
              downloadIcs({
                uid: status.reference,
                title: `${draft.pkg.title} with ${draft.tutor.name} · TopTutor`,
                description: `Booking ${status.reference}`,
                date: draft.date,
                start: draft.slot.start,
                end: draft.slot.end,
              })
            }
          >
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </Button>
          {!simulated && (
            <ReceiptButton bookingId={status.bookingId} size="default" />
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export function UnderReviewView({ draft, status, reviewWindow }: { draft: BookingDraft; status: PaymentStatus; reviewWindow: string }) {
  return (
    <>
      <Hero tone="warning" icon={Hourglass} title="Transfer submitted">
        We’ll match your transfer of <strong className="text-foreground">{formatPKR(draft.total)}</strong> and confirm
        your session {reviewWindow}. You’ll get an email and a notification as soon as it’s done.
      </Hero>
      <dl className="space-y-2 rounded-xl border bg-secondary/40 p-4 text-sm">
        <Row label="Session" value={`${formatDay(draft.date)} · ${formatSlotRange(draft.slot.start, draft.slot.end)}`} />
        <Row label="Tutor" value={draft.tutor.name} />
        <Row label="Booking ref." value={status.reference} mono />
        <Row label="Status" value="Awaiting confirmation" />
      </dl>
      <Button variant="gradient" size="lg" className="w-full" asChild>
        <Link to="/dashboard/student/bookings">View my bookings</Link>
      </Button>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------ */

const FIXES: Record<BookingPaymentMethod, string[]> = {
  CARD: [
    'Check the card number, expiry and CVC',
    'Make sure online payments are enabled on your card',
    'Try Easypaisa or JazzCash — no card needed',
  ],
  EASYPAISA: [
    'Approve the request before the timer runs out',
    'Check your Easypaisa balance covers the full amount',
    'Make sure the number is the one registered with Easypaisa',
  ],
  JAZZCASH: [
    'Approve the request before the timer runs out',
    'Check your JazzCash balance covers the full amount',
    'Make sure the CNIC digits match your JazzCash account',
  ],
  BANK_TRANSFER: ['Check the transaction ID matches your receipt', 'Upload a clear screenshot of the receipt'],
};

export function FailedView({
  draft,
  method,
  reason,
  holdExpiresAt,
  onRetry,
  onOtherMethod,
}: {
  draft: BookingDraft;
  method: BookingPaymentMethod;
  reason?: string;
  holdExpiresAt: string | null;
  onRetry: () => void;
  onOtherMethod: () => void;
}) {
  const left = useCountdown(holdExpiresAt);
  const holdLapsed = left === 0;
  return (
    <>
      <Hero tone="danger" icon={AlertTriangle} title="Payment didn’t go through">
        {reason ?? 'The payment was not completed.'} If any amount was deducted, it will be reversed automatically.
      </Hero>

      {left != null && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3.5 text-sm',
            holdLapsed
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          {holdLapsed ? (
            <span>Your hold on this slot has lapsed — pick the time again to rebook.</span>
          ) : (
            <span>
              Your slot <strong>{formatDay(draft.date)} · {formatTime(draft.slot.start)}</strong> is held for another{' '}
              <strong className="tabular-nums">{formatClock(left)}</strong>
            </span>
          )}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">Common fixes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {FIXES[method].map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Button variant="gradient" size="lg" className="w-full" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={onOtherMethod}>
          Choose another payment method
        </Button>
        <FinePrint>
          Still stuck?{' '}
          <Link to="/contact" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Contact support
          </Link>
        </FinePrint>
      </div>
    </>
  );
}

function Row({ label, value, strong, mono }: { label: string; value: React.ReactNode; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 truncate text-right tabular-nums', strong ? 'font-bold' : 'font-medium', mono && 'font-mono text-xs')}>
        {value}
      </dd>
    </div>
  );
}
