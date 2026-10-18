import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  MapPin,
  Wallet,
  Users,
  Loader2,
  Send,
  Check,
  X,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  jobFeedService,
  hiringPreferenceService,
  type ApplicationStatus,
  type EmploymentType,
  type MyApplication,
  type OpenJob,
} from '@/services/instituteService';
import { useCatalogs } from '@/hooks/useCatalogs';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { formatPKR, cn } from '@/lib/utils';
import { InstituteLink } from '@/components/institute/InstituteLink';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  VISITING: 'Visiting',
};

const STATUS_BADGE: Record<
  ApplicationStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  APPLIED: { label: 'Applied', variant: 'secondary' },
  SHORTLISTED: { label: 'Shortlisted', variant: 'gold' },
  ACCEPTED: { label: 'Credentials shared', variant: 'success' },
  DECLINED: { label: 'You declined', variant: 'secondary' },
  REJECTED: { label: 'Not selected', variant: 'secondary' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'secondary' },
};

const ANY = 'ANY';

export default function TutorJobs() {
  const catalogs = useCatalogs();
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [filters, setFilters] = useState<{
    cityId?: number;
    subject?: string;
    employmentType?: EmploymentType;
    page: number;
  }>({ page: 1 });
  const [applying, setApplying] = useState<OpenJob | null>(null);

  // Applying requires the same consent the teacher database does, so an opted-out teacher is told
  // that rather than shown a feed of jobs they cannot act on.
  const { data: preference, isLoading: loadingPref } = useQuery({
    queryKey: ['tutor', 'hiring-preference'],
    queryFn: () => hiringPreferenceService.get(),
  });
  const optedIn = preference?.openToInstituteRoles ?? false;

  const feed = useQuery({
    queryKey: ['tutor', 'job-feed', filters],
    queryFn: () => jobFeedService.feed({ ...filters, size: 12 }),
    enabled: optedIn && tab === 'browse',
    placeholderData: keepPreviousData,
  });

  const mine = useQuery({
    queryKey: ['tutor', 'my-applications'],
    queryFn: () => jobFeedService.myApplications(),
    enabled: optedIn,
  });

  if (loadingPref) return <LoadingState label="Loading…" />;
  if (!optedIn) return <OptInPrompt />;

  const pendingCount = (mine.data ?? []).filter((a) => a.needsResponse).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Institute jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Positions at verified schools and academies. Your contact details stay private until you
          accept an offer.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'browse' ? 'default' : 'outline'} onClick={() => setTab('browse')}>
          Browse jobs
        </Button>
        <Button variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>
          My applications
          {pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-gold-400 px-1.5 text-xs font-bold text-gold-950">
              {pendingCount}
            </span>
          )}
        </Button>
      </div>

      {tab === 'browse' ? (
        <>
          <section className="grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Select
                value={filters.subject ?? ANY}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, subject: v === ANY ? undefined : v, page: 1 }))
                }
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any subject</SelectItem>
                  {catalogs.subjects.map((s) => (
                    <SelectItem key={s.id} value={s.value}>{s.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Select
                value={filters.cityId ? String(filters.cityId) : ANY}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, cityId: v === ANY ? undefined : Number(v), page: 1 }))
                }
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any city" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any city</SelectItem>
                  {catalogs.cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role type</Label>
              <Select
                value={filters.employmentType ?? ANY}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    employmentType: v === ANY ? undefined : (v as EmploymentType),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any type</SelectItem>
                  {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {feed.isLoading && !feed.data ? (
            <LoadingState label="Loading jobs…" />
          ) : feed.isError ? (
            <ErrorState onRetry={() => feed.refetch()} message="Could not load jobs." />
          ) : !feed.data || feed.data.items.length === 0 ? (
            <Empty
              icon={Briefcase}
              title="No open jobs match those filters"
              body="Institutes post roles as they open. Try widening your subject or city."
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {feed.data.items.map((job) => (
                  <JobCard key={job.id} job={job} onApply={() => setApplying(job)} />
                ))}
              </div>
              {feed.data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feed.data.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    Page {feed.data.page} of {feed.data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feed.data.page >= feed.data.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <MyApplications
          applications={mine.data ?? []}
          loading={mine.isLoading}
          error={mine.isError}
          onRetry={() => mine.refetch()}
        />
      )}

      <ApplyDialog job={applying} onClose={() => setApplying(null)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function JobCard({ job, onApply }: { job: OpenJob; onApply: () => void }) {
  const band =
    job.salaryMin != null && job.salaryMax != null
      ? `${formatPKR(job.salaryMin)} – ${formatPKR(job.salaryMax)}`
      : job.salaryMin != null
        ? `From ${formatPKR(job.salaryMin)}`
        : job.salaryMax != null
          ? `Up to ${formatPKR(job.salaryMax)}`
          : 'Not stated';

  // Re-applying after withdrawing is allowed, so only a live application blocks the button.
  const applied = job.myStatus && job.myStatus !== 'WITHDRAWN';

  return (
    <article className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{job.title}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <InstituteLink name={job.instituteName} slug={job.instituteSlug} />
          </p>
        </div>
        {job.myStatus && (
          <Badge variant={STATUS_BADGE[job.myStatus].variant}>
            {STATUS_BADGE[job.myStatus].label}
          </Badge>
        )}
      </div>

      {job.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {job.description}
        </p>
      )}

      {job.subjects && job.subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.subjects.map((s) => (
            <Badge key={s} variant="secondary" className="font-medium">{s}</Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-sm text-muted-foreground">
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
          <Users className="h-3.5 w-3.5" /> {job.openings}
        </span>
        {job.employmentType && <span>{EMPLOYMENT_LABEL[job.employmentType]}</span>}
      </div>

      <div className="mt-auto pt-4">
        <Button
          variant={applied ? 'outline' : 'gradient'}
          className="w-full"
          onClick={onApply}
          disabled={!!applied}
        >
          {applied ? 'Already applied' : (<><Send className="h-4 w-4" /> Apply</>)}
        </Button>
      </div>
    </article>
  );
}

function ApplyDialog({ job, onClose }: { job: OpenJob | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const apply = useMutation({
    mutationFn: () => jobFeedService.apply(job!.id, note.trim() || undefined),
    onSuccess: () => {
      toast.success('Application sent', {
        description: 'The institute will be in touch through TopTutor.',
      });
      qc.invalidateQueries({ queryKey: ['tutor', 'job-feed'] });
      qc.invalidateQueries({ queryKey: ['tutor', 'my-applications'] });
      setNote('');
      onClose();
    },
    onError: (e) =>
      toast.error('Could not apply', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  return (
    <Dialog open={job !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply — {job?.title}</DialogTitle>
          <DialogDescription>
            {job?.instituteName ?? 'The institute'} sees your public profile and what you write here.
            Your phone and email stay private.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="coverNote">Message (optional)</Label>
          <textarea
            id="coverNote"
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="Why you're a good fit — the subjects and levels you've taught, and when you could start."
            className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/1000</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={() => apply.mutate()} disabled={apply.isPending}>
            {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

function MyApplications({
  applications,
  loading,
  error,
  onRetry,
}: {
  applications: MyApplication[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['tutor', 'my-applications'] });
    qc.invalidateQueries({ queryKey: ['tutor', 'job-feed'] });
  };
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      jobFeedService.respond(id, accept),
    onSuccess: (_d, v) => {
      toast.success(v.accept ? 'Credentials shared' : 'Shortlist declined');
      refresh();
    },
    onError: fail,
  });

  const withdraw = useMutation({
    mutationFn: (id: number) => jobFeedService.withdraw(id),
    onSuccess: () => {
      toast.success('Application withdrawn');
      refresh();
    },
    onError: fail,
  });

  if (loading) return <LoadingState label="Loading your applications…" />;
  if (error) return <ErrorState onRetry={onRetry} message="Could not load your applications." />;
  if (applications.length === 0) {
    return (
      <Empty
        icon={Send}
        title="You haven't applied to anything yet"
        body="Browse open jobs and apply — institutes reply through TopTutor."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((a) => (
        <article
          key={a.applicationId}
          className={cn(
            'rounded-2xl border bg-card p-5 shadow-soft',
            a.needsResponse && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold">{a.jobTitle}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <InstituteLink name={a.instituteName} slug={a.instituteSlug} />
                {a.cityName && ` · ${a.cityName}`}
              </p>
            </div>
            <Badge variant={STATUS_BADGE[a.status].variant}>{STATUS_BADGE[a.status].label}</Badge>
          </div>

          {a.instituteNote && (
            <p className="mt-3 rounded-lg border bg-secondary/40 p-3 text-sm">
              <span className="font-semibold">From the institute: </span>
              {a.instituteNote}
            </p>
          )}

          {a.needsResponse && (
            <div className="mt-4 rounded-xl border border-gold-300/70 bg-card p-4">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold">They'd like to review your credentials.</span>{' '}
                Accepting lets this institute see your verified documents. Declining keeps them
                private and ends the application.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: a.applicationId, accept: true })}
                >
                  {respond.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Share my credentials
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: a.applicationId, accept: false })}
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
              </div>
            </div>
          )}

          {(a.status === 'APPLIED' || a.status === 'ACCEPTED') && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate(a.applicationId)}
              >
                Withdraw application
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function OptInPrompt() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-soft">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-bold">Turn on institute hiring first</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Institute jobs are only shown to teachers who have opted in. You can turn it off again at
        any time.
      </p>
      <Button className="mt-5" variant="gradient" asChild>
        <Link to="/dashboard/tutor/institute-hiring">
          Open hiring settings <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Briefcase;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
