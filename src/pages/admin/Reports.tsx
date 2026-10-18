import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Panel, Toolbar } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import {
  adminService,
  type ReportStatus,
  type ReportSummary,
} from '@/services/adminService';

const FILTERS: { label: string; value: ReportStatus | 'ALL' }[] = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Actioned', value: 'ACTIONED' },
  { label: 'Dismissed', value: 'DISMISSED' },
  { label: 'All', value: 'ALL' },
];

const STATUS_TONE: Record<ReportStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  REVIEWED: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  ACTIONED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  DISMISSED: 'bg-secondary text-muted-foreground',
};

const reportsKey = (status: ReportStatus | 'ALL') => ['admin', 'reports', status];

/**
 * Triage for the public misconduct queue.
 *
 * <p>Opens on OPEN rather than on everything: this is a worklist, not an archive, and the first
 * thing a reviewer needs is what nobody has looked at yet. Priority rows are pulled to the top of
 * that list, because a child-safety report and a "they were rude" report are not the same queue.
 */
export default function AdminReports() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('OPEN');
  const [openId, setOpenId] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: reportsKey(filter),
    queryFn: () => adminService.reports(filter === 'ALL' ? undefined : filter),
  });

  // Urgent first, then newest. The server orders by date alone; the priority lift belongs here
  // because it is a presentation decision about how the queue is worked.
  const rows = [...data].sort((a, b) => Number(b.urgent) - Number(a.urgent));

  return (
    <div>
      <PageHeader
        title="Misconduct reports"
        description="Reports filed from the public Trust & Safety page. Every one is read by a person."
      />

      <Toolbar
        left={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  filter === f.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-muted-foreground hover:border-brand-300',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        right={
          <span className="text-sm text-muted-foreground tabular-nums">
            {rows.length} report{rows.length === 1 ? '' : 's'}
          </span>
        }
      />

      <Panel>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reports…
          </div>
        ) : rows.length === 0 ? (
          <Empty filter={filter} />
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <ReportRow key={r.id} report={r} onOpen={() => setOpenId(r.id)} />
            ))}
          </ul>
        )}
      </Panel>

      <ReportDialog
        id={openId}
        onClose={() => setOpenId(null)}
        onDecided={() => {
          qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
          setOpenId(null);
        }}
      />
    </div>
  );
}

function Empty({ filter }: { filter: ReportStatus | 'ALL' }) {
  return (
    <div className="p-12 text-center">
      <p className="font-medium">
        {filter === 'OPEN' ? 'Nothing waiting' : 'No reports here'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filter === 'OPEN'
          ? 'Every report has been picked up. New ones appear here and raise an alert.'
          : 'Try another filter.'}
      </p>
    </div>
  );
}

function ReportRow({ report, onOpen }: { report: ReportSummary; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full gap-4 p-5 text-left transition-colors hover:bg-secondary/40"
      >
        <span
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            report.urgent
              ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          <ShieldAlert className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <code className="text-sm font-bold tracking-wide">{report.reference}</code>
            <Badge variant="secondary">{readable(report.category)}</Badge>
            {report.urgent && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300">
                Priority
              </Badge>
            )}
            {report.anonymous && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                Anonymous
              </span>
            )}
          </span>

          <span className="mt-1.5 block truncate text-sm text-muted-foreground">
            {report.excerpt}
          </span>

          <span className="mt-1.5 block text-xs text-muted-foreground">
            {report.subjectName ? `About ${report.subjectName}` : 'No name given'}
            {report.channel ? ` · ${readable(report.channel)}` : ''}
            {' · '}
            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </span>
        </span>

        <StatusPill status={report.status} />
      </button>
    </li>
  );
}

function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'h-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
        STATUS_TONE[status],
      )}
    >
      {readable(status)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail + decision                                                          */
/* -------------------------------------------------------------------------- */

function ReportDialog({
  id,
  onClose,
  onDecided,
}: {
  id: number | null;
  onClose: () => void;
  onDecided: () => void;
}) {
  const [notes, setNotes] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin', 'report', id],
    queryFn: () => adminService.report(id as number),
    enabled: id !== null,
  });

  const decide = useMutation({
    mutationFn: ({ status }: { status: ReportStatus }) =>
      adminService.decideReport(id as number, status, notes.trim() || undefined),
    onSuccess: (updated) => {
      toast.success(`Report ${updated.reference} marked ${readable(updated.status).toLowerCase()}`);
      setNotes('');
      onDecided();
    },
    onError: (e) =>
      toast.error('Could not update the report', {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  return (
    <Dialog open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {isLoading || !report ? (
          <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <code className="tracking-wide">{report.reference}</code>
                <Badge variant="secondary">{readable(report.category)}</Badge>
                {report.urgent && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300">
                    Priority
                  </Badge>
                )}
                <StatusPill status={report.status} />
              </DialogTitle>
              <DialogDescription>
                Filed {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                {report.occurredOn ? ` · incident dated ${report.occurredOn}` : ''}
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-5 text-sm">
              <Block title="What happened">
                <p className="whitespace-pre-wrap leading-relaxed">{report.description}</p>
              </Block>

              <div className="grid gap-5 sm:grid-cols-2">
                <Block title="Reported">
                  <Row label="Name" value={report.subjectName} />
                  <Row label="Role" value={report.subjectRole && readable(report.subjectRole)} />
                  <Row label="Where" value={report.channel && readable(report.channel)} />
                  {report.subjectProfileUrl && (
                    <a
                      href={report.subjectProfileUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline"
                    >
                      Open profile
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </Block>

                <Block title="Reporter">
                  {report.anonymous ? (
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
                      Filed anonymously. No contact details were stored, so there is no way to ask
                      a follow-up question or send an outcome.
                    </p>
                  ) : (
                    <>
                      <Row label="Name" value={report.reporterName} />
                      <Row label="Email" value={report.reporterEmail} />
                      <Row label="Phone" value={report.reporterPhone} />
                    </>
                  )}
                </Block>
              </div>

              {report.adminNotes && (
                <Block title={`Decision${report.reviewedByName ? ` — ${report.reviewedByName}` : ''}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{report.adminNotes}</p>
                </Block>
              )}
            </section>

            <div className="mt-2 space-y-2">
              <label className="text-sm font-medium" htmlFor="report-notes">
                Reviewer notes
              </label>
              <Textarea
                id="report-notes"
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you find, and what did you do about it?"
              />
              <p className="text-xs text-muted-foreground">
                Required before closing a report — actioned or dismissed.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ status: 'REVIEWED' })}
              >
                Mark reviewed
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ status: 'DISMISSED' })}
                >
                  Dismiss
                </Button>
                <Button
                  variant="gradient"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ status: 'ACTIONED' })}
                >
                  {decide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark actioned
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-secondary/20 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="flex gap-2">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value || '—'}</span>
    </p>
  );
}

/** {@code FAKE_CREDENTIALS} → {@code Fake credentials}. */
function readable(constant: string) {
  const words = constant.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
