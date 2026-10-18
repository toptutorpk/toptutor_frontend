import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarX2,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { BookingSummary } from '@/services/bookingService';
import { formatRate, refundService, type LearnerRefund } from '@/services/refundService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import {
  EMPTY_REFUND_ACCOUNT,
  refundAccountPayload,
  validateRefundAccount,
  type RefundAccount,
} from './refundAccount';
import { RefundAccountForm } from './RefundAccountForm';

type Step = 'terms' | 'account' | 'done';

/**
 * Cancelling a paid session and choosing where the refund goes.
 *
 * <p>The terms come from the server (`/cancellation`), not from client arithmetic, so what the
 * learner agrees to is exactly what will be stored. The account details are checked here for
 * convenience and again on the server, which is the check that counts.
 */
export function CancelSessionDialog({
  booking,
  onClose,
}: {
  booking: BookingSummary;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('terms');
  const [reason, setReason] = useState('');
  const [account, setAccount] = useState<RefundAccount>(EMPTY_REFUND_ACCOUNT);
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<LearnerRefund | null>(null);

  const {
    data: quote,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings', booking.id, 'cancellation'],
    queryFn: () => refundService.quote(booking.id),
    staleTime: 0,
  });

  // The deadline can pass while the dialog is open; re-check it every 30s so the button goes away.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const deadlinePassed = quote?.deadline ? pktToEpoch(quote.deadline) <= now : false;
  const open = !!quote?.cancellable && !deadlinePassed;

  const accountError = useMemo(() => validateRefundAccount(account), [account]);

  const cancel = useMutation({
    mutationFn: () =>
      refundService.cancel(booking.id, {
        ...refundAccountPayload(account),
        reason: reason.trim() || undefined,
        acknowledged: ack,
      }),
    onSuccess: (refund) => {
      setResult(refund);
      setStep('done');
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (e) => {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.';
      toast.error('Could not cancel the session', { description: msg });
      // A conflict or a closed window means the list is out of date — refresh it behind the dialog.
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) {
        void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
        void qc.invalidateQueries({ queryKey: ['bookings', booking.id, 'cancellation'] });
      }
    },
  });

  const submit = () => {
    setTouched(true);
    if (accountError || !ack) return;
    cancel.mutate();
  };

  const when = `${format(parseISO(`${booking.sessionDate}T00:00:00`), 'EEE, d MMM')} · ${booking.startTime}–${booking.endTime}`;

  return (
    <Dialog open onOpenChange={(next) => !next && !cancel.isPending && onClose()}>
      <DialogContent className="no-scrollbar max-h-[90vh] gap-5 overflow-y-auto [&>*]:min-w-0">
        {step === 'done' && result ? (
          <Done refund={result} tutor={booking.tutorName} onClose={onClose} />
        ) : (
          <>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2 font-display text-xl">
                {step === 'account' && (
                  <button
                    type="button"
                    aria-label="Back"
                    onClick={() => setStep('terms')}
                    className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                {step === 'terms' ? 'Cancel this session?' : 'Where should we send your refund?'}
              </DialogTitle>
              <DialogDescription>
                {booking.tutorName} · {when}
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : error || !quote ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                We couldn’t load the cancellation terms. Please close this and try again.
              </p>
            ) : !open ? (
              <Closed
                reason={
                  deadlinePassed
                    ? closedText(quote.cutoffHours)
                    : (quote.reason ?? closedText(quote.cutoffHours))
                }
                onClose={onClose}
              />
            ) : step === 'terms' ? (
              <>
                <div className="space-y-2 rounded-xl border bg-secondary/30 p-4 text-sm">
                  <Row label="You paid" value={formatPKR(quote.amountPaid)} />
                  <Row
                    label={`Processing fee (${formatRate(quote.feeRate)})`}
                    value={`− ${formatPKR(quote.feeAmount)}`}
                    tone="text-red-600 dark:text-red-400"
                  />
                  <div className="flex items-baseline justify-between border-t pt-2.5">
                    <span className="font-semibold">You’ll get back</span>
                    <span className="font-display text-2xl font-extrabold tabular-nums">
                      {formatPKR(quote.refundAmount)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm">
                  <Point icon={ShieldCheck} tone="text-brand-600 dark:text-brand-400">
                    {formatRate(quote.feeRate)} is kept to cover processing the reversal.
                  </Point>
                  <Point icon={Clock} tone="text-emerald-600 dark:text-emerald-400">
                    Your refund is sent within <strong>{quote.refundWithinHours} hours</strong> to
                    the account you choose next.
                  </Point>
                  <Point icon={AlertTriangle} tone="text-amber-600 dark:text-amber-400">
                    You can cancel until{' '}
                    <strong>
                      {quote.deadline
                        ? format(parseISO(quote.deadline), "EEE, d MMM 'at' h:mm a")
                        : '—'}
                    </strong>{' '}
                    (PKT) — {quote.cutoffHours} hours before it starts. After that it can’t be
                    cancelled or refunded.
                  </Point>
                </ul>

                <div className="space-y-1.5">
                  <Label htmlFor="cancel-reason">
                    Reason <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="cancel-reason"
                    rows={2}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Exam rescheduled"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={onClose}>
                    Keep session
                  </Button>
                  <Button variant="destructive" onClick={() => setStep('account')}>
                    Continue to refund details
                  </Button>
                </div>
              </>
            ) : (
              <>
                <RefundAccountForm value={account} onChange={setAccount} showError={touched} />

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-secondary/30 p-3.5 text-sm">
                  <Checkbox
                    checked={ack}
                    onCheckedChange={(v) => setAck(v === true)}
                    className="mt-0.5"
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    I understand{' '}
                    <strong className="text-foreground">{formatPKR(quote.feeAmount)}</strong> (
                    {formatRate(quote.feeRate)}) is deducted and{' '}
                    <strong className="text-foreground">{formatPKR(quote.refundAmount)}</strong>{' '}
                    will be sent to this account within {quote.refundWithinHours} hours. Cancelling
                    can’t be undone.
                  </span>
                </label>
                {touched && !ack && !accountError && (
                  <p className="-mt-3 text-sm text-red-600 dark:text-red-400">
                    Please tick the box to confirm.
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={onClose} disabled={cancel.isPending}>
                    Keep session
                  </Button>
                  <Button variant="destructive" onClick={submit} disabled={cancel.isPending}>
                    {cancel.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarX2 className="h-4 w-4" />
                    )}
                    Cancel session & request refund
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Done({
  refund,
  tutor,
  onClose,
}: {
  refund: LearnerRefund;
  tutor: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5 pt-2 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </span>
      <div>
        <DialogTitle className="font-display text-2xl font-extrabold">
          Session cancelled
        </DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-sm text-sm">
          Your session with {tutor} is cancelled and they’ve been told. We’ll send{' '}
          <strong className="text-foreground">{formatPKR(refund.refundAmount)}</strong> to{' '}
          {refund.provider} {refund.accountMasked} within 24 hours, and email you when it’s done.
        </DialogDescription>
      </div>
      <div className="space-y-1.5 rounded-xl border bg-secondary/30 p-4 text-left text-sm">
        <Row label="You paid" value={formatPKR(refund.amountPaid)} />
        <Row label="Processing fee" value={`− ${formatPKR(refund.feeAmount)}`} />
        <Row label="Refund" value={formatPKR(refund.refundAmount)} strong />
        <Row label="Status" value="Refund pending" />
      </div>
      <Button className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function Closed({ reason, onClose }: { reason: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{reason}</span>
      </p>
      <Button variant="outline" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', strong ? 'font-bold' : 'font-medium', tone)}>
        {value}
      </span>
    </div>
  );
}

function Point({
  icon: Icon,
  tone,
  children,
}: {
  icon: React.ElementType;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2.5 text-muted-foreground">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} />
      <span>{children}</span>
    </li>
  );
}

function closedText(cutoffHours: number) {
  return `Cancellation closed ${cutoffHours} hours before the session started, so it can no longer be cancelled or refunded.`;
}

/** 'YYYY-MM-DDTHH:mm' in Pakistan time (UTC+5, no DST) → epoch ms. */
function pktToEpoch(local: string): number {
  return new Date(`${local.length === 16 ? `${local}:00` : local}+05:00`).getTime();
}
