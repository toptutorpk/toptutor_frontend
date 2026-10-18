import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Trash2,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  instituteService,
  type InstituteSlot,
  type InstituteStep,
  type InstituteVerificationView,
} from '@/services/instituteService';
import { addDays, format } from 'date-fns';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { acceptHint, rejectReason } from '@/lib/uploadRules';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const QUERY_KEY = ['institute', 'verification'] as const;

export default function InstituteRegistration() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => instituteService.getVerification(),
  });

  if (isLoading) return <LoadingState label="Loading your registration…" />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Could not load your registration." />;
  }

  return (
    <div className="space-y-6">
      <StatusBanner view={data} />

      <div className="space-y-4">
        {data.steps.map((step, i) => (
          <StepCard key={step.key} step={step} index={i} locked={data.accountStatus !== 'APPLIED'} />
        ))}
      </div>

      <SubmitBar view={data} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status                                                                     */
/* -------------------------------------------------------------------------- */

function StatusBanner({ view }: { view: InstituteVerificationView }) {
  const { accountStatus, statusNotes, completedCount, totalSteps } = view;
  const pct = Math.round((completedCount / Math.max(totalSteps, 1)) * 100);

  const tone = {
    APPLIED: {
      icon: FileText,
      title: statusNotes ? 'Changes requested' : 'Complete your registration',
      body: statusNotes ? (
        'Our team reviewed your file and needs a few corrections before approving it.'
      ) : (
        <>
          Add your{' '}
          <Link
            to="/dashboard/institute/profile"
            className="font-medium text-foreground underline underline-offset-2"
          >
            campus details
          </Link>{' '}
          and complete the {totalSteps} steps below. Teachers become reachable once our team
          approves your institute.
        </>
      ),
      klass: statusNotes
        ? 'border-amber-300/70 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
        : 'border-brand-200/70 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10',
    },
    UNDER_REVIEW: {
      icon: Clock,
      title: 'Under review',
      body: 'Our trust & safety team is checking your documents. You cannot change them while we review.',
      klass: 'border-blue-300/70 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10',
    },
    VERIFIED: {
      icon: CheckCircle2,
      title: 'Verified',
      body: 'Your institute is approved. You can post jobs, view full teacher profiles and send offers.',
      klass: 'border-emerald-300/70 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    },
    SUSPENDED: {
      icon: AlertTriangle,
      title: 'Account suspended',
      body: 'Hiring is disabled on this account. Contact support to resolve it.',
      klass: 'border-red-300/70 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
    },
  }[accountStatus];

  // A status the front-end has not been taught yet must not take the page down. The step badges
  // below already fall back this way; this one did not, so a server that grows a fifth status
  // would have left an institute staring at a stack trace instead of their own documents.
  const safe = tone ?? {
    icon: FileText,
    title: 'Registration in progress',
    body: 'Complete the steps below and submit your file for review.',
    klass: 'border-border bg-secondary/30',
  };

  const Icon = safe.icon;

  return (
    <div className={cn('rounded-2xl border p-5', safe.klass)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold">{safe.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{safe.body}</p>

          {statusNotes && (
            <p className="mt-3 rounded-lg border bg-card/70 p-3 text-sm">
              <span className="font-semibold">What to fix: </span>
              {statusNotes}
            </p>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">
                {completedCount} of {totalSteps} steps approved
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The same ladder, and the same colours, as the tutor's verification page.
 *
 * <p>An institute and a tutor read the same shaped card, so a step meaning "everything attached,
 * waiting on me to submit" must not be a grey "Ready" in one portal and a blue "Uploaded" in the
 * other. Amber for a part-finished step and blue for a finished one is what carries the
 * difference at a glance, before any label is read.
 *
 * <p>Two words stay institute-specific: a reviewer *approves* an institute's document rather than
 * verifying a person, and "Needs changes" says what to do where "Rejected" only says what
 * happened — this flow expects a re-upload.
 */
const STEP_BADGE: Record<string, { label: string; variant: 'success' | 'gold' | 'info' | 'secondary' | 'destructive' }> = {
  NOT_STARTED: { label: 'Not started', variant: 'secondary' },
  IN_PROGRESS: { label: 'In progress', variant: 'gold' },
  READY: { label: 'Uploaded', variant: 'info' },
  UNDER_REVIEW: { label: 'Under review', variant: 'info' },
  PASSED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Needs changes', variant: 'destructive' },
  FLAGGED: { label: 'On hold', variant: 'destructive' },
};

function StepCard({ step, index, locked }: { step: InstituteStep; index: number; locked: boolean }) {
  const badge = STEP_BADGE[step.status] ?? STEP_BADGE.NOT_STARTED;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold tabular-nums">
              {index + 1}
            </span>
            <h3 className="font-display text-base font-bold">{step.title}</h3>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {step.notes && (
        <p className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <span className="font-semibold">Reviewer note: </span>
          {step.notes}
        </p>
      )}

      {step.slots.length > 0 && (
        <div className="mt-4 space-y-3">
          {step.slots.map((slot) => (
            <SlotRow key={slot.key} slot={slot} locked={locked} />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  One document slot                                                          */
/* -------------------------------------------------------------------------- */

function SlotRow({ slot, locked }: { slot: InstituteSlot; locked: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expiresAt, setExpiresAt] = useState(slot.expiresAt ?? '');
  const [progress, setProgress] = useState<number | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const upload = useMutation({
    mutationFn: (file: File) =>
      instituteService.uploadDocument(slot.key, file, slot.expiring ? expiresAt : undefined, setProgress),
    onSuccess: () => {
      toast.success(`${slot.label} uploaded`);
      refresh();
    },
    onError: (e) =>
      toast.error('Upload failed', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
    onSettled: () => setProgress(null),
  });

  const remove = useMutation({
    mutationFn: () => instituteService.removeDocument(slot.key),
    onSuccess: () => {
      toast.success(`${slot.label} removed`);
      refresh();
    },
    onError: (e) =>
      toast.error('Could not remove', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const pick = () => {
    // An expiring slot needs its date first: the server rejects the upload without one, and
    // finding that out after the file has travelled is a waste of the institute's time.
    if (slot.expiring && !expiresAt) {
      toast.info('Enter the expiry date first', {
        description: `We need to know when your ${slot.label.toLowerCase()} lapses.`,
      });
      return;
    }
    fileRef.current?.click();
  };

  const disabled = locked || slot.locked || upload.isPending || remove.isPending;
  const busy = upload.isPending || remove.isPending;

  return (
    <div className="rounded-xl border bg-secondary/30 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {slot.label}
            {!slot.required && <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>}
          </p>
          {/* Stated before the file dialog opens, not after the upload fails. The limits come
              from the slot itself, which carries the server's own upload category. */}
          {!slot.locked && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{acceptHint(slot)}</p>
          )}
          {slot.url ? (
            <a
              href={slot.url}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileText className="h-3 w-3" /> View uploaded file
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Nothing uploaded yet</p>
          )}
          {slot.reviewNotes && (
            <p className="mt-1 text-xs text-destructive">{slot.reviewNotes}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {slot.locked && <Badge variant="success">Approved</Badge>}
          {!slot.locked && (
            <>
              <Button size="sm" variant="outline" onClick={pick} disabled={disabled}>
                {upload.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {slot.url ? 'Replace' : 'Upload'}
              </Button>
              {slot.url && (
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`Remove ${slot.label}`}
                  onClick={() => remove.mutate()}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {slot.expiring && !slot.locked && (
        <div className="mt-3 max-w-64">
          <Label htmlFor={`exp-${slot.key}`} className="text-xs">
            Expires on
          </Label>
          {/* The same picker as the tutor's CNIC issue date. A registration certificate can run
              years out, so the month/year drill-down matters more here than paging a month grid
              forward one chevron at a time. Floor is tomorrow because the server refuses anything
              not strictly after today — better to make that unpickable than to explain it. */}
          <DatePicker
            id={`exp-${slot.key}`}
            value={expiresAt}
            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
            onChange={setExpiresAt}
            disabled={locked}
            placeholder="Select the expiry date"
            className="mt-1"
          />
        </div>
      )}

      {progress !== null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={slot.accept}
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset first: picking the same file twice must still fire a change event.
          e.target.value = '';
          if (!file) return;
          // Checked here rather than left to the server: otherwise an oversized scan travels the
          // whole way up a phone connection before being refused, and on that connection the wait
          // is the entire experience of the step.
          const problem = rejectReason(file, slot);
          if (problem) {
            toast.error('That file cannot be uploaded', { description: problem });
            return;
          }
          upload.mutate(file);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Submit                                                                     */
/* -------------------------------------------------------------------------- */

function SubmitBar({ view }: { view: InstituteVerificationView }) {
  const qc = useQueryClient();
  const submit = useMutation({
    mutationFn: () => instituteService.submit(),
    onSuccess: () => {
      toast.success('Registration submitted', {
        description: 'Our team will review it and let you know.',
      });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) =>
      toast.error('Could not submit', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (view.accountStatus !== 'APPLIED') return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-soft">
      <div>
        <p className="font-display font-bold">Ready to submit?</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {view.canSubmit
            ? 'Your documents are locked while we review them.'
            : 'Upload every required document and confirm your phone and email first.'}
        </p>
      </div>
      <Button
        variant="gradient"
        size="lg"
        disabled={!view.canSubmit || submit.isPending}
        onClick={() => submit.mutate()}
      >
        {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit for review
      </Button>
    </div>
  );
}
