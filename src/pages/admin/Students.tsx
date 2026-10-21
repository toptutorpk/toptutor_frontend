import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import {
  DataTable,
  Toolbar,
  PersonCell,
  AccountBadge,
  type Column,
} from '@/components/admin/AdminKit';
import { TablePagination } from '@/components/common/TablePagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pageIndexFromParam, pageSizeFromParam } from '@/lib/pagination';
import { adminLearnerService, type AdminLearner } from '@/services/adminLearnerService';
import { toNationalDisplay } from '@/lib/phone';

export default function AdminStudents() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').slice(0, 200);
  const [search, setSearch] = useState(query.trim());
  const status = ['active', 'pending', 'suspended'].includes(params.get('status') ?? '')
    ? params.get('status')!
    : 'all';
  const page = pageIndexFromParam(params.get('page'));
  const size = pageSizeFromParam(params.get('size'));
  const debouncing = query.trim() !== search;
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (params.has('page') && params.get('page') !== String(page + 1)) {
      if (!page) next.delete('page');
      else next.set('page', String(page + 1));
    }
    if (params.has('size') && params.get('size') !== String(size)) next.set('size', String(size));
    if (params.has('status') && params.get('status') !== status) next.delete('status');
    next.delete('plan');
    if ((params.get('q') ?? '').length > 200) next.set('q', query);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [params, page, size, status, query, setParams]);
  const stats = useQuery({
    queryKey: ['admin', 'learners', 'stats'],
    queryFn: adminLearnerService.stats,
  });
  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ['admin', 'learners', 'page', status, search, size, page],
    queryFn: ({ signal }) =>
      adminLearnerService.list(
        { page, size, status: status === 'all' ? undefined : status, search: search || undefined },
        signal,
      ),
    enabled: !debouncing,
    placeholderData: (old, previous) => {
      const key = previous?.queryKey;
      return key?.[3] === status && key?.[4] === search && key?.[5] === size
        ? keepPreviousData(old)
        : undefined;
    },
  });
  useEffect(() => {
    if (!data || debouncing || isPlaceholderData || data.page === page) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (!data.page) next.delete('page');
        else next.set('page', String(data.page + 1));
        return next;
      },
      { replace: true },
    );
  }, [data, debouncing, isPlaceholderData, page, setParams]);
  const change = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (key !== 'page') next.delete('page');
        if (!value || value === 'all' || (key === 'page' && value === '1')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: key !== 'page' },
    );
  const loading = isFetching || debouncing;
  const columns: Column<AdminLearner>[] = [
    {
      header: 'Student / Parent',
      cell: (s) => (
        <PersonCell
          name={s.name}
          sub={s.email || toNationalDisplay(s.phone) || 'No contact provided'}
          avatar={s.photoUrl}
        />
      ),
    },
    {
      header: 'Role',
      cell: (s) => <Badge variant="secondary">{s.role === 'PARENT' ? 'Parent' : 'Student'}</Badge>,
    },
    { header: 'City', cell: (s) => s.city || '—' },
    { header: 'Phone', cell: (s) => toNationalDisplay(s.phone) || '—' },
    { header: 'Confirmed bookings', align: 'center', cell: (s) => s.bookings },
    {
      header: 'Subscription spend',
      align: 'right',
      cell: () => (
        <span className="text-muted-foreground" title="Learner subscription billing is not enabled">
          —
        </span>
      ),
    },
    {
      header: 'Plan',
      cell: () => <span className="text-xs text-muted-foreground">Not enabled</span>,
    },
    { header: 'Status', cell: (s) => <AccountBadge status={s.status} /> },
    {
      header: 'Action',
      align: 'right',
      cell: (s) => (
        <Button size="sm" variant="outline" asChild>
          <Link
            to={`/admin/students/${s.id}`}
            state={{ from: `/admin/students?${params.toString()}` }}
          >
            View profile
          </Link>
        </Button>
      ),
    },
  ];
  return (
    <div className="flex flex-col lg:h-[calc(100dvh-8rem)] lg:min-h-[38rem] [&>div]:shrink-0">
      <PageHeader
        title="Students & Parents"
        description="Student and parent accounts registered on the platform."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {stats.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              icon="Users"
              label="Total Students & Parents"
              value={stats.data?.totalAccounts.toLocaleString() ?? 'Unavailable'}
              accent="violet"
            />
            <StatCard icon="Crown" label="Premium Subscribers" value="Not enabled" accent="amber" />
            <StatCard
              icon="Wallet"
              label="Subscription Spend"
              value="Not enabled"
              accent="emerald"
            />
          </>
        )}
      </div>
      {stats.isError && (
        <p className="mb-3 text-sm text-muted-foreground">
          Could not load account totals.{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => void stats.refetch()}
          >
            Retry totals
          </button>
        </p>
      )}
      <Toolbar
        left={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              maxLength={200}
              onChange={(e) => change('q', e.target.value)}
              placeholder="Search all students & parents…"
              aria-label="Search all student and parent accounts"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <>
            <Select value={status} onValueChange={(value) => change('status', value)}>
              <SelectTrigger className="h-10 w-36" aria-label="Account status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value="all" disabled>
              <SelectTrigger
                className="h-10 w-44"
                aria-label="Plan filtering not enabled"
                title="Learner subscription billing is not enabled"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Plans · not enabled</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />
      <p className="mb-3 shrink-0 text-xs text-muted-foreground" role="status">
        {loading
          ? 'Searching accounts…'
          : 'Search covers all student and parent accounts. Subscription billing is not enabled yet.'}
      </p>
      <section
        aria-label="Student and parent records"
        className="flex h-[65dvh] min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <div className="min-h-0 flex-1">
          {isError && !debouncing ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
              Could not load accounts.
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : isPending || debouncing ? (
            <div className="space-y-3 p-4" aria-label="Loading accounts">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div
              className={`h-full min-h-0 ${isPlaceholderData ? 'opacity-50' : ''}`}
              inert={isPlaceholderData || undefined}
              aria-busy={isFetching}
            >
              <DataTable
                key={`${status}:${search}:${size}:${data?.page ?? page}`}
                embedded
                scrollable
                columns={columns}
                rows={data?.items ?? []}
                getKey={(s) => String(s.id)}
                empty={
                  search
                    ? 'No student or parent accounts match this search and status.'
                    : 'No student or parent accounts match this status.'
                }
              />
            </div>
          )}
        </div>
        <TablePagination
          embedded
          page={data?.page ?? 0}
          pageSize={size}
          total={data?.total ?? 0}
          disabled={loading || isError || !data}
          itemLabel="accounts"
          onPageChange={(p) => change('page', String(p + 1))}
          onPageSizeChange={(s) => change('size', String(s))}
        />
      </section>
    </div>
  );
}
