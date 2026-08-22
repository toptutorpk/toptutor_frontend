import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn, formatPKR } from '@/lib/utils';

/** The CNIC details, held on the page until the application is submitted. */
export interface IdentityDraft {
  cnicNumber: string;
  cnicIssueDate: string;
}

/** Matches the server's rule, so the button disables before a submission can be refused. */
const CNIC_RE = /^\d{5}-\d{7}-\d$/;

const STATUS_META: Record<
  StepStatus,
  { label: string; badge: 'secondary' | 'info' | 'success' | 'destructive' | 'gold'; num: string }
> = {
  NOT_STARTED: { label: 'Not started', badge: 'secondary', num: 'bg-secondary text-muted-foreground' },
  // Amber rather than grey: this step has something in it, and the colour is what tells a tutor
  // scanning the page which steps they have already touched.
  IN_PROGRESS: { label: 'In progress', badge: 'gold', num: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  // Everything attached, nothing sent yet — the step wants nothing further from the tutor.
  READY: { label: 'Uploaded', badge: 'info', num: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
  UNDER_REVIEW: { label: 'Under review', badge: 'info', num: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  PASSED: { label: 'Verified', badge: 'success', num: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', badge: 'destructive', num: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  FLAGGED: { label: 'Not cleared', badge: 'destructive', num: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

/**
 * Local overrides for a step's header copy, keyed by step key.
 *
 * <p>The Identity step no longer asks for a selfie (see the slot filter in StepCard below), so its
 * server-written title and description — written for the old three-upload version — are replaced
 * here rather than on the backend, the same way {@link STATUS_META} and {@link APP_BANNER} already
 * override server copy for display.
 */
const STEP_COPY_OVERRIDE: Partial<Record<string, { title: string; description: string }>> = {
  IDENTITY: {
    title: 'CNIC Verification',
    description: 'Upload a clear, readable photo of your CNIC — front and back.',
  },
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
  // Lives here rather than in the Identity step so the submit button can send it. There is no
  // separate save: the details are part of the application and are written when it is submitted.
  const [identity, setIdentity] = useState<IdentityDraft>({ cnicNumber: '', cnicIssueDate: '' });
  const [hydrated, setHydrated] = useState(false);

  // Seed once from whatever a previous submission stored, then leave the field alone — refetching
  // after every upload must not overwrite what the tutor is part-way through typing.
  useEffect(() => {
    if (hydrated || !data) return;
    setIdentity({ cnicNumber: data.cnicNumber ?? '', cnicIssueDate: data.cnicIssueDate ?? '' });
    setHydrated(true);
  }, [data, hydrated]);

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

  // The bar tracks admin-verified steps only. Counting drafts would let a tutor push it to 100% by
  // uploading files nobody has looked at, which is the opposite of what the number is for.
  const pct = Math.round((data.completedCount / data.totalSteps) * 100);
  const awaitingReview = data.steps.filter((s) => s.status === 'UNDER_REVIEW').length;
  const inProgress = data.steps.filter((s) => s.status === 'IN_PROGRESS').length;
  const flagged = data.steps.some((s) => s.status === 'FLAGGED');
  const toggle = (key: string) => setExpanded((k) => (k === key ? null : key));
  const banner = APP_BANNER[data.applicationStatus];

  /** Says what the number actually means, so a stalled bar has a visible reason. */
  const progressNote = () => {
    if (data.overallStatus === 'VERIFIED') return 'All done — your Verified Badge is active. 🎉';
    if (flagged) return 'One step could not be cleared. See the details below.';
    if (awaitingReview > 0) {
      return `${pct}% verified — ${awaitingReview} step${awaitingReview === 1 ? '' : 's'} with our review team.`;
    }
    if (inProgress > 0) {
      return `${pct}% verified — ${inProgress} step${inProgress === 1 ? '' : 's'} started. Finish and submit for review.`;
    }
    return `${pct}% verified — upload your documents, then submit for final review.`;
  };

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
            {data.completedCount}/{data.totalSteps} verified
          </Badge>
        </div>
        <Progress value={pct} className="mt-4 bg-white/20" indicatorClassName="bg-gold-400" />
        <p className="mt-2 text-sm text-white/80">{progressNote()}</p>
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
            identity={identity}
            onIdentityChange={setIdentity}
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
  identity,
  onIdentityChange,
  expanded,
  onToggle,
  onChanged,
}: {
  step: VerificationStep;
  index: number;
  view: VerificationView;
  identity: IdentityDraft;
  onIdentityChange: (next: IdentityDraft) => void;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const meta = STATUS_META[step.status];
  const copy = STEP_COPY_OVERRIDE[step.key];
  // Optional identity photos (e.g. the selfie-with-CNIC ask) are dropped here rather than uploaded
  // around — the front and back of the card are what a reviewer actually checks the CNIC number
  // against, and a box nobody is required to fill was just a wider step to get through.
  const slots = step.key === 'IDENTITY' ? step.slots.filter((s) => s.required) : step.slots;
  const imageSlots = slots.filter((s) => s.kind === 'image');
  const otherSlots = slots.filter((s) => s.kind !== 'image');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow',
        expanded && 'shadow-md',
        step.status === 'PASSED' && 'border-emerald-200 dark:border-emerald-500/20',
        // Flagged is as final as rejected and should read that way from the collapsed list, not
        // only once the step is opened.
        (step.status === 'REJECTED' || step.status === 'FLAGGED') &&
          'border-red-200 dark:border-red-500/20',
      )}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-5 text-left">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold',
            meta.num,
          )}
        >
          {/* The two settled outcomes replace the number with a mark, so the list can be read
              down its left edge without parsing every chip. */}
          {step.status === 'PASSED' ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : step.status === 'FLAGGED' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            index
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{copy?.title ?? step.title}</h3>
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy?.description ?? step.description}</p>
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

          {/* A flag is not a rejection: there is nothing to re-upload, so the panel points at
              support rather than offering a fix the tutor cannot make. */}
          {step.status === 'FLAGGED' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <p className="font-semibold">This check could not be cleared</p>
              {step.notes && <p className="mt-1">{step.notes}</p>}
              <p className="mt-1">
                If you believe this is a mistake, contact{' '}
                <a href="mailto:support@toptutor.pk" className="font-semibold underline underline-offset-4">
                  support@toptutor.pk
                </a>
                .
              </p>
            </div>
          )}

          {step.key === 'BACKGROUND' && <BackgroundFeePanel fee={view.backgroundCheckFee} />}

          {step.key === 'ADMIN_APPROVAL' ? (
            <FinalReviewSection view={view} identity={identity} onSubmitted={onChanged} />
          ) : step.slots.length === 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>
                Your subject proficiency test is scheduled online — we’ll email you a link. No upload
                needed here.
              </span>
            </div>
          ) : step.key === 'IDENTITY' ? (
            // Fields sit beside the cards rather than below them: the two CNIC images are a fixed,
            // card-sized pair, so the rest of the row would otherwise sit empty on anything wider
            // than a phone. flex-wrap (not a fixed breakpoint) drops the fields under the images once
            // the row genuinely runs out of room, rather than guessing a pixel width to switch at.
            <div className="flex flex-wrap items-stretch gap-5">
              {/* Explicit width, not just shrink-0: a flex-wrap container's own auto flex-basis
                  doesn't reliably report its max-content width to its parent, so without this it
                  would size down and wrap the two cards onto separate lines well before the fields
                  column actually ran out of room to shrink into. */}
              <div className="flex w-full flex-wrap gap-5 sm:w-[672px] sm:shrink-0">
                {imageSlots.map((slot) => (
                  <VerificationSlot key={slot.key} slot={slot} onChanged={onChanged} />
                ))}
              </div>
              <IdentityFields
                value={identity}
                onChange={onIdentityChange}
                className="min-w-[240px] flex-1"
              />
            </div>
          ) : (
            <>
              {imageSlots.length > 0 && (
                // Grid rather than flex-wrap: each card fills its column evenly instead of sitting
                // at a fixed width with dead space beside it once a row holds only one or two.
                <div className="grid gap-5 sm:grid-cols-2">
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
function FinalReviewSection({
  view,
  identity,
  onSubmitted,
}: {
  view: VerificationView;
  identity: IdentityDraft;
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // The CNIC details are compulsory, so they gate the button alongside the documents. Checked here
  // as well as on the server so the tutor is stopped before a round trip, not after one.
  const identityComplete =
    CNIC_RE.test(identity.cnicNumber.trim()) && identity.cnicIssueDate !== '';
  const canSubmit = view.canSubmit && identityComplete;

  const submit = useMutation({
    mutationFn: () => verificationService.submit(identity.cnicNumber.trim(), identity.cnicIssueDate),
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

      <Button variant="gradient" disabled={!canSubmit} onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> Submit for Admin Approval
      </Button>
      {/* Names the missing half specifically. "Complete all required fields" would leave a tutor
          who has uploaded everything hunting for what is wrong. */}
      {view.canSubmit && !identityComplete && (
        <p className="text-xs text-amber-600">
          Add your CNIC number and date of issue in step 1 to enable submission.
        </p>
      )}
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
/**
 * The CNIC number and issue date, beside the card images they are read from.
 *
 * <p>No save button: these are part of the application, not a thing to file separately, and they
 * are written when it is submitted. Both are required — the number and issue date are what a
 * reviewer checks the uploaded card against, so an application without them cannot be reviewed.
 *
 * <p>Stacked with `justify-between` rather than laid out as a compact block: the parent flex row
 * (`items-stretch`, the default) already sizes this column to match the image cards beside it, and
 * `justify-between` spreads the two fields across that height instead of leaving a gap under a
 * shorter column.
 */
function IdentityFields({
  value,
  onChange,
  className,
}: {
  value: IdentityDraft;
  onChange: (next: IdentityDraft) => void;
  className?: string;
}) {
  /** Inserts the dashes while typing, so what is sent always matches what is printed. */
  const onCnicChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 13);
    const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean);
    onChange({ ...value, cnicNumber: parts.join('-') });
  };

  // Complain only once there is something to complain about — a rule shown against an untouched
  // field reads as an error the tutor has already made.
  const cnicBad = value.cnicNumber.length > 0 && !CNIC_RE.test(value.cnicNumber);

  return (
    // Fields group at the top rather than spreading down the column. justify-between pushed them to
    // opposite ends of a column stretched to the height of the CNIC cards beside it, leaving a void
    // between two inputs that belong together and reading as two unrelated controls.
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="space-y-1.5">
        <Label htmlFor="cnic">
          CNIC number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cnic"
          value={value.cnicNumber}
          onChange={(e) => onCnicChange(e.target.value)}
          placeholder="42101-1234567-1"
          inputMode="numeric"
          aria-invalid={cnicBad}
        />
        {cnicBad && (
          <p className="text-xs text-red-500">Enter all 13 digits as printed on the card.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cnic-issued">
          Date of issue <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cnic-issued"
          type="date"
          value={value.cnicIssueDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange({ ...value, cnicIssueDate: e.target.value })}
        />
      </div>
    </div>
  );
}

function BackgroundFeePanel({ fee }: { fee: number }) {
  return (
    <div className="rounded-xl border border-brand-200/70 bg-brand-25 p-4 text-sm dark:border-brand-500/25 dark:bg-brand-500/10">
      <p className="font-display font-bold">Background check fee — {formatPKR(fee)}</p>
      <p className="mt-1 text-muted-foreground">
        We run the criminal background check on your behalf. Transfer the fee, then upload your
        receipt below — our team takes it from there.
      </p>
      {/* Placeholder account details: replace with the real ones before this goes live. */}
      <dl className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Account title</dt>
          <dd className="font-semibold">TopTutor (Pvt) Ltd</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">JazzCash</dt>
          <dd className="font-semibold tabular-nums">0300-0000000</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Transfers are reconciled by hand; allow up to 2 working days after you upload the receipt.
      </p>
    </div>
  );
}
