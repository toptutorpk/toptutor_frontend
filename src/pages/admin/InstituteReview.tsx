import { useState } from 'react';
import { ImageWithSkeleton } from '@/components/common/ImageWithSkeleton';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ShieldAlert,
  Check,
  Clock,
  Eye,
  FileText,
  Globe,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { cn, getInitials } from '@/lib/utils';
import {
  adminInstituteService,
  type InstituteSlot,
  type InstituteStatus,
} from '@/services/instituteService';
import type { DocStatus } from '@/services/verificationService';

/** Same treatment as the tutor review screen, so a reviewer reads one visual language. */
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

const ACCOUNT_BADGE: Record<InstituteStatus, { label: string; cls: string; icon: typeof Clock }> = {
  APPLIED: {
    label: 'Draft with institute',
    cls: 'bg-secondary text-muted-foreground',
    icon: FileText,
  },
  UNDER_REVIEW: {
    label: 'Awaiting review',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    icon: Clock,
  },
  VERIFIED: {
    label: 'Verified',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    icon: ShieldCheck,
  },
  SUSPENDED: {
    label: 'Suspended',
    cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    icon: AlertTriangle,
  },
};

/**
 * The institute counterpart of {@code AdminTutorReview}.
 *
 * <p>Deliberately the same page in a different subject: legal identity where the tutor has a
 * headline, a registration certificate where the tutor has a degree. A reviewer moves between the
 * two queues all day, and a decision as consequential as letting an organisation reach teachers'
 * contact details should not be made through a layout they have to re-learn each time.
 *
 * <p>What this replaced: a dialog listing the typed profile fields, with no sight of the uploaded
 * documents at all. Approving on that basis was approving a form rather than a file.
 */
export default function AdminInstituteReview() {
  const { id } = useParams();
  const location = useLocation();
  const requestedFrom = (location.state as { from?: unknown } | null)?.from;
  const backTo =
    typeof requestedFrom === 'string' && /^\/admin\/institutes(?:\?|$)/.test(requestedFrom)
      ? requestedFrom
      : '/admin/institutes';
  const instituteId = Number(id);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'institute', instituteId],
    queryFn: () => adminInstituteService.detail(instituteId),
    enabled: Number.isFinite(instituteId),
  });

  // One dialog for both rejections: a document and the whole application need the same thing —
  // a reason, typed once, before a decision the institute has to act on.
  const [reject, setReject] = useState<{
    kind: 'doc' | 'app';
    slotKey?: string;
    label?: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'institute', instituteId] });
    qc.invalidateQueries({ queryKey: ['admin', 'institutes'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const approveDoc = useMutation({
    mutationFn: (slotKey: string) =>
      adminInstituteService.reviewDocument(instituteId, slotKey, true),
    onSuccess: () => {
      invalidate();
      toast.success('Document approved');
    },
    onError: (e) => toast.error('Could not approve document', { description: message(e) }),
  });

  const rejectMutation = useMutation({
    // Returns void: the two branches resolve to different shapes (a slot vs the profile) and
    // neither is used — the query is refetched either way.
    mutationFn: async (): Promise<void> => {
      if (reject?.kind === 'doc') {
        await adminInstituteService.reviewDocument(
          instituteId,
          reject.slotKey as string,
          false,
          notes.trim(),
        );
        return;
      }
      await adminInstituteService.decide(instituteId, false, notes.trim());
    },
    onSuccess: () => {
      invalidate();
      toast.success(reject?.kind === 'doc' ? 'Document rejected' : 'Sent back for corrections');
      setReject(null);
      setNotes('');
    },
    onError: (e) => toast.error('Could not record the decision', { description: message(e) }),
  });

  const approveApp = useMutation({
    mutationFn: () => adminInstituteService.decide(instituteId, true),
    onSuccess: () => {
      invalidate();
      toast.success('Institute verified — hiring access enabled');
    },
    onError: (e) => toast.error('Could not approve the institute', { description: message(e) }),
  });

  const suspendAccount = useMutation({
    mutationFn: () => adminInstituteService.suspend(instituteId, suspendReason.trim()),
    onSuccess: () => {
      invalidate();
      setSuspending(false);
      setSuspendReason('');
      toast.success('Institute suspended');
    },
    onError: (e) => toast.error('Could not suspend institute', { description: message(e) }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card p-16 shadow-soft">
        {isError ? (
          <p className="text-sm text-muted-foreground">Institute not found.</p>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const { profile, verification } = data;
  const status = profile.status;
  const badge = ACCOUNT_BADGE[status] ?? ACCOUNT_BADGE.APPLIED;
  const BadgeIcon = badge.icon;
  const busy =
    approveDoc.isPending ||
    rejectMutation.isPending ||
    approveApp.isPending ||
    suspendAccount.isPending;
  // Only an institute that has actually submitted can be decided on; the service enforces this
  // too, but a disabled button explains it better than a 409 does.
  const decidable = status === 'UNDER_REVIEW';
  const withDocuments = verification.steps.filter((s) => s.slots.some((sl) => sl.url));

  return (
    <div className={cn('space-y-5', decidable && 'pb-24')}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Back">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Review institute</h1>
          <p className="text-sm text-muted-foreground">
            Check each document against the legal identity, then finalise.
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold',
            badge.cls,
          )}
        >
          <BadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>

      {/* ---- Identity card -------------------------------------------------- */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        {profile.coverUrl && (
          <div className="h-28 w-full overflow-hidden bg-secondary">
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20 rounded-xl">
              <AvatarImage
                src={profile.logoUrl}
                alt={profile.displayName ?? 'Institute'}
                className="object-contain"
              />
              <AvatarFallback className="rounded-xl text-xl">
                {getInitials(profile.displayName || profile.legalName || 'IN')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">
                  {profile.displayName || profile.legalName || 'Unnamed institute'}
                </h2>
                {status === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                {profile.entityType && <Badge variant="secondary">{profile.entityType}</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {(profile.area || profile.cityName) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[profile.area, profile.cityName].filter(Boolean).join(', ')}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 hover:text-brand-600"
                  >
                    <Globe className="h-3.5 w-3.5" /> {profile.website}
                  </a>
                )}
                {profile.studentCount != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {profile.studentCount} students
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.about && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.about}</p>
          )}

          {/* The fields the documents are checked against. Grouped the way the institute filled
              them in, so a mismatch between the certificate and the form is easy to spot. */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FieldGroup title="Legal identity" icon={Building2}>
              <Field label="Legal name" value={profile.legalName} />
              <Field label="Entity type" value={profile.entityType} />
              <Field label="Registration no." value={profile.registrationNo} />
              <Field label="Regulator" value={profile.regulator} />
            </FieldGroup>

            <FieldGroup title="Authorised signatory" icon={ShieldCheck}>
              <Field label="Name" value={profile.contactPerson} />
              <Field label="Designation" value={profile.contactDesignation} />
              <Field label="CNIC" value={profile.contactCnic} />
            </FieldGroup>

            <FieldGroup title="Campus" icon={MapPin}>
              <Field label="Campus name" value={profile.campusName} />
              <Field label="City" value={profile.cityName} />
              <Field label="Area" value={profile.area} />
              <Field label="Address" value={profile.address} />
            </FieldGroup>

            <FieldGroup title="Timeline" icon={Clock}>
              <Field label="Submitted" value={formatDate(profile.submittedAt)} />
              <Field label="Verified" value={formatDate(profile.verifiedAt)} />
            </FieldGroup>
          </div>

          {profile.statusNotes && (
            <p className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="font-semibold">Last note to the institute: </span>
              {profile.statusNotes}
            </p>
          )}
        </div>
      </div>

      {/* ---- Documents ------------------------------------------------------ */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold">Documents</h2>
        {withDocuments.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-soft">
            <FileText className="h-4 w-4" /> This institute hasn’t uploaded any documents yet.
          </div>
        ) : (
          withDocuments.map((step) => (
            <div key={step.key} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{step.title}</h3>
                {step.notes && <span className="text-xs text-red-600">{step.notes}</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {step.slots
                  .filter((sl) => sl.url)
                  .map((slot) => (
                    <DocumentCard
                      key={slot.key}
                      slot={slot}
                      busy={busy}
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

      {/* ---- Sticky decision bar -------------------------------------------- */}
      {decidable && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-4 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {decidable
                ? 'Approving verifies the institute, locks every document and enables hiring.'
                : status === 'APPLIED'
                  ? 'This institute has not submitted yet — there is nothing to decide.'
                  : `This institute is ${badge.label.toLowerCase()}.`}
            </p>
            <div className="flex flex-1 justify-end gap-2">
              <Button
                variant="outline"
                className="text-red-600"
                disabled={busy || !decidable}
                onClick={() => setReject({ kind: 'app' })}
              >
                <X className="h-4 w-4" /> Send back
              </Button>
              <Button
                variant="gradient"
                disabled={busy || !decidable}
                onClick={() => approveApp.mutate()}
              >
                {approveApp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve institute
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === 'VERIFIED' && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div>
            <h2 className="font-display text-lg font-bold">Account actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Suspend this institute’s hiring access when account intervention is required.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
            disabled={busy}
            onClick={() => setSuspending(true)}
          >
            <ShieldAlert className="h-4 w-4" /> Suspend account
          </Button>
        </section>
      )}

      <Dialog
        open={suspending}
        onOpenChange={(open) => {
          if (!open && !suspendAccount.isPending) {
            setSuspending(false);
            setSuspendReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend institute account?</DialogTitle>
            <DialogDescription>
              This withdraws the institute’s hiring access. Provide a reason that the institute can
              see.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="institute-suspend-reason" className="text-sm font-medium">
            Reason
          </label>
          <Textarea
            id="institute-suspend-reason"
            rows={4}
            maxLength={500}
            value={suspendReason}
            disabled={suspendAccount.isPending}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Explain why hiring access is being withdrawn."
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={suspendAccount.isPending}
              onClick={() => {
                setSuspending(false);
                setSuspendReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !suspendReason.trim() || status !== 'VERIFIED'}
              onClick={() => suspendAccount.mutate()}
            >
              {suspendAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Suspend
              account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Rejection dialog ------------------------------------------------ */}
      <Dialog
        open={reject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReject(null);
            setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reject?.kind === 'doc' ? `Reject ${reject.label}` : 'Send back for corrections'}
            </DialogTitle>
            <DialogDescription>
              {reject?.kind === 'doc'
                ? 'The institute can replace this document and submit again.'
                : 'The institute returns to draft and can re-upload. Say what needs fixing.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              reject?.kind === 'doc'
                ? 'e.g. The certificate is cut off — please upload the full page.'
                : 'e.g. The legal name on the certificate does not match the profile.'
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReject(null);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            {/* The server refuses a reason-less rejection; disabling here says so sooner. */}
            <Button
              variant="destructive"
              disabled={!notes.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reject?.kind === 'doc' ? 'Reject document' : 'Send back'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DocumentCard({
  slot,
  busy,
  onApprove,
  onReject,
}: {
  slot: InstituteSlot;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = (slot.status ?? 'PENDING') as DocStatus;
  const badge = DOC_BADGE[status] ?? DOC_BADGE.PENDING;
  const approved = status === 'APPROVED';

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="relative aspect-[1.7] bg-secondary/40">
        {slot.kind === 'image' ? (
          slot.key.includes('cnic') ? (
            <ImageWithSkeleton
              skeletonVariant="document"
              src={slot.url}
              alt={slot.label}
              containerClassName="h-full w-full"
            />
          ) : (
            <img src={slot.url} alt={slot.label} className="h-full w-full object-cover" />
          )
        ) : (
          <a
            href={slot.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-brand-600"
          >
            <FileText className="h-8 w-8" />
            <span className="text-xs font-medium">Open document</span>
          </a>
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
              rel="noreferrer noopener"
              aria-label={`View ${slot.label} in a new tab`}
            >
              <Eye className="h-4 w-4" /> View
            </a>
          </Button>
        </div>
        {/* An expiring document is only as good as its date, so the reviewer sees it here rather
            than having to open the file to find out it lapsed last year. */}
        {slot.expiresAt && (
          <p
            className={cn(
              'mt-1 text-xs',
              isPast(slot.expiresAt) ? 'font-medium text-red-600' : 'text-muted-foreground',
            )}
          >
            {isPast(slot.expiresAt) ? 'Expired ' : 'Expires '}
            {slot.expiresAt}
          </p>
        )}
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

function FieldGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-secondary/20 p-4">
      <h3 className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      {/* A blank required field is itself a review finding, so it is marked rather than hidden. */}
      <dd className={cn('min-w-0 break-words', value ? 'font-medium' : 'text-muted-foreground')}>
        {value || 'Not provided'}
      </dd>
    </div>
  );
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString();
}

function isPast(isoDate: string): boolean {
  const d = new Date(isoDate);
  return !Number.isNaN(d.getTime()) && d < new Date();
}

function message(e: unknown): string | undefined {
  return e instanceof Error ? e.message : undefined;
}
