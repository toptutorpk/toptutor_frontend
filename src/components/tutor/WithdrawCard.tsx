import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Banknote, CheckCircle2, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { queryKeys } from '@/api/queryKeys';
import { ApiError } from '@/api/client';
import { cn, formatPKR, pluralize } from '@/lib/utils';
import {
  payoutService,
  withdrawalService,
  type PayoutRequest,
  type PayoutRequestStatus,
} from '@/services/payoutService';

const KEY = ['withdrawals'] as const;

/**
 * Cleared funds, and the button that claims them.
 *
 * <p>The withdrawal takes the whole available balance — there is no amount field, because the
 * server decides what has cleared and a client that could name its own figure could name any.
 * The button explains why it is unavailable rather than just being greyed out: on a money screen,
 * a dead control with no reason reads as something broken.
 */
export function WithdrawCard({
  available,
  escrowReleaseHours,
  minWithdrawal,
}: {
  available: number;
  escrowReleaseHours: number;
  minWithdrawal: number;
}) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data: account } = useQuery({ queryKey: ['payout-account'], queryFn: payoutService.get });
  const { data: history = [] } = useQuery({ queryKey: KEY, queryFn: withdrawalService.list });

  const open = history.find((r) => r.status === 'REQUESTED' || r.status === 'APPROVED');

  const withdraw = useMutation({
    mutationFn: withdrawalService.request,
    onSuccess: (created) => {
      setConfirming(false);
      void qc.invalidateQueries({ queryKey: KEY });
      // The balance moved, so the whole earnings page is stale.
      void qc.invalidateQueries({ queryKey: queryKeys.earnings.all });
      toast.success('Withdrawal requested', {
        description: `${formatPKR(created.amount)} to ${created.provider} ${created.maskedNumber}.`,
      });
    },
    onError: (e) => {
      toast.error('Could not request the withdrawal', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    },
  });

  const blocked = reasonBlocked({ account, available, minWithdrawal, open });

  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
      <div>
        <Banknote className="h-8 w-8" />
        <h3 className="mt-3 font-display text-lg font-bold">Ready to pay out</h3>
        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
          {formatPKR(available)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          {open
            ? `Your withdrawal of ${formatPKR(open.amount)} is ${open.status === 'APPROVED' ? 'approved and being sent' : 'with our finance team'}.`
            : `Cleared ${escrowReleaseHours} hours after each session ends, then sent to your payout account.`}
        </p>
        {blocked && !open && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/10 p-2.5 text-xs leading-relaxed text-white/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {blocked}
          </p>
        )}
      </div>

      <Button
        variant="secondary"
        className="mt-5 w-full bg-white text-brand-700 hover:bg-white/90"
        disabled={Boolean(blocked) || withdraw.isPending}
        onClick={() => setConfirming(true)}
      >
        <Send className="h-4 w-4" />
        {open ? 'Withdrawal in progress' : 'Withdraw'}
      </Button>

      <Dialog open={confirming} onOpenChange={(next) => !withdraw.isPending && setConfirming(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw {formatPKR(available)}?</DialogTitle>
            <DialogDescription>
              This claims every session that has cleared. It cannot be split or partly withdrawn.
            </DialogDescription>
          </DialogHeader>

          {account?.configured && (
            <div className="rounded-xl border bg-secondary/30 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sending to</p>
              <p className="mt-1 font-semibold">
                {account.provider}{' '}
                <span className="font-normal tabular-nums text-muted-foreground">
                  {account.maskedNumber}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{account.accountTitle}</p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Our finance team transfers it by hand, so it is not instant. You will see the
            transaction reference here once it has been sent.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={withdraw.isPending}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>
              {withdraw.isPending ? 'Requesting…' : 'Confirm withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Why the button is off, in the tutor's terms — or null when it is on.
 *
 * <p>Mirrors the server's refusals so the reason appears before the request is made rather than as
 * a toast afterwards. The server still enforces every one of these; this is not the control.
 */
function reasonBlocked({
  account,
  available,
  minWithdrawal,
  open,
}: {
  account?: { configured: boolean; status?: string; coolingOff: boolean; coolOffHours: number };
  available: number;
  minWithdrawal: number;
  open?: PayoutRequest;
}): string | null {
  if (open) return null;
  if (!account?.configured) return 'Add a payout account first so we know where to send it.';
  if (account.status === 'REJECTED') return 'Your payout account is blocked. Contact support.';
  if (account.coolingOff) {
    return `Your payout account was changed recently. It can receive money ${account.coolOffHours} hours after a change.`;
  }
  if (available <= 0) return 'Nothing has cleared yet. Money clears after a session ends.';
  if (available < minWithdrawal) {
    return `The smallest withdrawal is ${formatPKR(minWithdrawal)}. You have ${formatPKR(available)} cleared.`;
  }
  return null;
}

const STATUS_STYLE: Record<PayoutRequestStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  REQUESTED: { label: 'With finance', variant: 'warning' },
  APPROVED: { label: 'Being sent', variant: 'secondary' },
  PAID: { label: 'Paid', variant: 'success' },
  REJECTED: { label: 'Declined', variant: 'destructive' },
};

/** The tutor's withdrawal history. Hidden entirely until there is one. */
export function WithdrawalHistory() {
  const { data = [] } = useQuery({ queryKey: KEY, queryFn: withdrawalService.list });
  if (data.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-soft">
      <h2 className="border-b p-5 font-display text-lg font-bold">Withdrawals</h2>
      <ul className="divide-y">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-5">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                r.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : r.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                    : 'bg-secondary text-muted-foreground',
              )}
            >
              {r.status === 'PAID' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : r.status === 'REJECTED' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold tabular-nums">{formatPKR(r.amount)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.provider} {r.maskedNumber} · {r.sessionCount}{' '}
                {pluralize(r.sessionCount, 'session')} ·{' '}
                {format(parseISO(r.requestedAtIso), 'd MMM yyyy')}
              </p>
              {r.reference && (
                <p className="truncate font-mono text-xs text-muted-foreground">
                  Ref {r.reference}
                </p>
              )}
              {r.status === 'REJECTED' && r.notes && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{r.notes}</p>
              )}
            </div>

            <Badge variant={STATUS_STYLE[r.status].variant}>{STATUS_STYLE[r.status].label}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
