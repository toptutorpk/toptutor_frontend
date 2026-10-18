import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Ban, Building2, Check, Loader2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Panel, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { formatPKR } from '@/lib/utils';
import {
  adminFinanceService,
  type AdminInvoice,
  type InvoiceKind,
  type InvoiceStatus,
} from '@/services/instituteService';

const OVERVIEW_KEY = ['admin', 'institute-billing'] as const;
const ANY = 'ANY';

const KIND_LABEL: Record<InvoiceKind, string> = {
  PLAN: 'Subscription',
  PLACEMENT: 'Placement fee',
};

const PLACEMENT_LABEL: Record<string, string> = {
  PENDING_START: 'Awaiting start',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
};

/**
 * The money side of institute hiring, and the only place a charge can be settled.
 *
 * <p>Institute invoices are paid off-platform — a school pays the plan fee or a placement fee by
 * transfer, not through the learner checkout — so nothing in the automated flow can ever mark one
 * paid. Without this screen an invoice raised was an invoice due forever, and "outstanding" was a
 * number that only ever went up.
 */
export default function AdminInstituteBilling() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<InvoiceStatus | typeof ANY>('DUE');
  const [kind, setKind] = useState<InvoiceKind | typeof ANY>(ANY);

  const { data: overview, isLoading } = useQuery({
    queryKey: OVERVIEW_KEY,
    queryFn: adminFinanceService.overview,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: [...OVERVIEW_KEY, 'invoices', status, kind],
    queryFn: () =>
      adminFinanceService.invoices({
        status: status === ANY ? undefined : status,
        kind: kind === ANY ? undefined : kind,
      }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: OVERVIEW_KEY });

  const pay = useMutation({
    mutationFn: (id: number) => adminFinanceService.markPaid(id),
    onSuccess: (inv) => {
      refresh();
      toast.success('Payment recorded', {
        description: `${formatPKR(inv.amount)} from ${inv.instituteName}.`,
      });
    },
    onError: () => toast.error('Could not record that payment.'),
  });

  const writeOff = useMutation({
    mutationFn: (id: number) => adminFinanceService.voidInvoice(id),
    onSuccess: (inv) => {
      refresh();
      toast.success('Invoice written off', { description: inv.description });
    },
    onError: () => toast.error('Could not write that invoice off.'),
  });

  const busy = (id: number) =>
    (pay.isPending && pay.variables === id) || (writeOff.isPending && writeOff.variables === id);

  const columns: Column<AdminInvoice>[] = [
    {
      header: 'Institute',
      cell: (inv) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{inv.instituteName}</p>
          <p className="truncate text-xs text-muted-foreground">{inv.description}</p>
        </div>
      ),
    },
    {
      header: 'Kind',
      cell: (inv) => (
        <Badge variant={inv.kind === 'PLACEMENT' ? 'default' : 'secondary'}>
          {KIND_LABEL[inv.kind]}
        </Badge>
      ),
    },
    {
      header: 'Amount',
      align: 'right',
      cell: (inv) => (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatPKR(inv.amount)}
        </span>
      ),
    },
    {
      header: 'Issued',
      cell: (inv) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {format(parseISO(inv.issuedOn), 'd MMM yyyy')}
        </span>
      ),
    },
    {
      header: 'Due',
      cell: (inv) =>
        inv.dueOn ? (
          <span
            className={
              inv.overdue
                ? 'whitespace-nowrap text-xs font-medium tabular-nums text-rose-600 dark:text-rose-400'
                : 'whitespace-nowrap text-xs tabular-nums text-muted-foreground'
            }
          >
            {format(parseISO(inv.dueOn), 'd MMM yyyy')}
            {inv.overdue && ' · overdue'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { header: 'Status', cell: (inv) => <StatusBadge invoice={inv} /> },
    {
      header: '',
      align: 'right',
      cell: (inv) =>
        inv.status === 'DUE' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" disabled={busy(inv.id)} onClick={() => pay.mutate(inv.id)}>
              {busy(inv.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark paid
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy(inv.id)}
              onClick={() => writeOff.mutate(inv.id)}
            >
              <Ban className="h-4 w-4" /> Write off
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institute billing"
        description="Subscriptions and placement fees across every institute. Schools pay by transfer, so a payment only counts once it is recorded here."
      />

      {isLoading || !overview ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="Wallet"
              label="Collected"
              value={formatPKR(overview.collected, { compact: true })}
              accent="emerald"
            />
            <StatCard
              icon="Clock"
              label="Outstanding"
              value={formatPKR(overview.outstanding, { compact: true })}
              accent="amber"
            />
            <StatCard
              icon="AlertTriangle"
              label={`Overdue · ${overview.overdueCount}`}
              value={formatPKR(overview.overdue, { compact: true })}
              accent="rose"
            />
            <StatCard
              icon="Handshake"
              label="Placement fees collected"
              value={formatPKR(overview.placementRevenue, { compact: true })}
              accent="brand"
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Panel title="Plan mix" subtitle="Where institutes sit today">
              <ul className="divide-y">
                {overview.tiers.map((t) => (
                  <li key={t.tier} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> {t.label}
                    </span>
                    <span className="text-sm tabular-nums">
                      <span className="font-semibold">{t.active}</span>
                      <span className="text-muted-foreground"> active</span>
                      {t.cancelled > 0 && (
                        <span className="text-muted-foreground"> · {t.cancelled} cancelled</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Placements" subtitle="What the placement fees are levied on">
              {overview.placements.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  No placements yet. A fee is only raised once both sides confirm the teacher
                  started.
                </p>
              ) : (
                <ul className="divide-y">
                  {overview.placements.map((p) => (
                    <li key={p.status} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="font-medium">{PLACEMENT_LABEL[p.status] ?? p.status}</span>
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold">{p.count}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {formatPKR(p.feeTotal, { compact: true })} in fees
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      <Toolbar
        left={
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{invoices.length}</span>{' '}
            {invoices.length === 1 ? 'invoice' : 'invoices'}
          </p>
        }
        right={
          <>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | typeof ANY)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUE">Due</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOID">Written off</SelectItem>
                <SelectItem value={ANY}>Any status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={(v) => setKind(v as InvoiceKind | typeof ANY)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Both kinds</SelectItem>
                <SelectItem value="PLAN">Subscriptions</SelectItem>
                <SelectItem value="PLACEMENT">Placement fees</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {loadingInvoices ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          rows={invoices}
          getKey={(inv) => String(inv.id)}
          empty="Nothing here — no invoices match these filters."
        />
      )}
    </div>
  );
}

function StatusBadge({ invoice }: { invoice: AdminInvoice }) {
  if (invoice.status === 'PAID') {
    return (
      <Badge variant="success">
        <Check className="h-3 w-3" /> Paid
      </Badge>
    );
  }
  if (invoice.status === 'VOID') {
    return (
      <Badge variant="secondary">
        <Ban className="h-3 w-3" /> Written off
      </Badge>
    );
  }
  return invoice.overdue ? (
    <Badge variant="destructive">
      <AlertTriangle className="h-3 w-3" /> Overdue
    </Badge>
  ) : (
    <Badge variant="warning">Due</Badge>
  );
}
