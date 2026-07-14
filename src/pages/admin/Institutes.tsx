import { useMemo, useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, AccountBadge, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ADMIN_INSTITUTES, type AdminInstitute } from '@/services/mock/admin';

const PLAN_VARIANT: Record<AdminInstitute['plan'], 'secondary' | 'info' | 'gold'> = {
  Basic: 'secondary',
  Pro: 'info',
  Enterprise: 'gold',
};

export default function AdminInstitutes() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_INSTITUTES.filter((i) => !q || i.name.toLowerCase().includes(q) || i.city.toLowerCase().includes(q));
  }, [query]);

  const hires = ADMIN_INSTITUTES.reduce((a, i) => a + i.teachersHired, 0);
  const enterprise = ADMIN_INSTITUTES.filter((i) => i.plan === 'Enterprise').length;

  const columns: Column<AdminInstitute>[] = [
    {
      header: 'Institute',
      cell: (i) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-medium">{i.name}</span>
        </div>
      ),
    },
    { header: 'City', cell: (i) => i.city },
    { header: 'Jobs posted', align: 'right', cell: (i) => i.jobsPosted },
    { header: 'Teachers hired', align: 'right', cell: (i) => i.teachersHired },
    { header: 'Plan', cell: (i) => <Badge variant={PLAN_VARIANT[i.plan]}>{i.plan}</Badge> },
    { header: 'Status', cell: (i) => <AccountBadge status={i.status} /> },
    { header: 'Joined', cell: (i) => i.joined },
  ];

  return (
    <div>
      <PageHeader title="Institutes" description="Schools and academies hiring through the platform." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon="Building2" label="Registered institutes" value={String(ADMIN_INSTITUTES.length)} accent="emerald" />
        <StatCard icon="UserCheck" label="Teachers hired" value={String(hires)} accent="brand" />
        <StatCard icon="Crown" label="Enterprise plans" value={String(enterprise)} accent="amber" />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search institutes…"
              className="h-10 pl-9"
            />
          </div>
        }
      />

      <DataTable columns={columns} rows={rows} getKey={(i) => i.id} empty="No institutes match your search." />
    </div>
  );
}
