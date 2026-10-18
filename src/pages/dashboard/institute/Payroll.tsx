import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Banknote,
  CheckCircle2,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import {
  hiringService,
  payrollService,
  type PayrollCycle,
  type PayrollStatus,
  type Placement,
} from '@/services/instituteService';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { formatPKR, cn, noNegative } from '@/lib/utils';

const KEY = ['institute', 'payroll'] as const;

const STATUS_BADGE: Record<
  PayrollStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  DUE: { label: 'Awaiting funding', variant: 'gold' },
  FUNDED: { label: 'Held in escrow', variant: 'secondary' },
  RELEASED: { label: 'Paid', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

/**
 * Monthly salary, paid through the platform rather than around it.
 *
 * <p>The holding is the product: a teacher can see the month is secured before they teach it, and a
 * dispute has an actual pot to be resolved against. So the screen leads with what is held, not with
 * what has been paid out.
 */
export default function InstitutePayroll() {
  const qc = useQueryClient();
  const [raising, setRaising] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => payrollService.list(),
  });

  const placements = useQuery({
    queryKey: ['institute', 'placements'],
    queryFn: () => hiringService.placements(),
  });

  const cycles = useMemo(() => data ?? [], [data]);
  const held = cycles
    .filter((c) => c.status === 'FUNDED')
    .reduce((sum, c) => sum + (c.gross ?? 0), 0);
  const due = cycles.filter((c) => c.status === 'DUE').reduce((sum, c) => sum + (c.gross ?? 0), 0);
  const paid = cycles
    .filter((c) => c.status === 'RELEASED')
    .reduce((sum, c) => sum + (c.gross ?? 0), 0);

  const payable = (placements.data ?? []).filter((p) => p.status === 'ACTIVE');

  if (isLoading) return <LoadingState label="Loading payroll…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} message="Could not load payroll." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Payroll</h1>
          <p className="mt-1 text-muted-foreground">
            Pay your teachers through TopTutor. We hold each month until you release it.
          </p>
        </div>
        <Button variant="gradient" disabled={payable.length === 0} onClick={() => setRaising(true)}>
          <Plus className="h-4 w-4" /> Raise a month
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Lock} label="Held in escrow" value={formatPKR(held, { compact: true })} accent="brand" />
        <Stat icon={Wallet} label="Awaiting funding" value={formatPKR(due, { compact: true })} accent="amber" />
        <Stat icon={CheckCircle2} label="Released to teachers" value={formatPKR(paid, { compact: true })} accent="emerald" />
      </div>

      {payable.length === 0 && (
        <div className="rounded-2xl border bg-secondary/30 p-5 text-sm text-muted-foreground">
          Payroll runs on an active placement with a signed contract. Confirm a start date in Hiring
          and get the contract signed by both sides first.
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Banknote className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-bold">No payroll yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Raise a month for an active placement. You fund it, we hold it, and you release it once
            the month has been worked.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((c) => (
            <CycleRow key={c.id} cycle={c} />
          ))}
        </div>
      )}

      {raising && (
        <RaiseDialog
          placements={payable}
          onClose={() => setRaising(false)}
          onRaised={() => {
            qc.invalidateQueries({ queryKey: KEY });
            setRaising(false);
          }}
        />
      )}
    </div>
  );
}

function CycleRow({ cycle: c }: { cycle: PayrollCycle }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['institute'] });
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const fund = useMutation({
    mutationFn: () => payrollService.fund(c.id),
    onSuccess: () => {
      toast.success('Funded', { description: "We're holding this until you release it." });
      refresh();
    },
    onError: fail,
  });
  const release = useMutation({
    mutationFn: () => payrollService.release(c.id),
    onSuccess: () => {
      toast.success('Released', { description: "It's in the teacher's balance." });
      refresh();
    },
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => payrollService.cancel(c.id, 'Cancelled by institute'),
    onSuccess: () => {
      toast.success('Payroll cancelled');
      refresh();
    },
    onError: fail,
  });

  const busy = fund.isPending || release.isPending || cancel.isPending;
  const badge = STATUS_BADGE[c.status];

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-soft',
        c.status === 'DUE' && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold leading-tight">
            {c.periodLabel} — {c.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{c.counterparty}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {c.gross != null && (
              <span className="font-medium text-foreground tabular-nums">
                {formatPKR(c.gross)}
              </span>
            )}
            {c.platformFee != null && c.platformFee > 0 && (
              <span>includes {formatPKR(c.platformFee)} platform fee</span>
            )}
            {c.releasedAt && (
              <span>Released {format(parseISO(c.releasedAt), 'd MMM yyyy')}</span>
            )}
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {c.status === 'FUNDED' && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          We're holding this. The teacher can see it is secured, and it reaches them when you
          release it.
        </p>
      )}

      {(c.status === 'DUE' || c.status === 'FUNDED') && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.status === 'DUE' ? (
            <Button size="sm" variant="gradient" disabled={busy} onClick={() => fund.mutate()}>
              {fund.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wallet className="h-3.5 w-3.5" />
              )}
              Mark funded
            </Button>
          ) : (
            <Button size="sm" variant="gradient" disabled={busy} onClick={() => release.mutate()}>
              {release.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Release to teacher
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => cancel.mutate()}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      )}

      {c.note && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Note: </span>
          {c.note}
        </p>
      )}
    </article>
  );
}

function RaiseDialog({
  placements,
  onClose,
  onRaised,
}: {
  placements: Placement[];
  onClose: () => void;
  onRaised: () => void;
}) {
  const [placementId, setPlacementId] = useState<string>(String(placements[0]?.id ?? ''));
  // Default to the current month: payroll is almost always raised for the month being worked.
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [gross, setGross] = useState('');

  const raise = useMutation({
    mutationFn: () =>
      payrollService.raise(Number(placementId), period, gross ? Number(gross) : undefined),
    onSuccess: (c) => {
      toast.success(`Payroll raised for ${c.periodLabel}`, {
        description: 'Fund it when your transfer goes out.',
      });
      onRaised();
    },
    onError: (e) =>
      toast.error('Could not raise payroll', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const selected = placements.find((p) => String(p.id) === placementId);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise a month</DialogTitle>
          <DialogDescription>
            One month per placement. Both sides must have signed the contract first.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Placement</Label>
            <Select value={placementId} onValueChange={setPlacementId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a placement" />
              </SelectTrigger>
              <SelectContent>
                {placements.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.tutorName} — {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="p-period">Month</Label>
            <Input
              id="p-period"
              type="month"
              className="mt-1"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="p-gross">Amount (PKR)</Label>
            <Input
              id="p-gross"
              type="number"
              inputMode="numeric"
              min={0}
              className="mt-1"
              placeholder={
                selected ? `${selected.monthlySalary} (contract salary)` : 'Contract salary'
              }
              value={gross}
              // A negative payroll amount is a payment from the teacher to the institute. min={0}
              // only stops the spinner, so the minus is dropped as it is typed.
              onChange={(e) => setGross(noNegative(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to use the salary on the signed contract.
            </p>
          </div>

          <Button
            className="w-full"
            variant="gradient"
            disabled={!placementId || !period || raise.isPending}
            onClick={() => raise.mutate()}
          >
            {raise.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Raise payroll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  accent: 'brand' | 'amber' | 'emerald';
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          accent === 'brand' && 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
          accent === 'amber' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
          accent === 'emerald' &&
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-4 font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
