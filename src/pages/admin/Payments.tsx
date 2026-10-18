import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, PersonCell, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from '@/components/ui/sonner';
import { formatPKR, pluralize } from '@/lib/utils';
import {
  adminWithdrawalService,
  type AdminPayoutRequest,
  type PayoutRequestStatus,
} from '@/services/payoutService';

const KEY = ['admin', 'payouts'] as const;

const STATUS_STYLE: Record<
  PayoutRequestStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  REQUESTED: { label: 'Awaiting review', variant: 'warning' },
  APPROVED: { label: 'Cleared to send', variant: 'secondary' },
  PAID: { label: 'Paid', variant: 'success' },
  REJECTED: { label: 'Declined', variant: 'destructive' },
};

/**
 * The withdrawal queue finance works through.
 *
 * <p>This page used to show invented revenue figures. Everything here is now a real payout request
 * against real claimed sessions — a screen about money that shows made-up numbers is worse than no
 * screen. Reporting on incoming payments is not built yet, and is absent rather than mocked.
 */
export default function AdminPayments() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => adminWithdrawalService.list(),
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<AdminPayoutRequest | null>(null);

  const all = useMemo(() => data ?? [], [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (status === 'all' || r.request.status === status) &&
        (!q ||
          r.tutorName.toLowerCase().includes(q) ||
          r.tutorEmail.toLowerCase().includes(q) ||
          r.request.provider.toLowerCase().includes(q) ||
          (r.request.reference ?? '').toLowerCase().includes(q)),
    );
  }, [all, query, status]);

  const sum = (s: PayoutRequestStatus) =>
    all.filter((r) => r.request.status === s).reduce((total, r) => total + r.request.amount, 0);
  const count = (s: PayoutRequestStatus) => all.filter((r) => r.request.status === s).length;

  const columns: Column<AdminPayoutRequest>[] = [
    { header: 'Tutor', cell: (r) => <PersonCell name={r.tutorName || '—'} sub={r.tutorEmail} /> },
    {
      header: 'Amount',
      align: 'right',
      cell: (r) => (
        <div>
          <p className="font-semibold tabular-nums">{formatPKR(r.request.amount)}</p>
          <p className="text-xs text-muted-foreground">
            {r.request.sessionCount} {pluralize(r.request.sessionCount, 'session')}
          </p>
        </div>
      ),
    },
    {
      header: 'Send to',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate">{r.request.provider}</p>
          <p className="truncate text-xs tabular-nums text-muted-foreground">
            {r.request.maskedNumber} · {r.request.accountTitle}
          </p>
        </div>
      ),
    },
    {
      header: 'Requested',
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(r.request.requestedAtIso), { addSuffix: true })}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (r) => (
        <div className="space-y-1">
          <Badge variant={STATUS_STYLE[r.request.status].variant}>
            {STATUS_STYLE[r.request.status].label}
          </Badge>
          {r.request.reference && (
            <p className="font-mono text-[11px] text-muted-foreground">{r.request.reference}</p>
          )}
        </div>
      ),
    },
    {
      header: '',
      align: 'right',
      cell: (r) => (
        <Button
          variant={r.request.status === 'REQUESTED' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelected(r)}
        >
          {r.request.status === 'PAID' || r.request.status === 'REJECTED' ? 'View' : 'Process'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Withdrawal requests from tutors. Transfers are made by hand, then recorded here with their reference."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="Clock"
          label={`Awaiting review · ${count('REQUESTED')}`}
          value={formatPKR(sum('REQUESTED'))}
          accent="amber"
        />
        <StatCard
          icon="ArrowDownToLine"
          label={`Cleared to send · ${count('APPROVED')}`}
          value={formatPKR(sum('APPROVED'))}
          accent="brand"
        />
        <StatCard
          icon="Banknote"
          label={`Paid · ${count('PAID')}`}
          value={formatPKR(sum('PAID'))}
          accent="emerald"
        />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutor, wallet or reference…"
              className="pl-9"
            />
          </div>
        }
        right={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All requests</SelectItem>
              <SelectItem value="REQUESTED">Awaiting review</SelectItem>
              <SelectItem value="APPROVED">Cleared to send</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="REJECTED">Declined</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getKey={(r) => String(r.request.id)}
          empty="No withdrawal requests yet."
        />
      )}

      {selected && <ProcessDialog row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/** Approve, settle, or decline one request. */
function ProcessDialog({ row, onClose }: { row: AdminPayoutRequest; onClose: () => void }) {
  const qc = useQueryClient();
  const { request } = row;
  const [reference, setReference] = useState(request.reference ?? '');
  const [notes, setNotes] = useState('');
  const [declining, setDeclining] = useState(false);

  const decide = useMutation({
    mutationFn: (next: 'APPROVED' | 'PAID' | 'REJECTED') =>
      adminWithdrawalService.decide(request.id, next, {
        reference: next === 'PAID' ? reference.trim() : undefined,
        notes: next === 'REJECTED' ? notes.trim() : undefined,
      }),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: KEY });
      onClose();
      toast.success(
        updated.request.status === 'PAID'
          ? 'Marked as paid'
          : updated.request.status === 'REJECTED'
            ? 'Request declined'
            : 'Approved — cleared to send',
      );
    },
    onError: (e) => {
      toast.error('Could not save that', {
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    },
  });

  const settled = request.status === 'PAID' || request.status === 'REJECTED';

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {formatPKR(request.amount)} to {row.tutorName || 'this tutor'}
          </DialogTitle>
          <DialogDescription>
            {request.sessionCount} {pluralize(request.sessionCount, 'session')} · requested{' '}
            {format(parseISO(request.requestedAtIso), 'd MMM yyyy, HH:mm')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-secondary/30 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Send to</p>
            <p className="mt-1 font-semibold">
              {request.provider}{' '}
              <span className="font-normal tabular-nums text-muted-foreground">
                {request.maskedNumber}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{request.accountTitle}</p>
            {/* The full number is never on this page. It comes from the audited reveal on the
                payout account — one deliberate click that records who looked. */}
            <Link
              to="/admin/payout-accounts"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              Reveal full number on the payout account <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {request.status === 'REJECTED' && request.notes && (
            <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Declined: {request.notes}</span>
            </p>
          )}

          {!settled && !declining && (
            <div className="space-y-1.5">
              <Label htmlFor="payout-reference">Transaction reference</Label>
              <Input
                id="payout-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. JC-88431290"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Required to mark it paid — it is what a missing payment gets traced by.
              </p>
            </div>
          )}

          {declining && (
            <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
              <Label htmlFor="decline-reason">Why is this being declined?</Label>
              <Textarea
                id="decline-reason"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. The payout account title does not match the verified CNIC."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                The tutor is shown this, and the claimed sessions go back to their balance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {settled ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : declining ? (
            <>
              <Button
                variant="outline"
                onClick={() => setDeclining(false)}
                disabled={decide.isPending}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={notes.trim() === '' || decide.isPending}
                onClick={() => decide.mutate('REJECTED')}
              >
                Decline request
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setDeclining(true)} disabled={decide.isPending}>
                Decline
              </Button>
              {request.status === 'REQUESTED' && (
                <Button
                  variant="outline"
                  onClick={() => decide.mutate('APPROVED')}
                  disabled={decide.isPending}
                >
                  Approve
                </Button>
              )}
              <Button
                variant="gradient"
                disabled={reference.trim() === '' || decide.isPending}
                onClick={() => decide.mutate('PAID')}
              >
                {decide.isPending ? 'Saving…' : 'Mark as paid'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
