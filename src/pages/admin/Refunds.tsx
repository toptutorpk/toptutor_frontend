import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  Hourglass,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { BankLogo } from '@/components/common/BankLogo';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, PersonCell, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { cn, formatPKR } from '@/lib/utils';
import {
  adminRefundService,
  formatRate,
  REFUND_METHOD_LABEL,
  type AdminRefund,
} from '@/services/refundService';

const KEY = ['admin', 'refunds'] as const;

/**
 * Refunds owed to learners who cancelled a paid session.
 *
 * <p>The queue is worked by hand: an admin reveals the destination account (recorded against them),
 * sends the money from the business wallet or bank, then marks the refund sent with the transfer's
 * reference — which is what emails the learner and shows it as refunded on their dashboard.
 */
export default function AdminRefunds() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: adminRefundService.list });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [selected, setSelected] = useState<AdminRefund | null>(null);

  const refunds = useMemo(() => data ?? [], [data]);
  const now = Date.now();
  const isOverdue = (r: AdminRefund) =>
    r.status === 'PENDING' && !!r.dueBy && parseISO(r.dueBy).getTime() < now;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return refunds.filter((r) => {
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'OVERDUE'
          ? r.status === 'PENDING' && !!r.dueBy && parseISO(r.dueBy).getTime() < Date.now()
          : r.status === filter);
      const matchesQuery =
        !q ||
        r.learnerName.toLowerCase().includes(q) ||
        (r.learnerEmail ?? '').toLowerCase().includes(q) ||
        r.tutorName.toLowerCase().includes(q) ||
        (r.accountTitle ?? '').toLowerCase().includes(q) ||
        String(r.bookingId).includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [refunds, filter, query]);

  const pending = refunds.filter((r) => r.status === 'PENDING');
  const pendingTotal = pending.reduce((sum, r) => sum + Number(r.refundAmount), 0);
  const overdue = pending.filter(isOverdue).length;
  const refundedCount = refunds.filter((r) => r.status === 'REFUNDED').length;

  const columns: Column<AdminRefund>[] = [
    {
      header: 'Learner',
      cell: (r) => <PersonCell name={r.learnerName} sub={r.learnerEmail ?? r.learnerPhone ?? ''} />,
    },
    {
      header: 'Session',
      cell: (r) => (
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium">
            {r.tutorName}
            {r.cancelledBy === 'TUTOR' && (
              <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                Tutor cancelled
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {r.sessionDate ? format(parseISO(r.sessionDate), 'd MMM yyyy') : '—'}
            {r.startTime && ` · ${r.startTime}–${r.endTime}`} · #{r.bookingId}
          </p>
        </div>
      ),
    },
    {
      header: 'Refund',
      cell: (r) => (
        <div className="whitespace-nowrap text-sm">
          <p className="font-display font-bold tabular-nums">{formatPKR(Number(r.refundAmount))}</p>
          <p className="text-xs text-muted-foreground">
            of {formatPKR(Number(r.amountPaid))} · fee {formatPKR(Number(r.feeAmount))}
          </p>
        </div>
      ),
    },
    { header: 'Send to', cell: (r) => <Destination refund={r} /> },
    {
      header: 'Requested',
      cell: (r) => (
        <div className="whitespace-nowrap text-xs text-muted-foreground">
          <p>{formatDistanceToNow(parseISO(r.requestedAt), { addSuffix: true })}</p>
          {r.status === 'PENDING' && r.dueBy && (
            <p className={cn(isOverdue(r) && 'font-semibold text-red-600 dark:text-red-400')}>
              {isOverdue(r) ? 'Overdue — was due ' : 'Due '}
              {format(parseISO(r.dueBy), 'd MMM, h:mm a')}
            </p>
          )}
        </div>
      ),
    },
    { header: 'Status', cell: (r) => <StatusBadge refund={r} overdue={isOverdue(r)} /> },
    {
      header: '',
      align: 'right',
      cell: (r) => (
        <Button
          variant={r.status === 'PENDING' ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setSelected(r)}
        >
          <Eye className="h-4 w-4" /> {r.status === 'PENDING' ? 'Process' : 'View'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Paid sessions cancelled by the learner or the tutor. Send each refund by hand, then mark it sent with the transfer reference."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          icon="Clock"
          label="Waiting to be sent"
          value={String(pending.length)}
          accent="amber"
        />
        <StatCard
          icon="Wallet"
          label="Owed to learners"
          value={formatPKR(pendingTotal)}
          accent="brand"
        />
        <StatCard
          icon="AlertTriangle"
          label="Past the 24-hour promise"
          value={String(overdue)}
          accent="rose"
        />
        <StatCard
          icon="ShieldCheck"
          label="Refunded"
          value={String(refundedCount)}
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
              placeholder="Search learner, tutor, account title or booking #…"
              className="pl-9"
            />
          </div>
        }
        right={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Waiting to be sent</SelectItem>
              <SelectItem value="AWAITING_DETAILS">Awaiting learner details</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
              <SelectItem value="ALL">All refunds</SelectItem>
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
          getKey={(r) => String(r.id)}
          empty={
            filter === 'PENDING'
              ? 'No refunds waiting — you’re all caught up.'
              : 'No refunds match.'
          }
        />
      )}

      {selected && <RefundDialog refundId={selected.id} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Destination({ refund }: { refund: AdminRefund }) {
  if (!refund.provider) {
    // A tutor cancelled; the learner hasn't said where the money should go yet.
    return <span className="text-xs text-muted-foreground">Waiting for the learner’s details</span>;
  }
  return (
    <div className="flex items-center gap-2.5">
      <BankLogo name={refund.provider} size="sm" className="h-8 w-8" />
      <div className="min-w-0">
        <p className="truncate font-medium">
          {refund.provider}{' '}
          <span className="tabular-nums text-muted-foreground">{refund.accountMasked}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{refund.accountTitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ refund, overdue }: { refund: AdminRefund; overdue: boolean }) {
  if (refund.status === 'REFUNDED') {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Refunded
      </Badge>
    );
  }
  if (refund.status === 'AWAITING_DETAILS') {
    return (
      <Badge variant="secondary">
        <Hourglass className="h-3 w-3" /> Awaiting details
      </Badge>
    );
  }
  return overdue ? (
    <Badge variant="destructive">
      <AlertTriangle className="h-3 w-3" /> Overdue
    </Badge>
  ) : (
    <Badge variant="warning">
      <Hourglass className="h-3 w-3" /> Pending
    </Badge>
  );
}

/** One refund: everything needed to send it, the audited reveal, and "mark as sent". */
function RefundDialog({ refundId, onClose }: { refundId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: refund, isLoading } = useQuery({
    queryKey: [...KEY, refundId],
    queryFn: () => adminRefundService.get(refundId),
  });
  const [revealed, setRevealed] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const reveal = useMutation({
    mutationFn: () => adminRefundService.reveal(refundId),
    onSuccess: setRevealed,
    onError: (e) => toast.error('Could not reveal the number', { description: message(e) }),
  });

  const complete = useMutation({
    mutationFn: () => adminRefundService.complete(refundId, reference.trim(), note.trim()),
    onSuccess: (updated) => {
      qc.setQueryData([...KEY, refundId], updated);
      void qc.invalidateQueries({ queryKey: KEY });
      setRevealed(null);
      toast.success('Refund marked as sent', { description: 'The learner has been emailed.' });
    },
    onError: (e) => {
      toast.error('Could not mark it as sent', { description: message(e) });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });

  const pending = refund?.status === 'PENDING';
  const referenceValid = reference.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(next) => !next && !complete.isPending && onClose()}>
      <DialogContent className="no-scrollbar max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund #{refundId}</DialogTitle>
          <DialogDescription>
            {refund ? `${refund.learnerName} · booking #${refund.bookingId}` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !refund ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border bg-secondary/25 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Send
                </span>
                <StatusBadge
                  refund={refund}
                  overdue={
                    pending && !!refund.dueBy && parseISO(refund.dueBy).getTime() < Date.now()
                  }
                />
              </div>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                {formatPKR(Number(refund.refundAmount))}
              </p>
              <p className="text-xs text-muted-foreground">
                Paid {formatPKR(Number(refund.amountPaid))} − {formatRate(Number(refund.feeRate))}{' '}
                fee {formatPKR(Number(refund.feeAmount))}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {refund.method ? (
                <>
                  <Detail label="Method" value={REFUND_METHOD_LABEL[refund.method]} />
                  <Detail
                    label={refund.method === 'BANK' ? 'Bank' : 'Wallet'}
                    value={refund.provider ?? '—'}
                  />
                  <Detail label="Account title" value={refund.accountTitle ?? '—'} />
                  <Detail
                    label={refund.method === 'BANK' ? 'IBAN' : 'Number'}
                    value={refund.accountMasked ?? '—'}
                    mono
                  />
                </>
              ) : (
                <p className="col-span-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  The tutor cancelled this session. The learner has been asked where to send the
                  refund — it moves to “Waiting to be sent” once they answer.
                </p>
              )}
              <Detail label="Learner" value={refund.learnerName} />
              <Detail label="Contact" value={refund.learnerPhone || refund.learnerEmail || '—'} />
              <Detail label="Tutor" value={refund.tutorName} />
              <Detail
                label="Session"
                value={
                  refund.sessionDate
                    ? `${format(parseISO(refund.sessionDate), 'd MMM yyyy')}${refund.startTime ? `, ${refund.startTime}` : ''}`
                    : '—'
                }
              />
              <Detail
                label="Cancelled"
                value={format(parseISO(refund.requestedAt), 'd MMM yyyy, h:mm a')}
              />
              <Detail
                label={pending ? 'Due by' : 'Sent'}
                value={
                  pending
                    ? refund.dueBy
                      ? format(parseISO(refund.dueBy), 'd MMM yyyy, h:mm a')
                      : '—'
                    : refund.refundedAt
                      ? format(parseISO(refund.refundedAt), 'd MMM yyyy, h:mm a')
                      : '—'
                }
              />
            </div>

            {refund.reason && (
              <p className="rounded-xl border bg-secondary/25 p-3 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Learner’s reason
                </span>
                <br />
                {refund.reason}
              </p>
            )}

            {pending ? (
              <>
                <RevealPanel
                  revealed={revealed}
                  pending={reveal.isPending}
                  onReveal={() => reveal.mutate()}
                />
                <div className="space-y-3 rounded-xl border p-4">
                  <p className="text-sm font-semibold">After you’ve sent the money</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-ref">Transfer reference</Label>
                    <Input
                      id="refund-ref"
                      value={reference}
                      onChange={(e) => setReference(e.target.value.slice(0, 80))}
                      placeholder="e.g. TID 8812 3344 or the wallet transaction ID"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown to the learner and kept for disputes, so copy it exactly from the
                      transfer receipt.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-note">
                      Internal note{' '}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="refund-note"
                      rows={2}
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm dark:border-emerald-500/20 dark:bg-emerald-500/5">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Refund sent</p>
                <p className="mt-1 text-muted-foreground">
                  Reference <strong className="text-foreground">{refund.reference}</strong>
                  {refund.refundedBy && ` · by ${refund.refundedBy}`}
                </p>
                {refund.note && <p className="mt-1 text-muted-foreground">{refund.note}</p>}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={complete.isPending}>
            Close
          </Button>
          {pending && (
            <Button
              disabled={!referenceValid || complete.isPending}
              onClick={() => complete.mutate()}
            >
              <CheckCircle2 className="h-4 w-4" />{' '}
              {complete.isPending ? 'Saving…' : 'Mark as refunded'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The one place the full account number appears — behind a click, with a plain statement that the
 * click is recorded against the admin.
 */
function RevealPanel({
  revealed,
  pending,
  onReveal,
}: {
  revealed: string | null;
  pending: boolean;
  onReveal: () => void;
}) {
  if (revealed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Full account number
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 break-all font-mono text-base">{revealed}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(revealed);
              toast.success('Copied');
            }}
          >
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This view was recorded against your account.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary/25 p-4">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>The number is encrypted. Reveal it when you’re making the transfer.</span>
      </p>
      <Button variant="outline" size="sm" onClick={onReveal} disabled={pending}>
        <Eye className="h-4 w-4" /> {pending ? 'Revealing…' : 'Reveal number'}
      </Button>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('truncate font-medium', mono && 'font-mono tabular-nums')}>{value}</p>
    </div>
  );
}

function message(e: unknown) {
  return e instanceof Error ? e.message : 'Please try again.';
}
