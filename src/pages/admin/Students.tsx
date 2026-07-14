import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, PersonCell, AccountBadge, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/utils';
import { ADMIN_STUDENTS, type AdminStudent } from '@/services/mock/admin';

export default function AdminStudents() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_STUDENTS.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q),
    );
  }, [query]);

  const premium = ADMIN_STUDENTS.filter((s) => s.plan === 'Premium').length;
  const totalSpent = ADMIN_STUDENTS.reduce((a, s) => a + s.spent, 0);

  const columns: Column<AdminStudent>[] = [
    { header: 'Student', cell: (s) => <PersonCell name={s.name} sub={s.email} avatar={s.avatar} /> },
    { header: 'City', cell: (s) => s.city },
    { header: 'Bookings', align: 'right', cell: (s) => s.bookings },
    { header: 'Total spent', align: 'right', cell: (s) => formatPKR(s.spent) },
    {
      header: 'Plan',
      cell: (s) => <Badge variant={s.plan === 'Premium' ? 'gold' : 'secondary'}>{s.plan}</Badge>,
    },
    { header: 'Status', cell: (s) => <AccountBadge status={s.status} /> },
    { header: 'Joined', cell: (s) => s.joined },
  ];

  return (
    <div>
      <PageHeader title="Students & parents" description="Everyone hiring tutors on the platform." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon="Users" label="Total students" value={ADMIN_STUDENTS.length.toLocaleString()} accent="violet" />
        <StatCard icon="Crown" label="Premium subscribers" value={String(premium)} accent="amber" />
        <StatCard icon="Wallet" label="Lifetime spend" value={formatPKR(totalSpent)} accent="emerald" />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="h-10 pl-9"
            />
          </div>
        }
      />

      <DataTable columns={columns} rows={rows} getKey={(s) => s.id} empty="No students match your search." />
    </div>
  );
}
