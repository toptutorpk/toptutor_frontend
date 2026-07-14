import { useMemo, useState } from 'react';
import { Search, Video, Home, Building2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPKR } from '@/lib/utils';
import { ADMIN_BOOKINGS, type AdminBooking } from '@/services/mock/admin';

const STATUS_VARIANT: Record<AdminBooking['status'], 'success' | 'info' | 'secondary' | 'destructive'> = {
  completed: 'success',
  upcoming: 'info',
  cancelled: 'secondary',
  disputed: 'destructive',
};

const MODE = {
  online: { icon: Video, label: 'Online' },
  home_visit: { icon: Home, label: 'Home visit' },
  institute: { icon: Building2, label: 'Institute' },
};

export default function AdminBookings() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_BOOKINGS.filter(
      (b) =>
        (status === 'all' || b.status === status) &&
        (!q || b.student.toLowerCase().includes(q) || b.tutor.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q)),
    );
  }, [query, status]);

  const completed = ADMIN_BOOKINGS.filter((b) => b.status === 'completed').length;
  const disputed = ADMIN_BOOKINGS.filter((b) => b.status === 'disputed').length;
  const gmv = ADMIN_BOOKINGS.reduce((a, b) => a + b.amount, 0);

  const columns: Column<AdminBooking>[] = [
    { header: 'Booking', cell: (b) => <span className="font-mono text-xs text-muted-foreground">#{b.id.slice(2)}</span> },
    { header: 'Student', cell: (b) => b.student },
    { header: 'Tutor', cell: (b) => b.tutor },
    { header: 'Subject', cell: (b) => <Badge variant="secondary" className="font-normal">{b.subject}</Badge> },
    {
      header: 'Mode',
      cell: (b) => {
        const m = MODE[b.mode];
        const Icon = m.icon;
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" /> {m.label}
          </span>
        );
      },
    },
    { header: 'Date', cell: (b) => b.date },
    { header: 'Amount', align: 'right', cell: (b) => formatPKR(b.amount) },
    { header: 'Status', cell: (b) => <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Bookings" description="Sessions booked across the platform." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon="CalendarCheck" label="Completed sessions" value={String(completed)} accent="brand" />
        <StatCard icon="Wallet" label="Gross booking value" value={formatPKR(gmv)} accent="emerald" />
        <StatCard icon="AlertTriangle" label="Open disputes" value={String(disputed)} accent="amber" />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bookings…"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <DataTable columns={columns} rows={rows} getKey={(b) => b.id} empty="No bookings match your filters." />
    </div>
  );
}
