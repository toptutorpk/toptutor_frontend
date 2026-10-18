import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileSignature,
  Briefcase,
  Users,
  Handshake,
  Wallet,
  Inbox,
} from 'lucide-react';
import {
  instituteService,
  jobPostService,
  hiringService,
  type JobPost,
  type Offer,
  type Placement,
  type Billing,
} from '@/services/instituteService';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { cn, formatPKR, pluralize } from '@/lib/utils';

/**
 * The institute's landing screen.
 *
 * <p>Two different pages share this file, because an institute before and after verification needs
 * opposite things. Unverified, there is nothing to summarise and one thing to do, so it stays a
 * single call to action rather than a dashboard of zeroes. Verified, it becomes a real overview:
 * what is waiting on them, what their hiring looks like, and a way into every part of the portal.
 *
 * <p>The summary queries are gated on {@code canHire} rather than fired always. An unverified
 * institute has no jobs, offers or plan to read, and asking anyway would be four requests whose
 * only possible answer is empty — or a 403.
 */
export default function InstituteOverview() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'verification'],
    queryFn: () => instituteService.getVerification(),
  });
  const { data: profile } = useQuery({
    queryKey: ['institute', 'profile'],
    queryFn: () => instituteService.getProfile(),
  });

  const canHire = Boolean(data?.canHire);
  const { data: jobs } = useQuery({
    queryKey: ['institute', 'jobs'],
    queryFn: () => jobPostService.list(),
    enabled: canHire,
  });
  const { data: offers } = useQuery({
    queryKey: ['institute', 'offers'],
    queryFn: () => hiringService.offers(),
    enabled: canHire,
  });
  const { data: placements } = useQuery({
    queryKey: ['institute', 'placements'],
    queryFn: () => hiringService.placements(),
    enabled: canHire,
  });
  const { data: billing } = useQuery({
    queryKey: ['institute', 'billing'],
    queryFn: () => hiringService.billing(),
    enabled: canHire,
  });

  if (isLoading) return <LoadingState label="Loading your dashboard…" />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Could not load your dashboard." />;
  }

  const name = profile?.displayName || profile?.legalName || 'your institute';
  const remaining = data.totalSteps - data.completedCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome, {name}</h1>
        <p className="mt-1 text-muted-foreground">
          {canHire
            ? 'Your institute is verified. Here is where your hiring stands.'
            : 'Finish verification to unlock the teacher database.'}
        </p>
      </div>

      <StatusCard view={data} remaining={remaining} />

      {canHire ? (
        <VerifiedOverview
          jobs={jobs}
          offers={offers}
          placements={placements}
          billing={billing}
        />
      ) : (
        // Before verification both capabilities are walls, so they are shown as walls. Linking
        // them would land the institute on a screen that only tells them to come back later.
        <div className="grid gap-4 sm:grid-cols-2">
          <LockedCard
            icon={Search}
            title="Find teachers"
            body="Search verified teachers by subject, city, salary and availability."
            unlocked={false}
          />
          <LockedCard
            icon={FileSignature}
            title="Post a job"
            body="Advertise a position and receive applications from verified teachers."
            unlocked={false}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Everything that only means something once the institute can hire.
 *
 * <p>Ordered by what the institute has to do about it: the numbers first, then the things waiting
 * on them, then the ways in, then the plan. A dashboard that opens with billing is a dashboard
 * nobody reads twice.
 */
function VerifiedOverview({
  jobs,
  offers,
  placements,
  billing,
}: {
  jobs?: JobPost[];
  offers?: Offer[];
  placements?: Placement[];
  billing?: Billing;
}) {
  // `undefined` means the query is still in flight; `[]` means it answered and there is nothing.
  // The tiles tell those apart so a loading dashboard never claims a confident zero.
  const loading = !jobs || !offers || !placements;

  const openJobs = (jobs ?? []).filter((j) => j.status === 'PUBLISHED' && !j.expired);
  const drafts = (jobs ?? []).filter((j) => j.status === 'DRAFT');
  const lapsed = (jobs ?? []).filter((j) => j.status === 'PUBLISHED' && j.expired);
  const applicants = openJobs.reduce((sum, j) => sum + j.applicantCount, 0);
  const awaitingReply = (offers ?? []).filter((o) => o.status === 'OFFERED' && !o.expired);
  const toConfirm = (placements ?? []).filter((p) => p.awaitingMe);
  const active = (placements ?? []).filter((p) => p.status === 'ACTIVE');

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Briefcase}
          label="Open roles"
          value={openJobs.length}
          loading={loading}
          to="/dashboard/institute/jobs"
          hint={drafts.length ? `${drafts.length} draft${drafts.length > 1 ? 's' : ''}` : undefined}
        />
        <Stat
          icon={Inbox}
          label="Applicants"
          value={applicants}
          loading={loading}
          to="/dashboard/institute/jobs"
          hint={applicants ? 'across your open roles' : undefined}
          emphasis={applicants > 0}
        />
        <Stat
          icon={Handshake}
          label="Offers out"
          value={awaitingReply.length}
          loading={loading}
          to="/dashboard/institute/hiring"
          hint={awaitingReply.length ? 'awaiting a reply' : undefined}
        />
        <Stat
          icon={Users}
          label="Teachers placed"
          value={active.length}
          loading={loading}
          to="/dashboard/institute/hiring"
          hint={toConfirm.length ? `${toConfirm.length} to confirm` : undefined}
          emphasis={toConfirm.length > 0}
        />
      </div>

      <AttentionList
        applicants={applicants}
        openRoles={openJobs.length}
        drafts={drafts.length}
        lapsed={lapsed.length}
        toConfirm={toConfirm.length}
        outstanding={billing?.outstanding ?? 0}
      />

      <section>
        <h2 className="font-display font-bold">What would you like to do?</h2>
        {/* The two ways a hire actually starts. Everything else an institute can do — offers,
            payroll, messages, profile — is a step inside a hire rather than a way to begin one,
            and already has a permanent home in the sidebar; repeating it here turned the section
            into a second navigation menu instead of a prompt. */}
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Action
            icon={Search}
            title="Find teachers"
            body="Search verified teachers by subject, city, salary and availability."
            to="/dashboard/institute/teachers"
          />
          <Action
            icon={FileSignature}
            title="Post a job"
            body="Advertise a position and receive applications from verified teachers."
            to="/dashboard/institute/jobs"
          />
        </div>
      </section>

      {billing && <PlanCard billing={billing} openJobs={openJobs.length} />}
    </>
  );
}

/**
 * The short list of things actually waiting on the institute.
 *
 * <p>Separate from the tiles on purpose. A tile reports a number whether or not anything is wrong;
 * a row here exists only when there is something to do, so an empty list is a meaningful answer
 * rather than a blank panel — and it says so instead of disappearing.
 */
function AttentionList({
  applicants,
  openRoles,
  drafts,
  lapsed,
  toConfirm,
  outstanding,
}: {
  applicants: number;
  openRoles: number;
  drafts: number;
  lapsed: number;
  toConfirm: number;
  outstanding: number;
}) {
  const items: { key: string; tone: 'info' | 'warn'; text: string; cta: string; to: string }[] = [];

  if (applicants > 0) {
    items.push({
      key: 'applicants',
      tone: 'info',
      text: `${applicants} ${pluralize(applicants, 'applicant')} on ${openRoles} open ${pluralize(openRoles, 'role')}`,
      cta: 'Review',
      to: '/dashboard/institute/jobs',
    });
  }
  if (toConfirm > 0) {
    items.push({
      key: 'confirm',
      tone: 'warn',
      // Named as money because it is: the placement fee is raised when both sides confirm.
      text: `${toConfirm} ${pluralize(toConfirm, 'placement')} waiting for you to confirm the start`,
      cta: 'Confirm',
      to: '/dashboard/institute/hiring',
    });
  }
  if (lapsed > 0) {
    items.push({
      key: 'lapsed',
      tone: 'warn',
      text: `${lapsed} ${pluralize(lapsed, 'job post')} past the closing date and no longer taking applications`,
      cta: 'Review',
      to: '/dashboard/institute/jobs',
    });
  }
  if (drafts > 0) {
    items.push({
      key: 'drafts',
      tone: 'info',
      text: `${drafts} ${pluralize(drafts, 'draft')} not published yet — no one can see ${drafts > 1 ? 'them' : 'it'}`,
      cta: 'Publish',
      to: '/dashboard/institute/jobs',
    });
  }
  if (outstanding > 0) {
    items.push({
      key: 'outstanding',
      tone: 'warn',
      text: `${formatPKR(outstanding)} outstanding on your account`,
      cta: 'Settle',
      to: '/dashboard/institute/billing',
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm text-muted-foreground">
          Nothing needs your attention. New applicants and replies will show up here.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-card shadow-soft">
      <h2 className="border-b px-5 py-3.5 font-display font-bold">Needs your attention</h2>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  item.tone === 'warn' ? 'bg-amber-500' : 'bg-brand-500',
                )}
              />
              <p className="min-w-0 text-sm">{item.text}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={item.to}>
                {item.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The plan, and how much of it is left — the two limits that stop a hire mid-flow. */
function PlanCard({ billing, openJobs }: { billing: Billing; openJobs: number }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <Wallet className="h-4 w-4" />
            </span>
            <h2 className="font-display font-bold">{billing.tierLabel} plan</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Usage label="Offers this month" used={billing.offersUsed} limit={billing.monthlyOffers} />
            <Usage label="Open job posts" used={openJobs} limit={billing.activeJobPosts} />
            <div>
              <p className="text-muted-foreground">Placement fee</p>
              <p className="font-display font-bold tabular-nums">
                {Math.round(billing.placementFeeRate * 100)}%
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/institute/billing">
            Manage plan <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** One usage figure. An absent limit is unlimited — the server sends null rather than a sentinel. */
function Usage({ label, used, limit }: { label: string; used: number; limit?: number }) {
  const spent = limit != null && used >= limit;
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={cn('font-display font-bold tabular-nums', spent && 'text-amber-600 dark:text-amber-400')}>
        {used}
        <span className="font-normal text-muted-foreground"> / {limit ?? 'Unlimited'}</span>
      </p>
    </div>
  );
}

/** A headline number, linked to the screen it came from. */
function Stat({
  icon: Icon,
  label,
  value,
  hint,
  to,
  loading,
  emphasis,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  hint?: string;
  to: string;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group rounded-2xl border bg-card p-4 shadow-soft transition-all',
        'hover:border-brand-200 hover:shadow-[0_16px_44px_-16px_rgba(15,23,42,0.18)] dark:hover:border-brand-500/40',
        emphasis && 'border-amber-300/70 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10',
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-10 animate-pulse rounded-md bg-secondary" />
      ) : (
        <p className="mt-1 font-display text-3xl font-extrabold tabular-nums tracking-tight">{value}</p>
      )}
      <p className="mt-0.5 h-4 text-xs text-muted-foreground">{loading ? '' : (hint ?? '')}</p>
    </Link>
  );
}

/** A way into one part of the portal. */
function Action({
  icon: Icon,
  title,
  body,
  to,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border bg-card p-5 shadow-soft transition-all hover:border-brand-200 hover:shadow-[0_16px_44px_-16px_rgba(15,23,42,0.18)] dark:hover:border-brand-500/40"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:group-hover:bg-brand-500/25">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
        Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

function StatusCard({
  view,
  remaining,
}: {
  view: { accountStatus: string; canHire: boolean; completedCount: number; totalSteps: number };
  remaining: number;
}) {
  const map = {
    APPLIED: {
      icon: ShieldCheck,
      title: 'Verification not finished',
      body: `${remaining} of ${view.totalSteps} steps still to complete. Upload your documents and submit for review.`,
      cta: 'Continue verification',
      klass: 'border-brand-200/70 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10',
    },
    UNDER_REVIEW: {
      icon: Clock,
      title: 'Under review',
      body: 'Our trust & safety team is checking your documents. We will email you when it is decided.',
      cta: 'View registration',
      klass: 'border-blue-300/70 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10',
    },
    VERIFIED: {
      icon: CheckCircle2,
      title: 'Verified institute',
      body: 'You can post jobs, open full teacher profiles and send offers.',
      cta: 'View registration',
      klass: 'border-emerald-300/70 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    },
    SUSPENDED: {
      icon: AlertTriangle,
      title: 'Account suspended',
      body: 'Hiring is disabled. Contact support to resolve it.',
      cta: 'View registration',
      klass: 'border-red-300/70 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
    },
  }[view.accountStatus] ?? {
    icon: ShieldCheck,
    title: 'Verification',
    body: 'Complete your registration.',
    cta: 'View registration',
    klass: 'border-brand-200/70 bg-brand-50/60',
  };

  const Icon = map.icon;

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5', map.klass)}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-display font-bold">{map.title}</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{map.body}</p>
        </div>
      </div>
      <Button variant="gradient" asChild>
        <Link to="/dashboard/institute/registration">
          {map.cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * A capability that is still locked.
 *
 * <p>Only rendered before verification now that both features exist — a verified institute gets
 * the real {@link Action} cards instead. Kept rather than inlined because "unlocks once verified"
 * is the whole message of the pre-verification page.
 */
function LockedCard({
  icon: Icon,
  title,
  body,
  unlocked,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
  unlocked: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border bg-card p-5 shadow-soft', !unlocked && 'opacity-60')}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h3 className="font-display font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        Unlocks once verified
      </p>
    </div>
  );
}
