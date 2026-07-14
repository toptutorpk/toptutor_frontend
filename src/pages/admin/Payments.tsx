import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { Panel, DataTable, Toolbar, type Column } from '@/components/admin/AdminKit';
import { AreaChart } from '@/components/admin/charts';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/utils';
import { ADMIN_PAYMENTS, MONTHS, REVENUE_SERIES, type AdminPayment } from '@/services/mock/admin';

const STATUS_VARIANT: Record<AdminPayment['status'], 'success' | 'warning' | 'secondary'> = {
  completed: 'success',
  pending: 'warning',
  refunded: 'secondary',
};

const METHOD_COLOR: Record<AdminPayment['method'], string> = {
  JazzCash: '#ED1C24',
  Easypaisa: '#00A651',
  Card: '#1A1F71',
};

export default function AdminPayments() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_PAYMENTS.filter((p) => !q || p.party.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [query]);

  const columns: Column<AdminPayment>[] = [
    { header: 'Txn', cell: (p) => <span className="font-mono text-xs text-muted-foreground">#{p.id.slice(2)}</span> },
    { header: 'Party', cell: (p) => p.party },
    { header: 'Type', cell: (p) => <Badge variant="secondary" className="font-normal">{p.type}</Badge> },
    {
      header: 'Method',
      cell: (p) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: METHOD_COLOR[p.method] }} />
          {p.method}
        </span>
      ),
    },
    { header: 'Amount', align: 'right', cell: (p) => formatPKR(p.amount) },
    { header: 'Date', cell: (p) => p.date },
    { header: 'Status', cell: (p) => <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="Transactions, payouts and platform revenue." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon="Wallet" label="Revenue (this month)" value="PKR 1.76M" delta="+18%" accent="emerald" />
        <StatCard icon="TrendingUp" label="Revenue (YTD)" value="PKR 10.8M" delta="+22%" accent="brand" />
        <StatCard icon="ArrowDownToLine" label="Payouts released" value="PKR 4.2M" accent="violet" />
        <StatCard icon="RotateCcw" label="Refunds" value="PKR 86k" delta="-3%" trend="down" accent="amber" />
      </div>

      <Panel title="Revenue trend" subtitle="PKR thousands · last 12 months" className="mb-6">
        <div className="p-5">
          <AreaChart
            labels={MONTHS}
            series={[{ label: 'Revenue', color: '#10b981', data: REVENUE_SERIES }]}
            format={(v) => `${v}k`}
          />
        </div>
      </Panel>

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions…"
              className="h-10 pl-9"
            />
          </div>
        }
      />

      <DataTable columns={columns} rows={rows} getKey={(p) => p.id} empty="No transactions match your search." />
    </div>
  );
}
