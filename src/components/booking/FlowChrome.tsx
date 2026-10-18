import { ArrowLeft, Check } from 'lucide-react';
import { cn, formatPKR, getInitials } from '@/lib/utils';
import type { Tutor } from '@/types';
import { formatDuration, formatTime } from '@/services/availabilityService';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { BookingPaymentMethod } from '@/constants/payment';
import { type BookingDraft, chargeFor, formatDay, formatSlotRange } from './flow';

/**
 * Title row for every step. The dialog's own close button sits in the top-right corner, so this
 * reserves room for it rather than drawing a second one.
 */
export function FlowHeader({
  title,
  subtitle,
  onBack,
  aside,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 pr-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <DialogTitle className="font-display text-xl font-bold leading-tight">{title}</DialogTitle>
        <DialogDescription className={cn('mt-0.5 text-sm text-muted-foreground', !subtitle && 'sr-only')}>
          {subtitle ?? title}
        </DialogDescription>
      </div>
      {aside}
    </div>
  );
}

const STEPS = ['Schedule', 'Payment', 'Confirmed'] as const;

export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn('flex items-center gap-2', i < STEPS.length - 1 && 'flex-1')}>
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                active && 'bg-brand-600 text-white',
                done && 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
                !active && !done && 'bg-secondary text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'whitespace-nowrap text-xs font-semibold sm:text-sm',
                active ? 'text-foreground' : done ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground',
                // Three labels do not fit a phone-width dialog; the dots still show progress.
                !active && 'hidden sm:inline',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn('h-px min-w-3 flex-1', done ? 'bg-brand-500' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Tutor, package and time — the "what am I paying for" card at the top of the payment step. */
export function DraftSummary({ draft, onEdit }: { draft: BookingDraft; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-secondary/40 p-3">
      <TutorAvatar tutor={draft.tutor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {draft.pkg.title} with {draft.tutor.name}
        </p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">
          {formatDay(draft.date)} · {formatSlotRange(draft.slot.start, draft.slot.end)}
        </p>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Edit
        </button>
      )}
    </div>
  );
}

export function TutorAvatar({ tutor }: { tutor: Tutor }) {
  return tutor.avatarUrl ? (
    <img src={tutor.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
      {getInitials(tutor.name)}
    </span>
  );
}

/** Fee lines and total for the selected method, shown on the method picker. */
export function PriceBreakdown({ draft, method }: { draft: BookingDraft; method: BookingPaymentMethod }) {
  const charge = chargeFor(draft.total, method);
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between gap-3 text-muted-foreground">
        <span className="truncate">
          {draft.pkg.sessions > 1 ? `${draft.pkg.title} (${draft.pkg.sessions} sessions)` : 'Session fee'} ·{' '}
          {formatDuration(draft.minutes)}
        </span>
        <span className="shrink-0 tabular-nums">{formatPKR(charge.subtotal)}</span>
      </div>
      <div className="flex justify-between gap-3 text-muted-foreground">
        <span>Processing fee{charge.fee > 0 && ` · card ${charge.feePercent}%`}</span>
        {charge.fee > 0 ? (
          <span className="shrink-0 tabular-nums">{formatPKR(charge.fee)}</span>
        ) : (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t pt-2.5">
        <span className="font-semibold">Total</span>
        <span className="font-display text-2xl font-extrabold tabular-nums">{formatPKR(charge.total)}</span>
      </div>
      {/* Only said when it is true and useful: the learner picked the one method with a fee. */}
      {charge.fee > 0 && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          Pay with Easypaisa or JazzCash to skip the {formatPKR(charge.fee)} card fee.
        </p>
      )}
    </div>
  );
}

/** "Total · Tue, 20 Oct, 9:00 AM   PKR 1,000" above each method's pay button. */
export function TotalLine({ draft, method }: { draft: BookingDraft; method: BookingPaymentMethod }) {
  const charge = chargeFor(draft.total, method);
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="truncate text-sm text-muted-foreground">
        Total · {formatDay(draft.date)}, {formatTime(draft.slot.start)}
        {charge.fee > 0 && ` · incl. ${charge.feePercent}% fee`}
      </span>
      <span className="shrink-0 font-display text-xl font-extrabold tabular-nums">{formatPKR(charge.total)}</span>
    </div>
  );
}

/** Small reassurance line under a primary button. */
export function FinePrint({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
