import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, Check, X, Ban, Loader2 } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import {
  adminInstituteService,
  type InstituteProfile,
  type InstituteStatus,
} from '@/services/instituteService';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';

const STATUS_META: Record<
  InstituteStatus,
  { label: string; variant: 'secondary' | 'gold' | 'success' | 'destructive' }
> = {
  APPLIED: { label: 'Not submitted', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Awaiting review', variant: 'gold' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
};

const TABS: InstituteStatus[] = ['UNDER_REVIEW', 'APPLIED', 'VERIFIED', 'SUSPENDED'];

export default function AdminInstitutes() {
  const [status, setStatus] = useState<InstituteStatus>('UNDER_REVIEW');
  const [query, setQuery] = useState('');
  const [reviewing, setReviewing] = useState<InstituteProfile | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'institutes', status],
    queryFn: () => adminInstituteService.queue(status),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (i) =>
        (i.displayName ?? '').toLowerCase().includes(q) ||
        (i.legalName ?? '').toLowerCase().includes(q) ||
        (i.cityName ?? '').toLowerCase().includes(q) ||
        (i.registrationNo ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

  const columns: Column<InstituteProfile>[] = [
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
    { header: 'Signatory', cell: (i) => i.contactPerson ?? '—' },
    {
      header: 'Status',
      cell: (i) => <Badge variant={STATUS_META[i.status].variant}>{STATUS_META[i.status].label}</Badge>,
    },
    {
      header: 'Action',
      align: 'right',
      // Reviewing opens the full file — profile, documents and per-document decisions — rather
      // than a dialog of typed fields. Deciding whether an institute is real means looking at its
      // registration certificate, which a queue row cannot show. Suspending a verified institute
      // needs no documents, so that stays in the dialog.
      cell: (i) =>
        i.status === 'UNDER_REVIEW' ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={`/admin/institutes/${i.instituteId}`}>Review</Link>
          </Button>
        ) : i.status === 'VERIFIED' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/admin/institutes/${i.instituteId}`}>View file</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setReviewing(i)}>
              Manage
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/admin/institutes/${i.instituteId}`}>View file</Link>
          </Button>
        ),
    },
  ];

  if (isLoading) return <LoadingState label="Loading institutes…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} message="Could not load institutes." />;

  const awaiting = status === 'UNDER_REVIEW' ? rows.length : undefined;

  return (
    <div>
      <PageHeader
        title="Institutes"
        description="Schools and academies registering to hire through the platform."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="Building2"
          label={`${STATUS_META[status].label}`}
          value={String(rows.length)}
          accent="emerald"
        />
        <StatCard
          icon="ShieldAlert"
          label="Awaiting review"
          value={awaiting !== undefined ? String(awaiting) : '—'}
          accent="amber"
        />
        <StatCard icon="ShieldCheck" label="Queue" value={STATUS_META[status].label} accent="brand" />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, city or registration no…"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === status ? 'default' : 'outline'}
                onClick={() => setStatus(s)}
              >
                {STATUS_META[s].label}
              </Button>
            ))}
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(i) => String(i.instituteId)}
        empty={`No institutes are ${STATUS_META[status].label.toLowerCase()}.`}
      />

      <ReviewDialog institute={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}

/** Approve, send back with corrections, or withdraw access from a verified institute. */
function ReviewDialog({
  institute,
  onClose,
}: {
  institute: InstituteProfile | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const done = (message: string) => {
    toast.success(message);
    qc.invalidateQueries({ queryKey: ['admin', 'institutes'] });
    setNotes('');
    onClose();
  };
  const failed = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      adminInstituteService.decide(institute!.instituteId, approve, notes.trim() || undefined),
    onSuccess: (_d, approve) => done(approve ? 'Institute verified' : 'Sent back for corrections'),
    onError: failed,
  });

  const suspend = useMutation({
    mutationFn: () => adminInstituteService.suspend(institute!.instituteId, notes.trim()),
    onSuccess: () => done('Institute suspended'),
    onError: failed,
  });

  const busy = decide.isPending || suspend.isPending;
  const verified = institute?.status === 'VERIFIED';

  return (
    <Dialog open={!!institute} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {institute?.displayName || institute?.legalName || 'Institute'}
          </DialogTitle>
          <DialogDescription>
            {verified
              ? 'This institute is verified. Suspending withdraws its hiring access.'
              : 'Approve to grant hiring access, or send it back with what needs fixing.'}
          </DialogDescription>
        </DialogHeader>

        {institute && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-secondary/30 p-3.5 text-sm">
            <Detail label="Legal name" value={institute.legalName} />
            <Detail label="Entity" value={institute.entityType?.replace(/_/g, ' ').toLowerCase()} />
            <Detail label="Registration" value={institute.registrationNo} />
            <Detail label="Regulator" value={institute.regulator} />
            <Detail label="Signatory" value={institute.contactPerson} />
            <Detail
              label="Address"
              value={[institute.address, institute.area, institute.cityName].filter(Boolean).join(', ')}
            />
          </dl>
        )}

        <div>
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              verified
                ? 'Why is access being withdrawn? The institute sees this.'
                : 'Required when sending back — say exactly what to fix.'
            }
            className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {verified ? (
            <Button variant="destructive" disabled={busy || !notes.trim()} onClick={() => suspend.mutate()}>
              {suspend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Suspend
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={busy || !notes.trim()}
                onClick={() => decide.mutate(false)}
              >
                {decide.isPending && !decide.variables ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Send back
              </Button>
              <Button variant="gradient" disabled={busy} onClick={() => decide.mutate(true)}>
                {decide.isPending && decide.variables ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value || '—'}</dd>
    </div>
  );
}
