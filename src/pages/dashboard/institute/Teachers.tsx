import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Award,
  Star,
  Check,
  Lock,
  ArrowRight,
  Users,
  ChevronLeft,
  ChevronRight,
  Handshake,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  instituteService,
  teacherSearchService,
  type EmploymentType,
  type TeacherCard as Teacher,
  type TeacherFilters,
} from '@/services/instituteService';
import { useCatalogs } from '@/hooks/useCatalogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { useDebounce } from '@/hooks/useDebounce';
import { SendOfferDialog, type OfferTarget } from '@/components/institute/SendOfferDialog';
import { toast } from '@/components/ui/sonner';
import { cn, formatPKR, getInitials, noNegative } from '@/lib/utils';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  VISITING: 'Visiting',
};

const ANY = 'ANY';

export default function InstituteTeachers() {
  const catalogs = useCatalogs();
  const [filters, setFilters] = useState<TeacherFilters>({ page: 1, size: 12 });
  const [queryText, setQueryText] = useState('');
  const [offering, setOffering] = useState<OfferTarget | null>(null);
  const debounced = useDebounce(queryText, 350);
  const navigate = useNavigate();

  // Opening a chat is idempotent server-side, so the button never needs to know whether a thread
  // already exists — it always lands on the same conversation.
  const chat = useMutation({
    mutationFn: (tutorId: number) => teacherSearchService.startChat(tutorId),
    onSuccess: () => navigate('/dashboard/institute/messages'),
    onError: () => toast.error('Could not open a chat with this teacher.'),
  });

  // The institute's own status decides whether searching is even possible, so it is read first —
  // firing a request we know will be refused, then rendering its error, tells a half-registered
  // institute it is broken rather than that it is unfinished.
  const { data: verification, isLoading: loadingStatus } = useQuery({
    queryKey: ['institute', 'verification'],
    queryFn: () => instituteService.getVerification(),
  });
  const canHire = verification?.canHire ?? false;

  const effective: TeacherFilters = { ...filters, q: debounced || undefined };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'teachers', effective],
    queryFn: () => teacherSearchService.search(effective),
    enabled: canHire,
    placeholderData: keepPreviousData,
  });

  if (loadingStatus) return <LoadingState label="Loading…" />;
  if (!canHire) return <LockedState status={verification?.accountStatus} />;

  const set = <K extends keyof TeacherFilters>(k: K, v: TeacherFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Find teachers</h1>
        <p className="mt-1 text-muted-foreground">
          Verified teachers who have opted in to hearing from institutes.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by name, headline or subject…"
            className="h-11 pl-9"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filter label="Subject">
            <Select
              value={filters.subject ?? ANY}
              onValueChange={(v) => set('subject', v === ANY ? undefined : v)}
            >
              <SelectTrigger><SelectValue placeholder="Any subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any subject</SelectItem>
                {catalogs.subjects.map((s) => (
                  <SelectItem key={s.id} value={s.value}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>

          <Filter label="City">
            <Select
              value={filters.cityId ? String(filters.cityId) : ANY}
              onValueChange={(v) => set('cityId', v === ANY ? undefined : Number(v))}
            >
              <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any city</SelectItem>
                {catalogs.cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>

          <Filter label="Role type">
            <Select
              value={filters.employmentType ?? ANY}
              onValueChange={(v) =>
                set('employmentType', v === ANY ? undefined : (v as EmploymentType))
              }
            >
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any type</SelectItem>
                {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((t) => (
                  <SelectItem key={t} value={t}>{EMPLOYMENT_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>

          <Filter label="Budget (PKR/month)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 60000"
              value={filters.salaryMax ?? ''}
              onChange={(e) => {
                const raw = noNegative(e.target.value);
                set('salaryMax', raw === '' ? undefined : Number(raw));
              }}
            />
          </Filter>

          <Filter label="Needed from">
            {/* The app's own picker, as everywhere else. No floor: an institute filling a role
                that started last week is filtering for whoever is free now, which is a real
                search rather than a typo. */}
            <DatePicker
              value={filters.availableFrom ?? ''}
              onChange={(v) => set('availableFrom', v || undefined)}
              placeholder="Any start date"
            />
          </Filter>

          <Filter label="Min. experience (years)">
            {/* min={0} alone only stops the spinner — noNegative drops a typed minus, which
                otherwise reached the API as a nonsensical "at least -5 years". */}
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              placeholder="Any"
              value={filters.minExperience ?? ''}
              onChange={(e) => {
                const raw = noNegative(e.target.value);
                set('minExperience', raw === '' ? undefined : Number(raw));
              }}
            />
          </Filter>
        </div>
      </section>

      {isLoading && !data ? (
        <LoadingState label="Searching teachers…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} message="Could not load teachers." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{data.total}</span>{' '}
            {data.total === 1 ? 'teacher' : 'teachers'} match your filters
          </p>

          {/* One per row: the card is a wide horizontal record now, not a tile. */}
          <div className="space-y-4">
            {data.items.map((t) => (
              <TeacherResult
                key={t.tutorId}
                teacher={t}
                onOffer={() => setOffering({ tutorId: t.tutorId, tutorName: t.name })}
                onMessage={() => chat.mutate(t.tutorId)}
                messaging={chat.isPending && chat.variables === t.tutorId}
              />
            ))}
          </div>

          <SendOfferDialog target={offering} onClose={() => setOffering(null)} />

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function TeacherResult({
  teacher: t,
  onOffer,
  onMessage,
  messaging,
}: {
  teacher: Teacher;
  onOffer: () => void;
  onMessage: () => void;
  messaging: boolean;
}) {
  // Compact, and the currency named once. A full range reads "PKR 80,000 – PKR 120,000", which
  // does not fit the column and was being truncated to "PKR 80,000 – …" — a salary with its top
  // end cut off is worse than no salary at all.
  const band =
    t.expectedSalaryMin != null && t.expectedSalaryMax != null
      ? `${formatPKR(t.expectedSalaryMin, { compact: true })} – ${compactAmount(t.expectedSalaryMax)}`
      : t.expectedSalaryMin != null
        ? `From ${formatPKR(t.expectedSalaryMin, { compact: true })}`
        : t.expectedSalaryMax != null
          ? `Up to ${formatPKR(t.expectedSalaryMax, { compact: true })}`
          : 'Not stated';

  const startsImmediately = !t.earliestStart || new Date(t.earliestStart) <= new Date();
  const availability = startsImmediately
    ? 'Immediately'
    : new Date(t.earliestStart as string).toLocaleDateString();

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:border-brand-200 hover:shadow-[0_16px_44px_-16px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col lg:flex-row">
        {/* ---- Who they are ------------------------------------------------ */}
        <div className="min-w-0 flex-1 p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0 rounded-xl">
              <AvatarImage src={t.photoUrl} alt={t.name} />
              <AvatarFallback className="rounded-xl bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {getInitials(t.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold leading-tight">{t.name}</h3>
                {/* Unconditional, and true: this search returns only verified teachers who have
                    opted in, so the badge states the entry condition rather than a per-row fact. */}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> Verified
                </span>
              </div>

              {t.headline && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {t.headline}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {(t.city || t.area) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[t.area, t.city].filter(Boolean).join(', ')}
                  </span>
                )}
                {t.experienceYears != null && (
                  <span className="inline-flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {t.experienceYears} yrs
                  </span>
                )}
                {t.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> {t.rating}
                    <span className="text-muted-foreground/70">({t.reviewCount})</span>
                  </span>
                )}
              </div>

              {t.subjects && t.subjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.subjects.slice(0, 4).map((s) => (
                    <Badge key={s} variant="secondary" className="font-medium">{s}</Badge>
                  ))}
                  {t.subjects.length > 4 && <Badge variant="secondary">+{t.subjects.length - 4}</Badge>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- What hiring them would mean ---------------------------------
            The three questions an institute asks before opening a profile, so the list can be
            scanned without opening anything. Role type sits first because it is the one that
            disqualifies fastest — a full-time-only teacher is no use for a visiting slot. */}
        <dl className="grid shrink-0 grid-cols-3 border-t bg-secondary/25 lg:w-[30rem] lg:border-l lg:border-t-0">
          <Stat label="Role type">
            {t.employmentType ? EMPLOYMENT_LABEL[t.employmentType] : 'Not stated'}
          </Stat>
          <Stat label="Expected salary" className="border-l">
            {band}
          </Stat>
          <Stat label="Availability" className="border-l">
            <span className="inline-flex items-center gap-1.5">
              {startsImmediately && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              )}
              {availability}
            </span>
          </Stat>
        </dl>
      </div>

      {t.hiringNote && (
        <p className="line-clamp-2 px-5 text-sm italic text-muted-foreground">“{t.hiringNote}”</p>
      )}

      {/* ---- Actions ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 p-5 pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onMessage}
          disabled={messaging}
          aria-label={`Message ${t.name}`}
          title="Message"
        >
          {messaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/tutors/${t.slug}`} target="_blank" rel="noreferrer">
            View profile <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="gradient" onClick={onOffer}>
          <Handshake className="h-4 w-4" /> Send offer
        </Button>
      </div>
    </article>
  );
}

/** The upper end of a salary band, without repeating the currency the lower end already named. */
function compactAmount(amount: number): string {
  return new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}

/** One labelled figure in the card's right-hand panel. */
function Stat({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('min-w-0 px-4 py-5', className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display font-bold leading-snug">{children}</dd>
    </div>
  );
}

/** Shown while the institute is not yet verified — the state, not an error. */
function LockedState({ status }: { status?: string }) {
  const submitted = status === 'UNDER_REVIEW';
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-soft">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-bold">
        {submitted ? 'Verification in progress' : 'Finish verification to search'}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {submitted
          ? 'Our team is reviewing your documents. The teacher database opens as soon as you are approved.'
          : 'Teachers are only visible to institutes we have verified. Complete your registration to unlock the database.'}
      </p>
      <Button className="mt-5" variant="gradient" asChild>
        <Link to="/dashboard/institute/registration">
          {submitted ? 'View registration' : 'Continue verification'} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Users className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-bold">No teachers match those filters</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        Only verified teachers who have opted in to institute hiring appear here. Try widening your
        budget, subject or start date.
      </p>
    </div>
  );
}
