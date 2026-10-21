import { useState } from 'react';
import { ImageWithSkeleton } from '@/components/common/ImageWithSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { TutorCommissionSection } from '@/components/admin/TutorCommissionSection';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  ShieldCheck,
  MapPin,
  Award,
  Languages,
  FileText,
  Video as VideoIcon,
  Lock,
  Eye,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { AccountBadge } from '@/components/admin/AdminKit';
import { cn, getInitials, formatPKR } from '@/lib/utils';
import { toNationalDisplay } from '@/lib/phone';
import { youtubeIdFrom } from '@/lib/youtube';
import type { IntroVideoStatus } from '@/services/adminService';
import { adminService } from '@/services/adminService';
import type { DocStatus, VerificationSlot } from '@/services/verificationService';

const DOC_BADGE: Record<DocStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-secondary text-muted-foreground' },
  UNDER_REVIEW: {
    label: 'Under review',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  APPROVED: {
    label: 'Approved',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
};

export default function AdminTutorReview() {
  const { id } = useParams();
  const tutorId = Number(id);
  const qc = useQueryClient();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const backTo =
    from &&
    (from === '/admin/approvals' || from === '/admin/tutors' || from.startsWith('/admin/tutors?'))
      ? from
      : '/admin/tutors';
  const [confirmation, setConfirmation] = useState<'approve' | 'active' | 'suspended' | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tutor', tutorId],
    queryFn: () => adminService.tutor(tutorId),
    enabled: Number.isSafeInteger(tutorId) && tutorId > 0,
  });

  // Reject dialog target: a single document, or the whole application.
  // 'flag' shares this dialog because it needs the same thing: a reason, typed once, before an
  // irreversible-feeling decision. Only the wording and the endpoint differ.
  const [reject, setReject] = useState<{
    kind: 'doc' | 'app' | 'flag';
    slotKey?: string;
    label?: string;
  } | null>(null);
  const [notes, setNotes] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'tutor', tutorId] });
    qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const approveDoc = useMutation({
    mutationFn: (slotKey: string) => adminService.reviewDocument(tutorId, slotKey, 'APPROVE'),
    onSuccess: () => {
      invalidate();
      toast.success('Document approved');
    },
    onError: (e) =>
      toast.error('Could not approve document', {
        description: e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (reject?.kind === 'doc') {
        return adminService.reviewDocument(tutorId, reject.slotKey as string, 'REJECT', notes);
      }
      // FLAG is not REJECT: rejection asks the tutor to fix and resubmit, which is the wrong
      // instruction for a background-check finding they cannot answer.
      return adminService.decide(tutorId, reject?.kind === 'flag' ? 'FLAG' : 'REJECT', notes);
    },
    onSuccess: () => {
      invalidate();
      toast.success(
        reject?.kind === 'doc'
          ? 'Document rejected'
          : reject?.kind === 'flag'
            ? 'Background check flagged — the tutor stays unverified'
            : 'Application rejected',
      );
      setReject(null);
      setNotes('');
    },
    onError: (e) =>
      toast.error('Could not record the decision', {
        description: e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const approveApp = useMutation({
    mutationFn: () => adminService.decide(tutorId, 'APPROVE'),
    onSuccess: () => {
      invalidate();
      setConfirmation(null);
      toast.success('Application approved — tutor verified & listed');
    },
    onError: (e) =>
      toast.error('Could not approve application', {
        description: e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'suspended') => adminService.setStatus(tutorId, status),
    onSuccess: () => {
      invalidate();
      setConfirmation(null);
      toast.success('Account status updated');
    },
    onError: (e) =>
      toast.error('Could not update account status', {
        description: e instanceof Error ? e.message : 'Please try again.',
      }),
  });
  const busy =
    approveDoc.isPending ||
    rejectMutation.isPending ||
    approveApp.isPending ||
    statusMutation.isPending;

  if (isLoading && Number.isSafeInteger(tutorId) && tutorId > 0) {
    return <TutorFileSkeleton />;
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card p-16 shadow-soft">
        {isError || !Number.isSafeInteger(tutorId) || tutorId <= 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">We couldn’t load this tutor file.</p>
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
            <Button variant="ghost" asChild>
              <Link to={backTo}>Back to tutors</Link>
            </Button>
          </div>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const { summary, profile, verification } = data;
  const appStatus = verification.applicationStatus;
  const decidable = verification.applicationStatus === 'SUBMITTED' && summary.status === 'active';
  const verified = verification.overallStatus === 'VERIFIED';
  const videoUrl = safeVideoUrl(
    profile?.videoIntroYoutubeId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(profile.videoIntroYoutubeId)}`
      : profile?.videoIntroUrl,
  );

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Back">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Tutor file</h1>
          <p className="text-sm text-muted-foreground">
            Profile, account details and verification documents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccountBadge status={summary.status} className="h-7 px-2.5 py-0 text-xs" />
          <AppStatusBadge status={appStatus} />
          <Button variant="outline" size="sm" asChild>
            <Link
              to={`/admin/bookings/accounts/${tutorId}`}
              state={{ from: location.pathname + location.search }}
            >
              View bookings
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile card */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        {profile?.coverUrl && (
          <div className="h-28 w-full overflow-hidden bg-secondary">
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.photoUrl} alt={summary.name} />
              <AvatarFallback className="text-xl">{getInitials(summary.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">{summary.name}</h2>
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {profile?.headline && (
                <p className="text-sm text-muted-foreground">{profile.headline}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{summary.email}</span>
                {summary.phone && <span>{toNationalDisplay(summary.phone)}</span>}
                {(profile?.area || profile?.city) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{' '}
                    {[profile?.area, profile?.city].filter(Boolean).join(', ')}
                  </span>
                )}
                {profile?.experienceYears != null && (
                  <span className="inline-flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {profile.experienceYears} yrs
                  </span>
                )}
                {profile?.teachingLanguage && (
                  <span className="inline-flex items-center gap-1">
                    <Languages className="h-3.5 w-3.5" /> {profile.teachingLanguage}
                  </span>
                )}
                {profile?.hourlyRate != null && <span>PKR {profile.hourlyRate}/hr</span>}
              </div>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 rounded-xl border bg-secondary/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <InfoField
              label="Email"
              value={summary.email || 'Not provided'}
              detail={data.emailVerified ? 'Verified' : 'Not verified'}
            />
            <InfoField
              label="Phone"
              value={toNationalDisplay(summary.phone) || 'Not provided'}
              detail={data.phoneVerified ? 'Verified' : 'Not verified'}
            />
            <InfoField
              label="Registered"
              value={
                summary.createdAt
                  ? new Date(summary.createdAt).toLocaleDateString('en-GB')
                  : 'Not available'
              }
            />
            <InfoField label="Gender" value={profile?.gender || 'Not provided'} />
            <InfoField
              label="Hourly rate"
              value={profile?.hourlyRate != null ? formatPKR(profile.hourlyRate) : 'Not provided'}
            />
            <InfoField
              label="Monthly rate"
              value={profile?.monthlyRate != null ? formatPKR(profile.monthlyRate) : 'Not provided'}
            />
            <InfoField
              label="Verification steps"
              value={summary.stepsPassed + ' of ' + summary.stepsTotal + ' approved'}
            />
          </dl>
          {!profile && (
            <p className="mt-4 text-sm text-muted-foreground">
              This tutor has not created a profile yet.
            </p>
          )}
          {profile?.bio && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ChipList title="Subjects" items={profile?.subjects} />
            <ChipList title="Grade levels" items={profile?.gradeLevels} />
            <ChipList title="Skills" items={profile?.skills} />
            <ChipList title="Modes" items={profile?.modes} />
          </div>

          {profile ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CredentialList title="Education" items={profile?.education} />
              <CredentialList title="Certifications" items={profile?.certifications} />
            </div>
          ) : null}
          {profile && (
            <section className="mt-5 border-t pt-4">
              <h3 className="text-sm font-semibold">Courses</h3>
              {profile.courses?.length ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {profile.courses.map((course, index) => (
                    <div key={index} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{course.title}</p>
                      {course.abbreviation && (
                        <p className="text-xs text-muted-foreground">{course.abbreviation}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No courses provided.</p>
              )}
            </section>
          )}
        </div>
      </div>
      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Identity details</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <InfoField label="CNIC number" value={verification.cnicNumber || 'Not provided'} />
          <InfoField label="CNIC issue date" value={verification.cnicIssueDate || 'Not provided'} />
        </dl>
      </section>

      {appStatus === 'SUBMITTED' && (
        <>
          {/* Where the branded introduction video ended up. */}
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Introduction video</h2>
            {videoUrl ? (
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <VideoIcon className="h-4 w-4" /> Open submitted video
                </a>
              </Button>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No introduction video provided.</p>
            )}
          </section>
          <IntroVideoBanner intro={data.introVideo} />
        </>
      )}

      {/* Documents */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold">Documents</h2>
        {verification.steps.filter((s) => s.slots.some((sl) => sl.url)).length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-soft">
            <FileText className="h-4 w-4" /> This tutor hasn’t uploaded any documents yet.
          </div>
        ) : (
          verification.steps
            .filter((s) => s.slots.some((sl) => sl.url))
            .map((step) => (
              <div key={step.key} className="rounded-2xl border bg-card p-5 shadow-soft">
                <h3 className="mb-3 text-sm font-semibold">{step.title}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {step.slots
                    .filter((sl) => sl.url)
                    .map((slot) => (
                      <DocumentCard
                        key={slot.key}
                        slot={slot}
                        busy={busy || slot.status !== 'UNDER_REVIEW' || summary.status !== 'active'}
                        onApprove={() => approveDoc.mutate(slot.key)}
                        onReject={() =>
                          setReject({ kind: 'doc', slotKey: slot.key, label: slot.label })
                        }
                      />
                    ))}
                </div>
              </div>
            ))
        )}
      </div>

      {decidable && (
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">Application review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approval verifies the tutor and locks their documents.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="text-red-600"
              disabled={busy}
              onClick={() => setReject({ kind: 'flag' })}
            >
              <ShieldAlert className="h-4 w-4" /> Flag background check
            </Button>
            <Button
              variant="outline"
              className="text-red-600"
              disabled={busy}
              onClick={() => setReject({ kind: 'app' })}
            >
              <X className="h-4 w-4" /> Reject application
            </Button>
            <Button variant="gradient" disabled={busy} onClick={() => setConfirmation('approve')}>
              <Check className="h-4 w-4" /> Approve application
            </Button>
          </div>
        </section>
      )}
      <TutorCommissionSection tutorId={tutorId} />
      {(summary.status === 'active' ||
        summary.status === 'pending' ||
        summary.status === 'suspended') && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div>
            <h2 className="font-display text-lg font-bold">Account actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.status === 'suspended'
                ? 'Restore this tutor’s access to the platform.'
                : 'Suspend this tutor’s access when account intervention is required.'}
            </p>
          </div>
          <Button
            variant="outline"
            className={
              summary.status !== 'suspended'
                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10'
                : undefined
            }
            disabled={busy}
            onClick={() => setConfirmation(summary.status === 'suspended' ? 'active' : 'suspended')}
          >
            <ShieldAlert className="h-4 w-4" />
            {summary.status === 'suspended' ? 'Re-activate account' : 'Suspend account'}
          </Button>
        </section>
      )}

      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation === 'approve'
                ? 'Approve tutor application?'
                : confirmation === 'suspended'
                  ? 'Suspend tutor account?'
                  : 'Re-activate tutor account?'}
            </DialogTitle>
            <DialogDescription>
              {confirmation === 'approve'
                ? 'This approves the application and locks its documents. Confirm that you have reviewed all required information.'
                : confirmation === 'suspended'
                  ? 'The tutor will lose account access and their current sessions will be revoked.'
                  : 'Account access will be restored. Verification status remains separate from account status.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={busy || (confirmation === 'approve' && !decidable)}
              onClick={() => {
                if (confirmation === 'approve') approveApp.mutate();
                else if (confirmation) statusMutation.mutate(confirmation);
              }}
            >
              {busy ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reject dialog (per-document or whole application) */}
      <Dialog
        open={reject != null}
        onOpenChange={(o) => {
          if (!o && !rejectMutation.isPending) {
            setReject(null);
            setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reject?.kind === 'doc'
                ? `Reject "${reject.label}"`
                : reject?.kind === 'flag'
                  ? 'Flag background check'
                  : 'Reject application'}
            </DialogTitle>
            <DialogDescription>
              {reject?.kind === 'doc'
                ? 'The tutor will be asked to re-upload this document.'
                : reject?.kind === 'flag'
                  ? 'The tutor stays unverified and never appears in listings. Nothing is published — the reason is visible only to the admin team and to the tutor themselves.'
                  : 'The tutor will be notified that their application needs changes.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              reject?.kind === 'flag'
                ? 'Reason for the team record (e.g. “Check returned an unspent conviction”)…'
                : 'Reason shown to the tutor (e.g. “CNIC photo is blurry — please re-scan”)…'
            }
            className="min-h-[90px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReject(null);
                setNotes('');
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            {/* A flag needs a reason: it is the only record of why someone was turned away, and an
                empty one leaves the next reviewer nothing to go on if the tutor appeals. */}
            <Button
              variant="outline"
              className="text-red-600"
              disabled={busy || !notes.trim()}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : reject?.kind === 'flag' ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {reject?.kind === 'flag' ? 'Confirm flag' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TutorFileSkeleton() {
  return (
    <div role="status" aria-label="Loading tutor file" aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading tutor details and document cards…</span>
      <div aria-hidden="true" className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-7 w-36" />
      </div>
      <div aria-hidden="true" className="space-y-5 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
      <div aria-hidden="true" className="rounded-2xl border bg-card p-5 shadow-soft">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="overflow-hidden rounded-xl border">
              <Skeleton
                className="aspect-[1.7] w-full rounded-none bg-slate-200 dark:bg-slate-700"
                shimmerClassName="via-white/90 dark:via-white/20"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function safeVideoUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function InfoField({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">
        {value}
        {detail && <span className="ml-2 text-xs text-muted-foreground">{detail}</span>}
      </dd>
    </div>
  );
}

function DocumentCard({
  slot,
  busy,
  onApprove,
  onReject,
}: {
  slot: VerificationSlot;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = (slot.status ?? 'PENDING') as DocStatus;
  const badge = DOC_BADGE[status];
  const approved = status === 'APPROVED';

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="relative aspect-[1.7] bg-secondary/40">
        {slot.kind === 'video' && youtubeIdFrom(slot.url) ? (
          // A video published to YouTube has its document repointed at the watch URL, which a
          // <video> element cannot play — it would render a dead black box. Embedded instead, so
          // a reviewer sees the same cut a visitor will.
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeIdFrom(slot.url)}`}
            title={slot.label}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : slot.kind === 'video' ? (
          <video src={slot.url} controls className="h-full w-full object-cover" />
        ) : slot.kind === 'image' ? (
          <ImageWithSkeleton
            skeletonVariant="document"
            src={slot.url}
            alt={slot.label}
            containerClassName="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="h-10 w-10" aria-hidden="true" />
            <span className="text-sm font-medium">Document attached</span>
          </div>
        )}
        <div className="absolute left-2 top-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
              badge.cls,
            )}
          >
            {approved ? (
              <Lock className="h-3 w-3" />
            ) : status === 'REJECTED' ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {badge.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{slot.label}</span>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a
              href={slot.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${slot.label} in a new tab`}
            >
              <Eye className="h-4 w-4" /> View
            </a>
          </Button>
        </div>
        {status === 'REJECTED' && slot.reviewNotes && (
          <p className="mt-1 text-xs text-red-600">{slot.reviewNotes}</p>
        )}
        {approved ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Lock className="h-3.5 w-3.5" /> Approved &amp; locked
          </p>
        ) : (
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="gradient"
              className="flex-1"
              disabled={busy}
              onClick={onApprove}
            >
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600"
              disabled={busy}
              onClick={onReject}
            >
              <X className="h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    DRAFT: { label: 'Draft', cls: 'bg-secondary text-muted-foreground', icon: FileText },
    SUBMITTED: {
      label: 'Awaiting review',
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      icon: Clock,
    },
    CHANGES_REQUESTED: {
      label: 'Changes requested',
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      icon: AlertTriangle,
    },
    APPROVED: {
      label: 'Approved',
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      icon: ShieldCheck,
    },
  };
  const m = meta[status] ?? meta.DRAFT;
  const Icon = m.icon;
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 py-0 text-xs font-semibold',
        m.cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}

function ChipList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return <InfoField label={title} value="Not provided" />;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge key={it} variant="secondary" className="font-medium">
            {it}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function CredentialList({
  title,
  items,
}: {
  title: string;
  items?: { title: string; org: string; year: string }[];
}) {
  if (!items || items.length === 0) return <InfoField label={title} value="Not provided" />;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((c, i) => (
          <li key={i} className="text-foreground/90">
            <span className="font-medium">{c.title}</span>
            {c.org && <span className="text-muted-foreground"> · {c.org}</span>}
            {c.year && <span className="text-muted-foreground"> · {c.year}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Says where a tutor's introduction video was published, and whether it is live yet.
 *
 * <p>Exists because the pipeline is asynchronous and invisible: an admin approves the video, and
 * anything from seconds to four hours later it appears somewhere else entirely. Without this,
 * the only way to answer "did it publish, and where?" was to query the database. It also
 * distinguishes the three states that look identical on the profile — still queued, published,
 * and failed — which call for waiting, nothing, and intervention respectively.
 */
function IntroVideoBanner({ intro }: { intro?: IntroVideoStatus }) {
  // No job at all: the video has not been approved yet, so there is nothing to report and a
  // banner would only add noise to a review that has not reached that step.
  if (!intro?.status) return null;

  const youtubeId = youtubeIdFrom(intro.outputUrl) ?? intro.youtubeId;
  const destination = intro.uploadMode === 'Y' || youtubeId ? 'YouTube' : 'Cloudflare R2';

  const tone =
    intro.status === 'UPLOADED'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
      : intro.status === 'FAILED'
        ? 'border-red-500/30 bg-red-500/10 text-red-700'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-700';

  return (
    <div className={cn('rounded-2xl border p-4 text-sm shadow-soft', tone)}>
      <div className="flex flex-wrap items-center gap-2">
        {intro.ready ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : intro.status === 'FAILED' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span className="font-semibold">
          {intro.ready
            ? `Introduction video published to ${destination}`
            : intro.status === 'FAILED'
              ? 'Introduction video failed to publish'
              : `Introduction video ${intro.status.toLowerCase()} — not published yet`}
        </span>
      </div>

      <p className="mt-1.5 text-xs opacity-90">
        {intro.ready
          ? 'The branded cut is live and will play on the public profile.'
          : intro.status === 'FAILED'
            ? `Failed after ${intro.attempts} attempt(s). The tutor's profile will show no video until this is resolved.`
            : 'The encoder has not picked this up yet. The public profile shows no video until it does — approving the application does not wait for it.'}
      </p>

      {intro.lastError && (
        <p className="mt-1.5 break-words font-mono text-[11px] opacity-80">{intro.lastError}</p>
      )}

      {intro.ready && (youtubeId || intro.outputUrl) && (
        <a
          href={youtubeId ? `https://youtu.be/${youtubeId}` : intro.outputUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
        >
          <VideoIcon className="h-3.5 w-3.5" />
          {youtubeId ? `Open on YouTube (${youtubeId})` : 'Open the published file'}
        </a>
      )}
    </div>
  );
}
