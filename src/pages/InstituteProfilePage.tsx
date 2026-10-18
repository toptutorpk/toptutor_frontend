import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  ExternalLink,
  Globe,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { LoadingState } from '@/components/common/StateViews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPKR, getInitials } from '@/lib/utils';
import {
  publicInstituteService,
  type EmploymentType,
  type PublicInstituteJob,
} from '@/services/instituteService';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  VISITING: 'Visiting',
};

const ENTITY_LABEL: Record<string, string> = {
  COMPANY: 'Registered company',
  PARTNERSHIP: 'Partnership',
  SOCIETY: 'Registered society',
  TRUST: 'Trust',
  SOLE_PROPRIETOR: 'Sole proprietorship',
};

/**
 * A verified institute's public page.
 *
 * <p>The page a teacher lands on from a job in their feed or an offer in their inbox — the answer
 * to "who is this school, and are they real". Verification is the whole point of it, so that badge
 * leads rather than sitting in a footer.
 */
export default function InstituteProfilePage() {
  const { slug = '' } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'institute', slug],
    queryFn: () => publicInstituteService.get(slug),
    enabled: slug !== '',
    retry: false,
  });

  if (isLoading) {
    return (
      <Container className="py-16">
        <LoadingState label="Loading institute…" />
      </Container>
    );
  }

  // Unverified and non-existent are the same answer from the server, and they read the same here:
  // there is no page to show, and no hint that there might be one later.
  if (isError || !data) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-bold">Institute not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is only available for institutes we have verified.
          </p>
          <Button className="mt-5" variant="outline" asChild>
            <Link to="/institutes">About hiring on TopTutor</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const facts = [
    data.cityName && {
      icon: MapPin,
      label: [data.area, data.cityName].filter(Boolean).join(', '),
    },
    data.campusName && {
      icon: Building2,
      label: data.campusName,
    },
    data.studentCount != null && {
      icon: Users,
      label: `${new Intl.NumberFormat('en-PK').format(data.studentCount)} students`,
    },
    data.entityType && { icon: Briefcase, label: ENTITY_LABEL[data.entityType] ?? data.entityType },
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <div className="pb-16">
      {/* Cover: a real banner when they uploaded one, a quiet gradient when they did not — never a
          broken image well. */}
      <div className="h-40 w-full bg-gradient-to-r from-brand-100 to-brand-50 sm:h-56 dark:from-brand-500/20 dark:to-brand-500/5">
        {data.coverUrl && (
          <img src={data.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <Container>
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">
          <Avatar className="h-24 w-24 shrink-0 rounded-2xl border-4 border-background shadow-soft sm:h-28 sm:w-28">
            <AvatarImage src={data.logoUrl} alt={data.name} className="object-contain" />
            <AvatarFallback className="rounded-2xl text-2xl">
              {getInitials(data.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {data.name}
              </h1>
              <Badge variant="success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified institute
              </Badge>
            </div>
            {data.legalName && (
              <p className="mt-1 text-sm text-muted-foreground">{data.legalName}</p>
            )}
          </div>

          {data.website && (
            <Button variant="outline" asChild>
              <a href={data.website} target="_blank" rel="noreferrer noopener">
                <Globe className="h-4 w-4" /> Website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        {facts.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {facts.map((f) => (
              <li key={f.label} className="inline-flex items-center gap-1.5">
                <f.icon className="h-4 w-4" /> {f.label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            {data.about && (
              <section>
                <h2 className="font-display text-lg font-bold">About</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {data.about}
                </p>
              </section>
            )}

            <section>
              <h2 className="font-display text-lg font-bold">
                Open positions
                {data.openJobs.length > 0 && (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {data.openJobs.length}
                  </span>
                )}
              </h2>

              {data.openJobs.length === 0 ? (
                <p className="mt-3 rounded-xl border bg-secondary/30 p-5 text-sm text-muted-foreground">
                  Nothing open right now. Verified teachers see new posts from this institute in
                  their job feed as soon as they go live.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.openJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="inline-flex items-center gap-2 font-display font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> What verified means
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We checked this institute's legal registration and the identity of the person
                authorised to hire on its behalf before letting them hire here.
              </p>
              {data.regulator && (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Regulated by </span>
                  <span className="font-medium">{data.regulator}</span>
                </p>
              )}
              {data.verifiedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Verified {format(parseISO(data.verifiedAt), 'MMMM yyyy')}
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="font-display font-bold">Teaching for a living?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Institutes can only reach teachers who finished verification and opted in to
                institute hiring.
              </p>
              <Button className="mt-4 w-full" variant="gradient" asChild>
                <Link to="/signup/tutor">
                  Join as a teacher <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function JobCard({ job }: { job: PublicInstituteJob }) {
  const band =
    job.salaryMin != null && job.salaryMax != null
      ? `${formatPKR(job.salaryMin)} – ${formatPKR(job.salaryMax)}`
      : job.salaryMin != null
        ? `From ${formatPKR(job.salaryMin)}`
        : job.salaryMax != null
          ? `Up to ${formatPKR(job.salaryMax)}`
          : null;

  return (
    <article className="rounded-xl border bg-card p-5 shadow-soft transition-colors hover:border-brand-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{job.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.employmentType && <span>{EMPLOYMENT_LABEL[job.employmentType]}</span>}
            {(job.cityName || job.area) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[job.area, job.cityName].filter(Boolean).join(', ')}
              </span>
            )}
            {job.openings > 1 && <span>{job.openings} openings</span>}
          </div>
        </div>
        {band && <span className="whitespace-nowrap font-semibold tabular-nums">{band}</span>}
      </div>

      {job.subjects && job.subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.subjects.map((s) => (
            <Badge key={s} variant="secondary" className="font-medium">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {job.closesOn && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Applications close {format(parseISO(job.closesOn), 'd MMM yyyy')}
        </p>
      )}
    </article>
  );
}
