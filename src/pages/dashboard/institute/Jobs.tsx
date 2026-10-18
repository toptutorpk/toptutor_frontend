import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Loader2,
  Send,
  XCircle,
  CheckCircle2,
  Trash2,
  Pencil,
  Briefcase,
  Lock,
  ArrowRight,
  MapPin,
  Wallet,
  Users,
  FileText,
} from 'lucide-react';
import {
  instituteService,
  jobPostService,
  type EmploymentType,
  type JobPost,
  type SaveJobPost,
  applicantService,
  type Applicant,
} from '@/services/instituteService';
import { format } from 'date-fns';
import { useCatalogs } from '@/hooks/useCatalogs';
import { ApiError } from '@/api/client';
import { DatePicker } from '@/components/ui/date-picker';
import { SubjectPicker } from '@/components/tutor/SubjectPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPKR, getInitials, cn, noNegative } from '@/lib/utils';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  VISITING: 'Visiting',
};

const ANY = 'ANY';
const QUERY_KEY = ['institute', 'jobs'] as const;

/** Mirrors the server's cap in JobPostServiceImpl, so the form refuses before the request does. */
const MAX_SUBJECTS = 20;

/**
 * Today, in the viewer's own timezone.
 *
 * <p>Not `toISOString().slice(0, 10)`: that converts to UTC first and, east of Greenwich, returns
 * yesterday for the first hours of every day — which would let a role be dated before today.
 */
const today = () => format(new Date(), 'yyyy-MM-dd');

export default function InstituteJobs() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<JobPost | 'new' | null>(null);
  const [viewingApplicants, setViewingApplicants] = useState<JobPost | null>(null);

  const { data: verification, isLoading: loadingStatus } = useQuery({
    queryKey: ['institute', 'verification'],
    queryFn: () => instituteService.getVerification(),
  });
  const canHire = verification?.canHire ?? false;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => jobPostService.list(),
  });

  if (loadingStatus || isLoading) return <LoadingState label="Loading your jobs…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} message="Could not load your jobs." />;

  const jobs = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Job posts</h1>
          <p className="mt-1 text-muted-foreground">
            Advertise a position and let verified teachers come to you.
          </p>
        </div>
        <Button variant="gradient" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New job post
        </Button>
      </div>

      {/* Drafting is allowed before verification — writing an advert harms nobody, and having one
          ready is a reason to finish registering. Only publishing is gated. */}
      {!canHire && <UnverifiedNotice status={verification?.accountStatus} />}

      {jobs.length === 0 ? (
        <EmptyState onCreate={() => setEditing('new')} />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              canHire={canHire}
              onEdit={() => setEditing(job)}
              onViewApplicants={() => setViewingApplicants(job)}
            />
          ))}
        </div>
      )}

      <JobDialog
        job={editing}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: QUERY_KEY })}
      />

      <ApplicantsDialog job={viewingApplicants} onClose={() => setViewingApplicants(null)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Applicants                                                                 */
/* -------------------------------------------------------------------------- */

const APPLICANT_BADGE: Record<
  Applicant['status'],
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  APPLIED: { label: 'New', variant: 'secondary' },
  SHORTLISTED: { label: 'Awaiting their consent', variant: 'gold' },
  ACCEPTED: { label: 'Credentials shared', variant: 'success' },
  DECLINED: { label: 'They declined', variant: 'secondary' },
  REJECTED: { label: 'Declined', variant: 'secondary' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'secondary' },
};

function ApplicantsDialog({ job, onClose }: { job: JobPost | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'applicants', job?.id],
    queryFn: () => applicantService.forJob(job!.id),
    enabled: job !== null,
  });

  // Only new applications can be decided in bulk, so the selection is confined to them — a
  // checkbox on a row the action would refuse is a promise the screen cannot keep.
  const [selected, setSelected] = useState<number[]>([]);
  const decidable = (data ?? []).filter((a) => a.status === 'APPLIED');

  // A batch that succeeds leaves stale ids behind; clearing on every reload keeps the bar honest.
  useEffect(() => {
    setSelected((ids) => ids.filter((id) => decidable.some((a) => a.applicationId === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const toggle = (id: number) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['institute', 'applicants', job?.id] });
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  };
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const shortlist = useMutation({
    mutationFn: (id: number) => applicantService.shortlist(id),
    onSuccess: () => {
      toast.success('Shortlisted', {
        description: "We've asked them to share their credentials.",
      });
      refresh();
    },
    onError: fail,
  });
  const reject = useMutation({
    mutationFn: (id: number) => applicantService.reject(id),
    onSuccess: () => {
      toast.success('Applicant declined');
      refresh();
    },
    onError: fail,
  });

  const bulk = useMutation({
    mutationFn: (vars: { ids: number[]; shortlist: boolean }) =>
      applicantService.decideAll(vars.ids, vars.shortlist),
    onSuccess: (result, vars) => {
      const done = result.updated.length;
      const verb = vars.shortlist ? 'Shortlisted' : 'Declined';
      if (done === 0) {
        // Every one was skipped. Saying "Declined 0 applicants" would read as success.
        toast.error('Nothing changed', { description: result.skipped[0]?.reason });
      } else {
        toast.success(`${verb} ${done} ${done === 1 ? 'applicant' : 'applicants'}`, {
          description:
            result.skipped.length > 0
              ? `${result.skipped.length} skipped — ${result.skipped[0].reason}`
              : vars.shortlist
                ? "We've asked them to share their credentials."
                : undefined,
        });
      }
      setSelected([]);
      refresh();
    },
    onError: fail,
  });

  const busy = shortlist.isPending || reject.isPending || bulk.isPending;

  return (
    <Dialog open={job !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Applicants — {job?.title}</DialogTitle>
          <DialogDescription>
            Shortlisting asks the teacher to share their verified documents. They see them only
            after the teacher agrees.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState label="Loading applicants…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} message="Could not load applicants." />
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
            No applications yet. Teachers see this job in their feed as soon as it is live.
          </div>
        ) : (
          <div className="space-y-3">
            {decidable.length > 1 && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 backdrop-blur">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.length === decidable.length && decidable.length > 0}
                    onCheckedChange={(v) =>
                      setSelected(v === true ? decidable.map((a) => a.applicationId) : [])
                    }
                  />
                  {selected.length > 0 ? (
                    <span className="font-medium">
                      {selected.length} of {decidable.length} selected
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select all {decidable.length} new applicants
                    </span>
                  )}
                </label>
                {selected.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={busy}
                      onClick={() => bulk.mutate({ ids: selected, shortlist: true })}
                    >
                      {bulk.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Shortlist {selected.length}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => bulk.mutate({ ids: selected, shortlist: false })}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Decline {selected.length}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {data.map((a) => (
              <div key={a.applicationId} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {a.status === 'APPLIED' && decidable.length > 1 && (
                      <Checkbox
                        className="mt-1 shrink-0"
                        checked={selected.includes(a.applicationId)}
                        onCheckedChange={() => toggle(a.applicationId)}
                        aria-label={`Select ${a.name}`}
                      />
                    )}
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={a.photoUrl} alt={a.name} />
                      <AvatarFallback>{getInitials(a.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-semibold leading-tight">{a.name}</h4>
                      {a.headline && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {a.headline}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {a.experienceYears != null && <span>{a.experienceYears} yrs</span>}
                        {a.city && <span>{a.city}</span>}
                        {a.rating != null && <span>★ {a.rating} ({a.reviewCount})</span>}
                        {a.expectedSalaryMin != null && (
                          <span>Expects from {formatPKR(a.expectedSalaryMin)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={APPLICANT_BADGE[a.status].variant}>
                    {APPLICANT_BADGE[a.status].label}
                  </Badge>
                </div>

                {a.coverNote && (
                  <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">
                    {a.coverNote}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tutors/${a.slug}`} target="_blank" rel="noreferrer">
                      View profile
                    </Link>
                  </Button>

                  {a.status === 'APPLIED' && (
                    <>
                      <Button
                        size="sm"
                        variant="gradient"
                        disabled={busy}
                        onClick={() => shortlist.mutate(a.applicationId)}
                      >
                        {shortlist.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => reject.mutate(a.applicationId)}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </Button>
                    </>
                  )}

                  {a.credentialsUnlocked && <CredentialsButton applicationId={a.applicationId} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

const STATUS_BADGE: Record<
  JobPost['status'],
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PUBLISHED: { label: 'Live', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
  FILLED: { label: 'Filled', variant: 'gold' },
};

function JobRow({
  job,
  canHire,
  onEdit,
  onViewApplicants,
}: {
  job: JobPost;
  canHire: boolean;
  onEdit: () => void;
  onViewApplicants: () => void;
}) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: QUERY_KEY });
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const publish = useMutation({
    mutationFn: () => jobPostService.publish(job.id),
    onSuccess: () => {
      toast.success('Your job is live');
      refresh();
    },
    onError: fail,
  });
  const close = useMutation({
    mutationFn: () => jobPostService.close(job.id),
    onSuccess: () => {
      toast.success('Job closed');
      refresh();
    },
    onError: fail,
  });
  const filled = useMutation({
    mutationFn: () => jobPostService.markFilled(job.id),
    onSuccess: () => {
      toast.success('Marked as filled');
      refresh();
    },
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: () => jobPostService.remove(job.id),
    onSuccess: () => {
      toast.success('Draft deleted');
      refresh();
    },
    onError: fail,
  });

  const busy =
    publish.isPending || close.isPending || filled.isPending || remove.isPending;
  const badge = STATUS_BADGE[job.status];
  const band =
    job.salaryMin != null && job.salaryMax != null
      ? `${formatPKR(job.salaryMin)} – ${formatPKR(job.salaryMax)}`
      : job.salaryMin != null
        ? `From ${formatPKR(job.salaryMin)}`
        : job.salaryMax != null
          ? `Up to ${formatPKR(job.salaryMax)}`
          : 'Not stated';

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold">{job.title}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {job.expired && <Badge variant="destructive">Past closing date</Badge>}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> {band}
            </span>
            {(job.cityName || job.area) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {[job.area, job.cityName].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {job.openings}{' '}
              {job.openings === 1 ? 'opening' : 'openings'}
            </span>
            {job.employmentType && <span>{EMPLOYMENT_LABEL[job.employmentType]}</span>}
            {job.closesOn && <span>Closes {new Date(job.closesOn).toLocaleDateString()}</span>}
          </div>

          {job.subjects && job.subjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.subjects.map((s) => (
                <Badge key={s} variant="secondary" className="font-medium">{s}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {job.status !== 'DRAFT' && (
            <Button size="sm" variant="outline" onClick={onViewApplicants} disabled={busy}>
              <Users className="h-3.5 w-3.5" /> Applicants
              {job.applicantCount > 0 && (
                <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                  {job.applicantCount}
                </span>
              )}
            </Button>
          )}

          {job.status !== 'FILLED' && (
            <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}

          {job.status === 'DRAFT' && (
            <>
              <Button
                size="sm"
                variant="gradient"
                onClick={() => publish.mutate()}
                disabled={busy || !canHire}
                title={canHire ? undefined : 'Verify your institute to publish'}
              >
                {publish.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Publish
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Delete draft"
                onClick={() => remove.mutate()}
                disabled={busy}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {job.status === 'PUBLISHED' && (
            <>
              <Button size="sm" variant="outline" onClick={() => filled.mutate()} disabled={busy}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Filled
              </Button>
              <Button size="sm" variant="outline" onClick={() => close.mutate()} disabled={busy}>
                <XCircle className="h-3.5 w-3.5" /> Close
              </Button>
            </>
          )}

          {job.status === 'CLOSED' && (
            <Button size="sm" variant="outline" onClick={() => publish.mutate()} disabled={busy || !canHire}>
              <Send className="h-3.5 w-3.5" /> Re-open
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

interface FormState {
  title: string;
  description: string;
  employmentType: string;
  subjects: string[];
  gradeLevels: string[];
  cityId: string;
  area: string;
  salaryMin: string;
  salaryMax: string;
  openings: string;
  startsOn: string;
  closesOn: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  employmentType: '',
  subjects: [],
  gradeLevels: [],
  cityId: '',
  area: '',
  salaryMin: '',
  salaryMax: '',
  openings: '1',
  startsOn: '',
  closesOn: '',
};

function JobDialog({
  job,
  onClose,
  onSaved,
}: {
  job: JobPost | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const catalogs = useCatalogs();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const isNew = job === 'new';

  useEffect(() => {
    if (job === null) return;
    if (job === 'new') {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      title: job.title,
      description: job.description ?? '',
      employmentType: job.employmentType ?? '',
      subjects: job.subjects ?? [],
      gradeLevels: job.gradeLevels ?? [],
      cityId: job.cityId ? String(job.cityId) : '',
      area: job.area ?? '',
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
      openings: String(job.openings ?? 1),
      startsOn: job.startsOn ?? '',
      closesOn: job.closesOn ?? '',
    });
  }, [job]);

  const save = useMutation({
    mutationFn: (payload: SaveJobPost) =>
      isNew ? jobPostService.create(payload) : jobPostService.update((job as JobPost).id, payload),
    onSuccess: () => {
      toast.success(isNew ? 'Draft saved' : 'Job post saved');
      onSaved();
      onClose();
    },
    onError: (e) =>
      toast.error('Could not save', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const text = (v: string) => (v.trim() === '' ? undefined : v.trim());

  /**
   * What is wrong with the form, or null.
   *
   * <p>Checked here as well as on the server. The server is the authority, but a round trip to be
   * told the salary range is upside-down is a poor way to learn it, and these are the mistakes
   * that are easy to make in a form this wide.
   */
  const salaryProblem = (() => {
    const min = num(form.salaryMin);
    const max = num(form.salaryMax);
    if (min != null && (!Number.isFinite(min) || min < 0)) return 'Salary cannot be negative.';
    if (max != null && (!Number.isFinite(max) || max < 0)) return 'Salary cannot be negative.';
    if (min != null && max != null && min > max) {
      return 'The lower end of the range is above the upper end.';
    }
    return null;
  })();

  const dateProblem =
    form.startsOn && form.closesOn && form.closesOn > form.startsOn
      ? 'Applications cannot close after the role has started.'
      : null;

  const openingsProblem = (() => {
    const n = num(form.openings);
    if (n == null) return null;
    if (!Number.isInteger(n) || n < 1) return 'Openings must be a whole number of at least 1.';
    if (n > 500) return 'Openings must be at most 500.';
    return null;
  })();

  const titleProblem = form.title.trim() ? null : 'A title is required.';
  const subjectsProblem =
    form.subjects.length > MAX_SUBJECTS ? `At most ${MAX_SUBJECTS} subjects.` : null;

  const problem =
    titleProblem ?? salaryProblem ?? dateProblem ?? openingsProblem ?? subjectsProblem;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // A draft is allowed to be incomplete — that is what a draft is for — but never contradictory.
    if (problem) {
      toast.error('Check the form', { description: problem });
      return;
    }
    save.mutate({
      title: form.title.trim(),
      description: text(form.description),
      employmentType: (text(form.employmentType) as EmploymentType | undefined) ?? undefined,
      subjects: form.subjects,
      gradeLevels: form.gradeLevels,
      cityId: num(form.cityId),
      area: text(form.area),
      salaryMin: num(form.salaryMin),
      salaryMax: num(form.salaryMax),
      openings: num(form.openings),
      startsOn: text(form.startsOn),
      closesOn: text(form.closesOn),
    });
  };

  const toggle = (key: 'subjects' | 'gradeLevels', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  return (
    <Dialog open={job !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New job post' : 'Edit job post'}</DialogTitle>
          <DialogDescription>
            Saved as a draft. You choose when it goes live — and the salary and subjects are only
            required at that point.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="title">Role title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              placeholder="O-Level Physics Teacher"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              placeholder="What the role involves, the timetable, and what you are looking for."
              className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* The same picker the tutor profile uses, rather than every subject in the catalogue
              rendered as a wall of chips — that worked at ten subjects and is unusable at three
              hundred. `allowCustom` is the institute-only addition: they hire for roles the public
              taxonomy does not name, and those are stored against this post rather than added to
              the catalogue everyone else searches. */}
          <div className="space-y-1.5">
            <Label>Subjects</Label>
            <SubjectPicker
              selected={form.subjects}
              onChange={(subjects) => setForm((f) => ({ ...f, subjects }))}
              allowCustom
            />
          </div>

          <Chips
            label="Grade levels"
            options={catalogs['grade-levels'].map((g) => g.value)}
            selected={form.gradeLevels}
            onToggle={(v) => toggle('gradeLevels', v)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="employmentType">Role type</Label>
              <Select value={form.employmentType || ANY} onValueChange={(v) => set('employmentType')(v === ANY ? '' : v)}>
                <SelectTrigger id="employmentType" className="mt-1.5">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Not specified</SelectItem>
                  {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cityId">City</Label>
              <Select value={form.cityId || ANY} onValueChange={(v) => set('cityId')(v === ANY ? '' : v)}>
                <SelectTrigger id="cityId" className="mt-1.5">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Not specified</SelectItem>
                  {catalogs.cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Text id="area" label="Area" value={form.area} onChange={set('area')} placeholder="DHA Phase 5" />
            {/* Raised to 1: a posting advertising zero openings is not a posting. */}
            <Text id="openings" label="Openings" type="number" min={1} value={form.openings} onChange={set('openings')} />
            <Text id="salaryMin" label="Salary from (PKR/month)" type="number" value={form.salaryMin} onChange={set('salaryMin')} placeholder="40000" />
            <Text id="salaryMax" label="…up to (PKR/month)" type="number" value={form.salaryMax} onChange={set('salaryMax')} placeholder="70000" />
            {/* The app's own picker, as on the CNIC issue date. Both are future dates, so each
                floors at today — a role starting last month or applications closing yesterday is
                a typo, and the server refuses a past closing date on publish anyway. */}
            <div className="space-y-1.5">
              <Label htmlFor="startsOn">Role starts</Label>
              <DatePicker
                id="startsOn"
                value={form.startsOn}
                min={today()}
                onChange={set('startsOn')}
                placeholder="Select a start date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closesOn">Applications close</Label>
              <DatePicker
                id="closesOn"
                value={form.closesOn}
                min={today()}
                // Applications cannot still be open after the role has begun.
                max={form.startsOn || undefined}
                onChange={set('closesOn')}
                placeholder="Select a closing date"
                invalid={Boolean(dateProblem)}
              />
            </div>
          </div>

          {/* Stated above the button rather than only in a toast on submit, so a contradiction is
              visible while it is still being made. */}
          {problem && !titleProblem && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {problem}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={save.isPending || Boolean(problem)}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save draft
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                on
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'text-muted-foreground hover:border-brand-200 hover:text-foreground',
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Opens the teacher's released documents.
 *
 * <p>Fetched on click rather than with the applicant list: most applicants have not unlocked
 * anything, and pulling every teacher's document URLs to render one button would hand the client
 * files it has no reason to hold.
 */
function CredentialsButton({ applicationId }: { applicationId: number }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'credentials', applicationId],
    queryFn: () => applicantService.credentials(applicationId),
    enabled: open,
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileText className="h-3.5 w-3.5" /> Credentials
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verified credentials</DialogTitle>
            <DialogDescription>
              Shared by the teacher when they accepted your shortlist. Only documents our team has
              approved appear here.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <LoadingState label="Loading documents…" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} message="Could not load documents." />
          ) : !data || data.length === 0 ? (
            <p className="rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
              This teacher has no approved documents on file yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((c) => (
                <li key={c.slotKey}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm transition-colors hover:border-brand-200"
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" /> {c.label}
                    </span>
                    <span className="text-xs text-primary">Open</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Renders both text and number fields. Every number field it is given here — openings and the
  // two salary bounds — is a quantity that cannot be negative, so the floor is applied centrally
  // rather than at each call site, and `min` is spread before `props` so a call site can still
  // raise it. `min` alone constrains only the spinner, so the minus is also dropped as typed.
  const numeric = props.type === 'number';
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        {...(numeric ? { min: 0, inputMode: 'numeric' as const } : {})}
        value={value}
        onChange={(e) => onChange(numeric ? noNegative(e.target.value) : e.target.value)}
        className="mt-1.5"
        {...props}
      />
    </div>
  );
}

function UnverifiedNotice({ status }: { status?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex min-w-0 items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">You can write drafts now.</span>{' '}
          {status === 'UNDER_REVIEW'
            ? 'Publishing opens as soon as our team approves your institute.'
            : 'Finish verification to publish them where teachers can apply.'}
        </p>
      </div>
      <Button size="sm" variant="outline" asChild>
        <Link to="/dashboard/institute/registration">
          Registration <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Briefcase className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-bold">No job posts yet</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        Write one advert and verified teachers apply to you, instead of approaching them one at a
        time.
      </p>
      <Button className="mt-5" variant="gradient" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create your first job post
      </Button>
    </div>
  );
}
