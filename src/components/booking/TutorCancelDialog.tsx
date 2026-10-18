import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarX2, CheckCircle2, Clock, Loader2, Wallet } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import { ApiError } from '@/api/client';
import type { TutorBooking } from '@/services/bookingService';
import {
  TUTOR_CANCEL_REASON_LABEL,
  refundService,
  type TutorCancelReason,
} from '@/services/refundService';
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

const REASONS = Object.keys(TUTOR_CANCEL_REASON_LABEL) as TutorCancelReason[];

/**
 * A tutor cancelling a paid session. The terms come from the server (`/tutor-cancellation`), so the
 * deadline and the learner's refund shown here are the ones the cancel endpoint will apply.
 */
export function TutorCancelDialog({
  booking,
  onClose,
}: {
  booking: TutorBooking;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState<TutorCancelReason | null>(null);
  const [note, setNote] = useState('');
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const {
    data: quote,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings', booking.id, 'tutor-cancellation'],
    queryFn: () => refundService.tutorQuote(booking.id),
    staleTime: 0,
  });

  const noteNeeded = reason === 'OTHER' && !note.trim();
  const cancel = useMutation({
    mutationFn: () =>
      refundService.tutorCancel(booking.id, {
        reason: reason!,
        note: note.trim() || undefined,
        acknowledged: ack,
      }),
    onSuccess: () => {
      setDone(true);
      void qc.invalidateQueries({ queryKey: ['bookings', 'tutor'] });
    },
    onError: (e) => {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.';
      toast.error('Could not cancel the session', { description: msg });
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) {
        void qc.invalidateQueries({ queryKey: ['bookings', 'tutor'] });
        void qc.invalidateQueries({ queryKey: ['bookings', booking.id, 'tutor-cancellation'] });
      }
    },
  });

  const submit = () => {
    setTouched(true);
    if (!reason || noteNeeded || !ack) return;
    cancel.mutate();
  };

  const student = booking.studentName || 'your student';
  const when = `${format(parseISO(`${booking.sessionDate}T00:00:00`), 'EEE, d MMM')} · ${booking.startTime}–${booking.endTime}`;

  return (
    <Dialog open onOpenChange={(next) => !next && !cancel.isPending && onClose()}>
      <DialogContent className="no-scrollbar max-h-[90vh] gap-5 overflow-y-auto [&>*]:min-w-0">
        {done ? (
          <div className="space-y-5 pt-2 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <DialogTitle className="font-display text-2xl font-extrabold">
                Session cancelled
              </DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-sm text-sm">
                {student} has been told and will get a full refund. The time is open on your
                schedule again.
              </DialogDescription>
            </div>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="font-display text-xl">Cancel this session?</DialogTitle>
              <DialogDescription>
                {student} · {when}
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : error || !quote ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                We couldn’t load the cancellation terms. Please close this and try again.
              </p>
            ) : !quote.cancellable ? (
              <div className="space-y-4">
                <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{quote.reason}</span>
                </p>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <ul className="space-y-2.5 text-sm">
                  <Point icon={Wallet} tone="text-emerald-600 dark:text-emerald-400">
                    {student} gets a{' '}
                    <strong>full refund of {formatPKR(quote.learnerRefund)}</strong>, and you won’t
                    be paid for this session.
                  </Point>
                  <Point icon={AlertTriangle} tone="text-amber-600 dark:text-amber-400">
                    It counts as a <strong>reliability strike</strong>. Too many in a short time
                    pauses your new bookings.
                  </Point>
                  <Point icon={Clock} tone="text-brand-600 dark:text-brand-400">
                    You can cancel until{' '}
                    <strong>
                      {quote.deadline
                        ? format(parseISO(quote.deadline), "EEE, d MMM 'at' h:mm a")
                        : '—'}
                    </strong>{' '}
                    (PKT) — {quote.cutoffHours} hours before it starts. After that, contact support.
                  </Point>
                </ul>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <div role="radiogroup" aria-label="Reason" className="grid grid-cols-2 gap-2">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={reason === r}
                        onClick={() => setReason(r)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                          reason === r
                            ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                            : 'hover:bg-secondary/60',
                        )}
                      >
                        {TUTOR_CANCEL_REASON_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  {touched && !reason && (
                    <p className="text-sm text-red-600 dark:text-red-400">Choose a reason.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tutor-cancel-note">
                    Message for {student}{' '}
                    <span className="font-normal text-muted-foreground">
                      {reason === 'OTHER' ? '(required)' : '(optional)'}
                    </span>
                  </Label>
                  <Textarea
                    id="tutor-cancel-note"
                    rows={2}
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Sorry — a family emergency came up."
                  />
                  {touched && noteNeeded && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Tell {student} briefly why you’re cancelling.
                    </p>
                  )}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-secondary/30 p-3.5 text-sm">
                  <Checkbox
                    checked={ack}
                    onCheckedChange={(v) => setAck(v === true)}
                    className="mt-0.5"
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    I understand {student} will be refunded in full, I won’t be paid for this
                    session, and it counts as a strike. Cancelling can’t be undone.
                  </span>
                </label>
                {touched && !ack && reason && !noteNeeded && (
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
                    Cancel session
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
