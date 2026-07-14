import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  ChevronDown,
  Check,
  Loader2,
  Info,
  GraduationCap,
  Clock,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { VerificationSlot } from '@/components/tutor/VerificationSlot';
import {
  verificationService,
  type ApplicationStatus,
  type StepStatus,
  type VerificationStep,
  type VerificationView,
} from '@/services/verificationService';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const STATUS_META: Record<
  StepStatus,
  { label: string; badge: 'secondary' | 'info' | 'success' | 'destructive'; num: string }
> = {
  NOT_STARTED: { label: 'Not started', badge: 'secondary', num: 'bg-secondary text-muted-foreground' },
  UNDER_REVIEW: { label: 'Under review', badge: 'info', num: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  PASSED: { label: 'Passed', badge: 'success', num: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', badge: 'destructive', num: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

const APP_BANNER: Record<ApplicationStatus, { tone: string; icon: typeof Clock; title: string; body: string } | null> = {
  DRAFT: null,
  SUBMITTED: {
    tone: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    icon: Clock,
    title: 'Application under review',
    body: 'Our Trust & Safety team is reviewing your documents. You’ll be notified as each one is approved.',
  },
  CHANGES_REQUESTED: {
    tone: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    icon: AlertTriangle,
    title: 'Changes requested',
    body: 'One or more documents were rejected. Re-upload the flagged documents below, then submit again.',
  },
  APPROVED: {
    tone: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    icon: ShieldCheck,
    title: 'You’re verified! 🎉',
    body: 'Your Verified Badge is active and your approved documents are locked.',
  },
};

export default function TutorVerification() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['verification'],
    queryFn: () => verificationService.get(),
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Get Verified" description="Complete all 7 steps to earn your green Verified Badge." />
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const pct = Math.round((data.completedCount / data.totalSteps) * 100);
  const toggle = (key: string) => setExpanded((k) => (k === key ? null : key));
  const banner = APP_BANNER[data.applicationStatus];

  return (
    <div>
      <PageHeader title="Get Verified" description="Complete all 7 steps to earn your green Verified Badge." />

      {/* Progress banner */}
      <div className="mb-4 rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-display text-lg font-bold">Verification progress</span>
          </div>
          <Badge variant="gold">
            {data.completedCount}/{data.totalSteps} complete
          </Badge>
        </div>
        <Progress value={pct} className="mt-4 bg-white/20" indicatorClassName="bg-gold-400" />
        <p className="mt-2 text-sm text-white/80">
          {data.overallStatus === 'VERIFIED'
            ? 'All done — your Verified Badge is active. 🎉'
            : `${pct}% done — upload your documents, then submit for final review.`}
        </p>
      </div>

      {/* Application status banner */}
      {banner && (
        <div className={cn('mb-6 flex items-start gap-3 rounded-2xl border p-4 shadow-soft', banner.tone)}>
          <banner.icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{banner.title}</p>
            <p className="text-sm opacity-90">{banner.body}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.steps.map((step, i) => (
          <StepCard
            key={step.key}
            step={step}
            index={i + 1}
            view={data}
            expanded={expanded === step.key}
            onToggle={() => toggle(step.key)}
            onChanged={() => refetch()}
          />
        ))}
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  view,
  expanded,
  onToggle,
  onChanged,
}: {
  step: VerificationStep;
  index: number;
  view: VerificationView;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const meta = STATUS_META[step.status];
  const imageSlots = step.slots.filter((s) => s.kind === 'image');
  const otherSlots = step.slots.filter((s) => s.kind !== 'image');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow',
        expanded && 'shadow-md',
        step.status === 'PASSED' && 'border-emerald-200 dark:border-emerald-500/20',
        step.status === 'REJECTED' && 'border-red-200 dark:border-red-500/20',
      )}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-5 text-left">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold',
            meta.num,
          )}
        >
          {step.status === 'PASSED' ? <Check className="h-5 w-5" strokeWidth={3} /> : index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{step.title}</h3>
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t p-5">
          {step.status === 'REJECTED' && step.notes && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <span className="font-semibold">Needs attention:</span> {step.notes}
            </div>
          )}

          {step.key === 'ADMIN_APPROVAL' ? (
            <FinalReviewSection view={view} onSubmitted={onChanged} />
          ) : step.slots.length === 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>
                Your subject proficiency test is scheduled online — we’ll email you a link. No upload
                needed here.
              </span>
            </div>
          ) : (
            <>
              {imageSlots.length > 0 && (
                <div className="flex flex-wrap gap-5">
                  {imageSlots.map((slot) => (
                    <VerificationSlot key={slot.key} slot={slot} onChanged={onChanged} />
                  ))}
                </div>
              )}
              {otherSlots.map((slot) => (
                <VerificationSlot key={slot.key} slot={slot} onChanged={onChanged} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** The "Admin Final Approval" step: submit-for-review CTA with a professional declaration dialog. */
function FinalReviewSection({ view, onSubmitted }: { view: VerificationView; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const submit = useMutation({
    mutationFn: () => verificationService.submit(),
    onSuccess: () => {
      setOpen(false);
      setConfirmed(false);
      toast.success('Submitted for review', {
        description: 'Our team will review your documents and update you here.',
      });
      onSubmitted();
    },
    onError: (e) => {
      toast.error('Could not submit', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    },
  });

  if (view.applicationStatus === 'APPROVED') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Your application has been approved and your Verified Badge is active. 🎉</span>
      </div>
    );
  }

  if (view.applicationStatus === 'SUBMITTED') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          Your application is with our Trust &amp; Safety team. Each document is being reviewed —
          you’ll see approvals appear on the steps above.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span>
          When every required document is uploaded, submit your application. Our team reviews each
          document and issues your Verified Badge. Approved documents are locked afterwards.
        </span>
      </div>

      <Button variant="gradient" disabled={!view.canSubmit} onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> Submit for Admin Approval
      </Button>
      {!view.canSubmit && view.applicationStatus !== 'CHANGES_REQUESTED' && (
        <p className="text-xs text-muted-foreground">
          Upload all required documents (marked <span className="text-red-500">*</span>) to enable
          submission.
        </p>
      )}
      {view.applicationStatus === 'CHANGES_REQUESTED' && (
        <p className="text-xs text-amber-600">
          Re-upload the rejected documents above, then you’ll be able to submit again.
        </p>
      )}

      <Dialog open={open} onOpenChange={(o) => (submit.isPending ? null : setOpen(o))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit for final review</DialogTitle>
            <DialogDescription>
              Please confirm before we send your application to our Trust &amp; Safety team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl border bg-secondary/30 p-4 text-muted-foreground">
              Our team will review each document individually. Approved documents are{' '}
              <span className="font-medium text-foreground">locked</span> and can no longer be
              changed. If any document is rejected, you’ll be asked to re-upload it.
            </div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox
                className="mt-0.5"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(Boolean(v))}
              />
              <span className="text-foreground/90">
                I declare that all documents and information I have provided are{' '}
                <span className="font-semibold">genuine, valid and belong to me</span>. I understand
                that submitting false or forged documents may result in permanent removal from
                TopTutor.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submit.isPending}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={!confirmed || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirm &amp; Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
