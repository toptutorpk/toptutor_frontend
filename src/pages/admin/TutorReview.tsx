import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { cn, getInitials } from '@/lib/utils';
import { toNationalDisplay } from '@/lib/phone';
import { adminService } from '@/services/adminService';
import type { DocStatus, VerificationSlot } from '@/services/verificationService';

const DOC_BADGE: Record<DocStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-secondary text-muted-foreground' },
  UNDER_REVIEW: { label: 'Under review', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
};

export default function AdminTutorReview() {
  const { id } = useParams();
  const tutorId = Number(id);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'tutor', tutorId],
    queryFn: () => adminService.tutor(tutorId),
    enabled: Number.isFinite(tutorId),
  });

  // Reject dialog target: a single document, or the whole application.
  // 'flag' shares this dialog because it needs the same thing: a reason, typed once, before an
  // irreversible-feeling decision. Only the wording and the endpoint differ.
  const [reject, setReject] = useState<
    { kind: 'doc' | 'app' | 'flag'; slotKey?: string; label?: string } | null
  >(null);
  const [notes, setNotes] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'tutor', tutorId] });
    qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const approveDoc = useMutation({
    mutationFn: (slotKey: string) => adminService.reviewDocument(tutorId, slotKey, 'APPROVE'),
    onSuccess: () => { invalidate(); toast.success('Document approved'); },
    onError: () => toast.error('Could not approve document'),
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
    onError: () => toast.error('Could not record the decision'),
  });

  const approveApp = useMutation({
    mutationFn: () => adminService.decide(tutorId, 'APPROVE'),
    onSuccess: () => { invalidate(); toast.success('Application approved — tutor verified & listed'); },
    onError: () => toast.error('Could not approve application'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card p-16 shadow-soft">
        {isError ? (
          <p className="text-sm text-muted-foreground">Tutor not found.</p>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const { summary, profile, verification } = data;
  const appStatus = verification.applicationStatus;
  const verified = verification.overallStatus === 'VERIFIED';

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Back">
          <Link to="/admin/approvals"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Review tutor</h1>
          <p className="text-sm text-muted-foreground">Verify each document, then finalise the application.</p>
        </div>
        <AppStatusBadge status={appStatus} />
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
              {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{summary.email}</span>
                {summary.phone && <span>{toNationalDisplay(summary.phone)}</span>}
                {(profile?.area || profile?.city) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {[profile?.area, profile?.city].filter(Boolean).join(', ')}
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

          {profile?.bio && <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ChipList title="Subjects" items={profile?.subjects} />
            <ChipList title="Grade levels" items={profile?.gradeLevels} />
            <ChipList title="Skills" items={profile?.skills} />
            <ChipList title="Modes" items={profile?.modes} />
          </div>

          {(profile?.education?.length || profile?.certifications?.length) ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CredentialList title="Education" items={profile?.education} />
              <CredentialList title="Certifications" items={profile?.certifications} />
            </div>
          ) : null}
        </div>
      </div>

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
                        busy={approveDoc.isPending || rejectMutation.isPending}
                        onApprove={() => approveDoc.mutate(slot.key)}
                        onReject={() => setReject({ kind: 'doc', slotKey: slot.key, label: slot.label })}
                      />
                    ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Sticky decision bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-4 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Approving the whole application verifies the tutor and locks every document.
          </p>
          <div className="flex flex-1 justify-end gap-2">
            {/* Sits beside Reject, not inside the Background step, because it decides the whole
                application: a flagged tutor is not verified regardless of their documents. */}
            <Button
              variant="outline"
              className="text-red-600"
              disabled={rejectMutation.isPending || verified}
              onClick={() => setReject({ kind: 'flag' })}
              title="Record that the criminal background check was not cleared"
            >
              <ShieldAlert className="h-4 w-4" /> Flag background check
            </Button>
            <Button
              variant="outline"
              className="text-red-600"
              disabled={rejectMutation.isPending || verified}
              onClick={() => setReject({ kind: 'app' })}
            >
              <X className="h-4 w-4" /> Reject application
            </Button>
            <Button variant="gradient" disabled={approveApp.isPending || verified} onClick={() => approveApp.mutate()}>
              {approveApp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {verified ? 'Verified' : 'Approve whole application'}
            </Button>
          </div>
        </div>
      </div>

      {/* Reject dialog (per-document or whole application) */}
      <Dialog open={reject != null} onOpenChange={(o) => { if (!o && !rejectMutation.isPending) { setReject(null); setNotes(''); } }}>
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
            <Button variant="outline" onClick={() => { setReject(null); setNotes(''); }} disabled={rejectMutation.isPending}>
              Cancel
            </Button>
            {/* A flag needs a reason: it is the only record of why someone was turned away, and an
                empty one leaves the next reviewer nothing to go on if the tutor appeals. */}
            <Button
              variant="outline"
              className="text-red-600"
              disabled={rejectMutation.isPending || (reject?.kind === 'flag' && !notes.trim())}
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
        {slot.kind === 'video' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={slot.url} controls className="h-full w-full object-cover" />
        ) : slot.kind === 'image' ? (
          <img src={slot.url} alt={slot.label} className="h-full w-full object-cover" />
        ) : (
          <a
            href={slot.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-brand-600"
          >
            <FileText className="h-8 w-8" />
            <span className="text-xs font-medium">Open document</span>
          </a>
        )}
        <div className="absolute left-2 top-2">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold', badge.cls)}>
            {approved ? <Lock className="h-3 w-3" /> : status === 'REJECTED' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {badge.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{slot.label}</span>
          <a href={slot.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-brand-600" aria-label="Open in new tab">
            {slot.kind === 'video' ? <VideoIcon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </a>
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
            <Button size="sm" variant="gradient" className="flex-1" disabled={busy} onClick={onApprove}>
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-red-600" disabled={busy} onClick={onReject}>
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
    SUBMITTED: { label: 'Awaiting review', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: Clock },
    CHANGES_REQUESTED: { label: 'Changes requested', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: AlertTriangle },
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: ShieldCheck },
  };
  const m = meta[status] ?? meta.DRAFT;
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-semibold', m.cls)}>
      <Icon className="h-4 w-4" /> {m.label}
    </span>
  );
}

function ChipList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge key={it} variant="secondary" className="font-medium">{it}</Badge>
        ))}
      </div>
    </div>
  );
}

function CredentialList({ title, items }: { title: string; items?: { title: string; org: string; year: string }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
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
