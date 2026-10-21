import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, Building2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, type Column } from '@/components/admin/AdminKit';
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
import {
  adminInstituteDirectoryService,
  type AdminInstituteRow,
} from '@/services/adminInstituteDirectoryService';
import type { InstituteStatus } from '@/services/instituteService';
const PLAN_LABELS = { LISTED: 'Listed (free)', GROWTH: 'Growth', INSTITUTION: 'Institution' };
const money = (value: number) =>
  'PKR ' + value.toLocaleString('en-PK', { maximumFractionDigits: 2 });
const STATUS_META: Record<
  InstituteStatus,
  { label: string; variant: 'secondary' | 'gold' | 'success' | 'destructive' }
> = {
  APPLIED: { label: 'Not submitted', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Awaiting review', variant: 'gold' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
};

export default function AdminInstitutes() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').slice(0, 200);
  const [search, setSearch] = useState(query.trim());
  const status = ['APPLIED', 'UNDER_REVIEW', 'VERIFIED', 'SUSPENDED'].includes(
    params.get('status') ?? '',
  )
    ? params.get('status')!
    : 'all';
  const plan = ['LISTED', 'GROWTH', 'INSTITUTION', 'UNCONFIGURED'].includes(
    params.get('plan') ?? '',
  )
    ? params.get('plan')!
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
    if (params.has('plan') && params.get('plan') !== plan) next.delete('plan');
    if ((params.get('q') ?? '').length > 200) next.set('q', query);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [params, page, size, status, plan, query, setParams]);
  const stats = useQuery({
    queryKey: ['admin', 'institutes', 'stats'],
    queryFn: adminInstituteDirectoryService.stats,
  });
  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ['admin', 'institutes', 'page', status, search, size, plan, page],
    queryFn: ({ signal }) =>
      adminInstituteDirectoryService.list(
        {
          page,
          size,
          status: status === 'all' ? undefined : status,
          plan: plan === 'all' ? undefined : plan,
          search: search || undefined,
        },
        signal,
      ),
    enabled: !debouncing,
    placeholderData: (old, previous) => {
      const key = previous?.queryKey;
      return key?.[3] === status && key?.[4] === search && key?.[5] === size && key?.[6] === plan
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
  const columns: Column<AdminInstituteRow>[] = [
    {
      header: 'Institute',
      cell: (i) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium">
              {i.displayName || i.legalName || `Institute #${i.instituteId}`}
            </div>
            {i.legalName && i.displayName && i.legalName !== i.displayName && (
              <div className="truncate text-xs text-muted-foreground">{i.legalName}</div>
            )}
          </div>
        </div>
      ),
    },
    { header: 'City', cell: (i) => i.cityName ?? '—' },
    { header: 'Entity', cell: (i) => i.entityType?.replace(/_/g, ' ').toLowerCase() ?? '—' },
    { header: 'Registration', cell: (i) => i.registrationNo ?? '—' },
    {
      header: 'Plan',
      cell: (i) => (
        <div>
          <Badge variant="secondary">
            {i.planTier ? PLAN_LABELS[i.planTier] : 'Not configured'}
          </Badge>
          {i.subscriptionStatus === 'CANCELLED' && (
            <div className="mt-1 text-xs text-muted-foreground">Cancelled</div>
          )}
        </div>
      ),
    },
    { header: 'Subscription spend', align: 'right', cell: (i) => money(i.subscriptionSpend) },
    {
      header: 'Status',
      cell: (i) => (
        <Badge variant={STATUS_META[i.status].variant}>{STATUS_META[i.status].label}</Badge>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      // Review and account actions live inside the full institute file.
      cell: (i) =>
        i.status === 'UNDER_REVIEW' ? (
          <Button size="sm" variant="outline" asChild>
            <Link
              to={`/admin/institutes/${i.instituteId}`}
              state={{ from: `/admin/institutes?${params.toString()}` }}
            >
              Review
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link
              to={`/admin/institutes/${i.instituteId}`}
              state={{ from: `/admin/institutes?${params.toString()}` }}
            >
              View file
            </Link>
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-8rem)] lg:min-h-[38rem] [&>div]:shrink-0">
      <PageHeader
        title="Institutes"
        description="Schools and academies registered on the platform."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {stats.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              icon="Building2"
              label="Total Institutes"
              value={stats.data?.totalInstitutes.toLocaleString() ?? 'Unavailable'}
              accent="violet"
            />
            <StatCard
              icon="ShieldAlert"
              label="Awaiting Review"
              value={stats.data?.awaitingReview.toLocaleString() ?? 'Unavailable'}
              accent="amber"
            />
            <StatCard
              icon="Wallet"
              label="Subscription Spend"
              value={stats.data ? money(stats.data.subscriptionSpend) : 'Unavailable'}
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
              placeholder="Search all institutes…"
              aria-label="Search all institutes"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <>
            <Select value={status} onValueChange={(value) => change('status', value)}>
              <SelectTrigger className="h-10 w-36" aria-label="Institute verification status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={(value) => change('plan', value)}>
              <SelectTrigger className="h-10 w-44" aria-label="Subscription plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {Object.entries(PLAN_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value="UNCONFIGURED">Not configured</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />
      <p className="mb-3 shrink-0 text-xs text-muted-foreground" role="status">
        {loading
          ? 'Searching institutes…'
          : `Search covers all institutes. ${stats.data ? `${stats.data.paidSubscribers.toLocaleString()} active paid-plan subscribers. ` : ''}Spend includes paid plan invoices in PKR.`}
      </p>
      <section
        aria-label="Institute records"
        className="flex h-[65dvh] min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <div className="min-h-0 flex-1">
          {isError && !debouncing ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
              Could not load institutes.
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : isPending || debouncing ? (
            <div className="space-y-3 p-4" aria-label="Loading institutes">
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
                key={`${status}:${plan}:${search}:${size}:${data?.page ?? page}`}
                embedded
                scrollable
                columns={columns}
                rows={data?.items ?? []}
                getKey={(s) => String(s.instituteId)}
                empty={
                  search
                    ? 'No institutes match this search and filters.'
                    : 'No institutes match these filters.'
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
          itemLabel="institutes"
          onPageChange={(p) => change('page', String(p + 1))}
          onPageSizeChange={(s) => change('size', String(s))}
        />
      </section>
    </div>
  );
}
