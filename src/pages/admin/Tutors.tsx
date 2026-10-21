import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import {
  DataTable,
  Toolbar,
  PersonCell,
  AccountBadge,
  VerifyBadge,
  type Column,
} from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/common/TablePagination';
import { pageIndexFromParam, pageSizeFromParam } from '@/lib/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { toNationalDisplay } from '@/lib/phone';
import { adminService, type AdminTutorSummary } from '@/services/adminService';

export default function AdminTutors() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const status = ['active', 'pending', 'suspended'].includes(params.get('status') ?? '')
    ? params.get('status')!
    : 'all';
  const verify = ['verified', 'under_review', 'partial', 'rejected', 'not_started'].includes(
    params.get('verify') ?? '',
  )
    ? params.get('verify')!
    : 'all';
  const page = pageIndexFromParam(params.get('page'));
  const pageSize = pageSizeFromParam(params.get('size'));
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (params.has('page') && params.get('page') !== String(page + 1)) {
      if (page === 0) next.delete('page');
      else next.set('page', String(page + 1));
    }
    if (params.has('size') && params.get('size') !== String(pageSize))
      next.set('size', String(pageSize));
    if (params.has('status') && params.get('status') !== status) next.delete('status');
    if (params.has('verify') && params.get('verify') !== verify) next.delete('verify');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [params, page, pageSize, status, verify, setParams]);
  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ['admin', 'tutors', 'page', status, verify, pageSize, page],
    queryFn: ({ signal }) =>
      adminService.tutorsPage(
        {
          page,
          size: pageSize,
          status: status === 'all' ? undefined : status,
          verification: verify === 'all' ? undefined : verify,
        },
        signal,
      ),
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey;
      return key?.[3] === status && key?.[4] === verify && key?.[5] === pageSize
        ? keepPreviousData(previous)
        : undefined;
    },
  });
  // The server clamps a deleted/empty last page; reflect its canonical page in the URL.
  useEffect(() => {
    if (!data || isPlaceholderData || data.page === page) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (data.page === 0) next.delete('page');
        else next.set('page', String(data.page + 1));
        return next;
      },
      { replace: true },
    );
  }, [data, isPlaceholderData, page, setParams]);
  const changePage = (nextPage: number) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('q');
      if (nextPage === 0) next.delete('page');
      else next.set('page', String(nextPage + 1));
      return next;
    });
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (key !== 'q') {
          next.delete('page');
          next.delete('q');
        }
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const rows = useMemo(() => {
    const list = data?.items ?? [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (t) =>
        !q ||
        [
          t.name,
          t.email,
          t.city,
          t.phone,
          toNationalDisplay(t.phone),
          t.status,
          t.verification.replace(/_/g, ' '),
          `${t.stepsPassed}/${t.stepsTotal}`,
          t.createdAt?.slice(0, 10),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
    );
  }, [data, query]);

  const columns: Column<AdminTutorSummary>[] = [
    { header: 'Tutor', cell: (t) => <PersonCell name={t.name} sub={t.email} /> },
    { header: 'City', cell: (t) => t.city ?? '—' },
    { header: 'Phone', cell: (t) => toNationalDisplay(t.phone) || '—' },
    { header: 'Verification', cell: (t) => <VerifyBadge status={t.verification} /> },
    { header: 'Steps', align: 'center', cell: (t) => `${t.stepsPassed}/${t.stepsTotal}` },
    { header: 'Status', cell: (t) => <AccountBadge status={t.status} /> },
    { header: 'Joined', cell: (t) => (t.createdAt ? t.createdAt.slice(0, 10) : '—') },
    {
      header: '',
      align: 'right',
      cell: (t) => (
        <Button size="sm" variant="outline" asChild>
          <Link
            to={`/admin/tutors/${t.id}`}
            state={{ from: '/admin/tutors' + (params.toString() ? '?' + params.toString() : '') }}
          >
            View file
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[32rem] flex-col lg:h-[calc(100dvh-8rem)] [&>div]:shrink-0">
      <PageHeader title="Tutors" description="Every teacher on the platform — live data." />

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setFilter('q', e.target.value)}
              placeholder="Search this page…"
              aria-label="Search the currently loaded tutor records"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <>
            <Select value={verify} onValueChange={(value) => setFilter('verify', value)}>
              <SelectTrigger className="h-10 w-44">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setFilter('status', value)}>
              <SelectTrigger className="h-10 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <p className="mb-3 shrink-0 text-sm text-muted-foreground" role="status">
        {isFetching
          ? 'Loading tutors…'
          : query.trim()
            ? `${rows.length} matches in ${data?.items.length ?? 0} loaded tutors. Search applies to this page only.`
            : 'Search applies to the current page. Status and verification filters apply to all tutors.'}
      </p>

      <section
        aria-label="Tutor records"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-soft"
      >
        <div className="min-h-0 flex-1">
          {isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              Could not load tutors.{' '}
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex h-full items-start justify-center overflow-hidden p-4">
              <div className="w-full space-y-3" aria-label="Loading tutors">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div
              inert={isPlaceholderData || undefined}
              aria-busy={isFetching}
              className={`h-full min-h-0 ${isPlaceholderData ? 'opacity-50' : ''}`}
            >
              <DataTable
              key={`${status}:${verify}:${pageSize}:${data?.page ?? page}`}
                embedded
                scrollable
                columns={columns}
                rows={rows}
                getKey={(t) => String(t.id)}
                empty={
                  query.trim()
                    ? 'No matches on this page. Clear search or choose another page.'
                    : 'No tutors match the selected filters.'
                }
              />
            </div>
          )}
        </div>
        <TablePagination
          embedded
          page={data?.page ?? 0}
          pageSize={pageSize}
          total={data?.total ?? 0}
          disabled={isFetching || isError || !data}
          itemLabel="tutors"
          onPageChange={changePage}
          onPageSizeChange={(size) => setFilter('size', String(size))}
        />
      </section>
    </div>
  );
}
