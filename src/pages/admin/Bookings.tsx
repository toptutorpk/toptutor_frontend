import { bookingLabel, bookingMoney } from '@/lib/adminBookings';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, type Column } from '@/components/admin/AdminKit';
import { TablePagination } from '@/components/common/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingMode, BookingPartyLink, BookingState } from '@/components/admin/BookingDisplay';
import { adminBookingService, type AdminBooking } from '@/services/adminBookingService';
import { pageIndexFromParam, pageSizeFromParam } from '@/lib/pagination';

const STATUS = ['UPCOMING', 'PAST', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const PAYMENT = ['NONE', 'PENDING', 'PAID', 'FAILED'];
const MODES = ['ONLINE', 'HOME', 'DEMO'];

export default function AdminBookings() {
  const { accountId: accountParam } = useParams();
  const scoped = accountParam !== undefined;
  const accountId = scoped ? Number(accountParam) : undefined;
  const validAccount =
    !scoped || (/^[1-9]\d*$/.test(accountParam!) && Number.isSafeInteger(accountId));
  const location = useLocation();
  const origin = (location.state as { from?: unknown } | null)?.from;
  const backTo =
    typeof origin === 'string' &&
    /^\/admin\/(?:bookings(?:\/accounts\/[1-9]\d*)?|tutors\/[1-9]\d*|students\/[1-9]\d*)(?:\?|$)/.test(
      origin,
    )
      ? origin
      : '/admin/bookings';
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').slice(0, 200);
  const [search, setSearch] = useState(query.trim());
  const status = STATUS.includes(params.get('status') ?? '') ? params.get('status')! : 'all';
  const payment = PAYMENT.includes(params.get('payment') ?? '') ? params.get('payment')! : 'all';
  const mode = MODES.includes(params.get('mode') ?? '') ? params.get('mode')! : 'all';
  useEffect(() => {
    if (!params.has('from') && !params.has('to')) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('from');
        next.delete('to');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [params, setParams]);
  const page = pageIndexFromParam(params.get('page'));
  const size = pageSizeFromParam(params.get('size'));
  const debouncing = query.trim() !== search;
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const scope = accountId ?? 'all';
  const account = useQuery({
    queryKey: ['admin', 'bookings', 'account', accountId],
    queryFn: () => adminBookingService.account(accountId!),
    enabled: scoped && validAccount,
  });
  const stats = useQuery({
    queryKey: ['admin', 'bookings', 'stats', scope],
    queryFn: () => adminBookingService.stats(accountId),
    enabled: validAccount,
  });
  const signature = JSON.stringify([scope, status, payment, mode, search, size]);
  const list = useQuery({
    queryKey: ['admin', 'bookings', 'page', signature, page],
    queryFn: ({ signal }) =>
      adminBookingService.list(
        {
          accountId,
          page,
          size,
          status: status === 'all' ? undefined : status,
          payment: payment === 'all' ? undefined : payment,
          mode: mode === 'all' ? undefined : mode,
          search: search || undefined,
        },
        signal,
      ),
    enabled: validAccount && !debouncing,
    placeholderData: (old, previous) =>
      previous?.queryKey[3] === signature ? keepPreviousData(old) : undefined,
  });
  useEffect(() => {
    if (!list.data || list.isPlaceholderData || debouncing || list.data.page === page) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (list.data.page) next.set('page', String(list.data.page + 1));
        else next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [list.data, list.isPlaceholderData, debouncing, page, setParams]);
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
  const currentUrl = location.pathname + location.search;
  const columns: Column<AdminBooking>[] = [
    {
      header: 'Booking',
      cell: (b) => <span className="font-mono text-sm">#{b.id}</span>,
    },
    ...(!scoped || account.data?.role !== 'TUTOR'
      ? [
          {
            header: 'Tutor',
            cell: (b: AdminBooking) => (
              <BookingPartyLink party={b.tutor} from={currentUrl} showRole={false} />
            ),
          },
        ]
      : []),
    ...(!scoped || account.data?.role === 'TUTOR'
      ? [
          {
            header: 'Student / Parent',
            cell: (b: AdminBooking) => (
              <BookingPartyLink party={b.learner} from={currentUrl} showRole={false} />
            ),
          },
        ]
      : []),
    {
      header: 'Mode',
      cell: (b) => <BookingMode mode={b.mode} />,
    },
    {
      header: 'Session (PKT)',
      cell: (b) => (
        <div className="whitespace-nowrap">
          {b.sessionDate || 'Not scheduled'}
          <p className="text-xs text-muted-foreground">
            {b.startTime && b.endTime ? `${b.startTime}–${b.endTime}` : 'Time unavailable'}
          </p>
        </div>
      ),
    },
    {
      header: 'Total charged',
      align: 'right',
      cell: (b) =>
        b.bookingType === 'INTRO' && b.totalAmount == null
          ? 'Free'
          : bookingMoney(b.totalAmount, b.currency),
    },
    {
      header: 'Booking status',
      cell: (b) => <BookingState value={b.status} />,
    },
    { header: 'Payment status', cell: (b) => <BookingState value={b.paymentStatus} /> },
    {
      header: 'Action',
      align: 'right',
      cell: (b) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/admin/bookings/${b.id}`} state={{ from: currentUrl }}>
            View details
          </Link>
        </Button>
      ),
    },
  ];
  const loading = list.isFetching || debouncing;
  if (!validAccount)
    return (
      <div className="rounded-2xl border bg-card p-6">
        Invalid account.{' '}
        <Link className="text-primary underline" to="/admin/bookings">
          Back to bookings
        </Link>
      </div>
    );
  return (
    <div className="flex flex-col lg:h-[calc(100dvh-8rem)] lg:min-h-[42rem] [&>div]:shrink-0">
      <PageHeader
        title={scoped ? 'Account booking history' : 'Bookings'}
        description={
          scoped
            ? account.data
              ? `${account.data.name} · ${bookingLabel(account.data.role)} · ${account.data.email || account.data.phone || 'Contact unavailable'}`
              : account.isError
                ? 'Account unavailable.'
                : 'Loading account details…'
            : 'Find sessions and investigate booking histories across the platform.'
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {stats.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              icon="CalendarDays"
              label="Total bookings"
              value={stats.data?.total.toLocaleString() ?? 'Unavailable'}
              accent="brand"
            />
            <StatCard
              icon="CalendarCheck"
              label="Upcoming sessions"
              value={stats.data?.upcoming.toLocaleString() ?? 'Unavailable'}
              accent="amber"
            />
            <StatCard
              icon="Wallet"
              label={account.data?.role === 'TUTOR' ? 'Net earnings (PKR)' : 'Total paid (PKR)'}
              value={
                stats.data
                  ? bookingMoney(
                      account.data?.role === 'TUTOR' ? stats.data.tutorNet : stats.data.totalPaid,
                    )
                  : 'Unavailable'
              }
              accent="emerald"
            />
          </>
        )}
      </div>
      {stats.data && (
        <p className="mb-4 text-xs text-muted-foreground">
          {stats.data.past} past sessions · {stats.data.cancelled} cancelled ·{' '}
          {bookingMoney(stats.data.refunded)} refunded
          {account.data?.role === 'TUTOR' ? ' · Net earnings include amounts still clearing.' : ''}
        </p>
      )}
      {(stats.isError || account.isError) && (
        <div className="mb-3 text-sm text-destructive" role="alert">
          Could not load {account.isError ? 'this account' : 'booking totals'}.{' '}
          <button
            className="underline"
            onClick={() => {
              void stats.refetch();
              if (scoped) void account.refetch();
            }}
          >
            Retry
          </button>
        </div>
      )}
      <Toolbar
        left={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              maxLength={200}
              value={query}
              onChange={(e) => change('q', e.target.value)}
              placeholder="Booking ID, name, email or phone…"
              aria-label="Search all matching bookings"
            />
          </div>
        }
        right={
          <>
            <Filter
              value={status}
              label="Booking status"
              all="All booking statuses"
              values={STATUS}
              onChange={(v) => change('status', v)}
            />
            <Filter
              value={payment}
              label="Payment status"
              all="All payments"
              values={PAYMENT}
              onChange={(v) => change('payment', v)}
            />
            <Filter
              value={mode}
              label="Session mode"
              all="All modes"
              values={MODES}
              onChange={(v) => change('mode', v)}
            />
          </>
        }
      />
      {scoped && (
        <div className="mb-3">
          <Button variant="outline" size="sm" asChild>
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      )}
      <section
        aria-label="Booking records"
        className="flex h-[65dvh] min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-soft lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <div className="min-h-0 flex-1">
          {list.isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
              Could not load bookings.
              <Button variant="outline" onClick={() => void list.refetch()}>
                Retry
              </Button>
            </div>
          ) : list.isPending || debouncing ? (
            <div className="space-y-3 p-4" aria-label="Loading bookings">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div
              className={`h-full min-h-0 ${list.isPlaceholderData ? 'opacity-50' : ''}`}
              inert={list.isPlaceholderData || undefined}
              aria-busy={list.isFetching}
            >
              <DataTable
                key={`${signature}:${list.data.page}`}
                embedded
                scrollable
                columns={columns}
                rows={list.data.items}
                getKey={(b) => String(b.id)}
                empty="No bookings match these filters."
              />
            </div>
          )}
        </div>
        <TablePagination
          embedded
          page={list.data?.page ?? 0}
          pageSize={size}
          total={list.data?.total ?? 0}
          disabled={loading || list.isError || !list.data}
          itemLabel="bookings"
          onPageChange={(p) => change('page', String(p + 1))}
          onPageSizeChange={(s) => change('size', String(s))}
        />
      </section>
    </div>
  );
}
function Filter({
  value,
  label,
  all,
  values,
  onChange,
}: {
  value: string;
  label: string;
  all: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {values.map((v) => (
          <SelectItem key={v} value={v}>
            {bookingLabel(v)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
