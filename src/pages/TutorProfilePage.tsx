import { useParams } from 'react-router-dom';
import {
  MapPin,
  GraduationCap,
  Award,
  Languages,
  Clock,
  Repeat,
  CheckCircle2,
  Heart,
  Share2,
  MessageCircle,
  PlayCircle,
  CalendarClock,
  Video,
  Home,
  Building2,
  Star,
  Sparkles,
} from 'lucide-react';
import type { SessionMode, Tutor } from '@/types';
import { useBookIntro } from '@/hooks/useBookIntro';
import { cn, getInitials } from '@/lib/utils';
import { Container } from '@/components/common/Container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RatingStars } from '@/components/common/RatingStars';
import { VerificationBadge } from '@/components/common/VerificationBadge';
import { VerificationSteps } from '@/components/tutor/VerificationSteps';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { BookingPanel } from '@/components/booking/BookingPanel';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { useTutor } from '@/hooks/useTutors';
import { useUIStore } from '@/store/uiStore';

export default function TutorProfilePage() {
  const { slug = '' } = useParams();
  const { data: tutor, isLoading, isError, refetch } = useTutor(slug);
  const isFav = useUIStore((s) => (tutor ? s.favorites.includes(tutor.id) : false));
  const toggleFav = useUIStore((s) => s.toggleFavorite);

  if (isLoading) return <LoadingState label="Loading tutor profile…" />;
  if (isError || !tutor) return <ErrorState onRetry={() => refetch()} message="Tutor not found." />;

  const stats = [
    { icon: GraduationCap, label: 'Sessions', value: tutor.totalSessions.toLocaleString() },
    { icon: Clock, label: 'Response rate', value: `${tutor.responseRate}%` },
    { icon: Repeat, label: 'Repeat hire', value: `${tutor.repeatHireRate}%` },
    { icon: Award, label: 'Experience', value: `${tutor.experienceYears} yrs` },
  ];

  return (
    <div className="pb-16">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 sm:h-56">
        {tutor.coverUrl && (
          <img src={tutor.coverUrl} alt="" className="h-full w-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 to-transparent" />
      </div>

      <Container size="wide" className="-mt-16 relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div>
            {/* Header card */}
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                  <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
                  <AvatarFallback className="text-2xl">{getInitials(tutor.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-extrabold tracking-tight">
                      {tutor.name}
                    </h1>
                    <VerificationBadge status={tutor.verificationStatus} />
                    {tutor.demoAvailable && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Sparkles className="h-3 w-3" /> Free Demo
                      </span>
                    )}
                    {tutor.isOnline && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Active now
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">{tutor.headline}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <RatingStars value={tutor.rating} size={15} showValue count={tutor.reviewCount} />
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {tutor.area}, {tutor.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Languages className="h-3.5 w-3.5" /> {tutor.languages}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleFav(tutor.id)}
                    aria-label="Favorite"
                  >
                    <Heart className={cn('h-4 w-4', isFav && 'fill-red-500 text-red-500')} />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Share">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border bg-secondary/40 p-3 text-center">
                    <s.icon className="mx-auto mb-1 h-4 w-4 text-brand-500" />
                    <div className="font-display text-lg font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <AvailabilityStrip tutor={tutor} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="mt-6">
              <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="subjects">Subjects & Skills</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({tutor.reviewCount})</TabsTrigger>
              </TabsList>

              {/* About */}
              <TabsContent value="about" className="space-y-6">
                <Section title="Video introduction">
                  <div className="group relative aspect-video overflow-hidden rounded-2xl border bg-slate-900">
                    <img
                      src={tutor.coverUrl}
                      alt=""
                      className="h-full w-full object-cover opacity-60"
                    />
                    <button className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-transform group-hover:scale-110">
                        <PlayCircle className="h-9 w-9" />
                      </span>
                    </button>
                  </div>
                </Section>
                <Section title="About me">
                  <p className="leading-relaxed text-foreground/90">{tutor.bio}</p>
                </Section>
                <Section title="Education">
                  <div className="space-y-3">
                    {tutor.education.map((e, i) => (
                      <CredentialRow
                        key={i}
                        title={e.degree}
                        sub={`${e.institution} · ${e.year}`}
                        verified={e.verified}
                        icon={GraduationCap}
                      />
                    ))}
                  </div>
                </Section>
                <Section title="Certifications">
                  <div className="space-y-3">
                    {tutor.certifications.map((c, i) => (
                      <CredentialRow
                        key={i}
                        title={c.name}
                        sub={`${c.issuer} · ${c.year}`}
                        verified={c.verified}
                        icon={Award}
                      />
                    ))}
                  </div>
                </Section>
              </TabsContent>

              {/* Subjects */}
              <TabsContent value="subjects" className="space-y-6">
                <Section title="Subjects taught">
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((s) => (
                      <Badge key={s} className="px-3 py-1 text-sm" variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Section>
                <Section title="Grade levels">
                  <div className="flex flex-wrap gap-2">
                    {tutor.gradeLevels.map((g) => (
                      <Badge key={g} variant="outline" className="px-3 py-1">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </Section>
                <Section title="Skills & strengths">
                  <div className="flex flex-wrap gap-2">
                    {tutor.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
              </TabsContent>

              {/* Verification */}
              <TabsContent value="verification">
                <Section
                  title="7-Step verification"
                  subtitle="Every credential below was manually checked by our trust & safety team."
                >
                  <VerificationSteps steps={tutor.verificationSteps} />
                </Section>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews" className="space-y-6">
                {tutor.reviewCount === 0 ? (
                  <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <Star className="h-7 w-7" />
                    </div>
                    <h3 className="font-display text-lg font-bold">No reviews yet</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {tutor.name.split(' ')[0]} is new to TopTutor. Book a session and be the first to
                      leave a review.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
                      <div className="text-center">
                        <div className="font-display text-5xl font-extrabold text-gradient">
                          {tutor.rating.toFixed(1)}
                        </div>
                        <RatingStars value={tutor.rating} size={16} className="mt-1 justify-center" />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {tutor.reviewCount} reviews
                        </div>
                      </div>
                      <Separator orientation="vertical" className="hidden h-20 sm:block" />
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const pct = star === 5 ? 78 : star === 4 ? 16 : star === 3 ? 4 : 1;
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="w-3 text-muted-foreground">{star}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-gold-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {tutor.reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BookingPanel tutor={tutor} />
            <AvailabilityCard tutor={tutor} />
            <div className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="font-display font-bold">Have a question?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Message {tutor.name.split(' ')[0]} directly — your number stays private until you book.
              </p>
              <MessageTutorButton tutor={tutor} />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

/** Weekly available hours shown on the profile (from the tutor's real availability). */
function AvailabilityCard({ tutor }: { tutor: Tutor }) {
  if (!tutor.availability || tutor.availability.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-brand-500" />
        <h3 className="font-display font-bold">Available hours</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {tutor.availability.map((d) => {
          const times = d.slots.filter((s) => s.available);
          if (times.length === 0) return null;
          return (
            <li key={d.day} className="flex items-start gap-3 text-sm">
              <span className="w-10 shrink-0 font-semibold">{d.day}</span>
              <span className="flex flex-wrap gap-1.5">
                {times.map((s) => (
                  <span key={s.time} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {s.time}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      {tutor.demoAvailable && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <Sparkles className="h-3.5 w-3.5" /> Free demo session available
        </p>
      )}
    </div>
  );
}

/**
 * Books the free intro call (the gate that unlocks messaging) and jumps into the chat.
 * Guests are sent to log in; tutors/admins are nudged to use a learner account.
 */
function MessageTutorButton({ tutor }: { tutor: Tutor }) {
  const { book, loading } = useBookIntro();
  return (
    <Button
      variant="outline"
      className="mt-4 w-full"
      disabled={loading}
      onClick={() => book(Number(tutor.id), { tutorName: tutor.name, slug: tutor.slug })}
    >
      <MessageCircle className="h-4 w-4" /> {loading ? 'Opening…' : 'Send a message'}
    </Button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CredentialRow({
  title,
  sub,
  verified,
  icon: Icon,
}: {
  title: string;
  sub: string;
  verified: boolean;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-secondary/30 p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      {verified && (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </Badge>
      )}
    </div>
  );
}

const MODE_META: Record<SessionMode, { icon: typeof Video; label: string }> = {
  online: { icon: Video, label: 'Online' },
  home_visit: { icon: Home, label: 'Home Visit' },
  institute: { icon: Building2, label: 'Institute' },
};

/** Generic daily time windows shown as availability badges (not day-specific). */
const TIME_WINDOWS = [
  { time: '09:00', label: '9:00 AM – 11:00 AM' },
  { time: '11:00', label: '11:00 AM – 1:00 PM' },
  { time: '14:00', label: '2:00 PM – 4:00 PM' },
  { time: '16:00', label: '4:00 PM – 6:00 PM' },
  { time: '18:00', label: '6:00 PM – 8:00 PM' },
  { time: '20:00', label: '8:00 PM – 10:00 PM' },
];

/** Generic, at-a-glance availability — blue badge = open, red = booked. */
function AvailabilityStrip({ tutor }: { tutor: Tutor }) {
  const windows = TIME_WINDOWS.map((w) => {
    const slots = tutor.availability.flatMap((d) => d.slots.filter((s) => s.time === w.time));
    const openCount = slots.filter((s) => s.available).length;
    const available = slots.length > 0 && openCount >= slots.length / 2;
    return { ...w, available };
  });
  const openTotal = windows.filter((w) => w.available).length;

  return (
    <div className="mt-6 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold">
          <CalendarClock className="h-4 w-4 text-brand-500" /> Available time slots
          <span className="font-normal text-muted-foreground">
            · {openTotal} of {windows.length} open
          </span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tutor.modes.map((m) => {
            const M = MODE_META[m];
            return (
              <Badge key={m} variant="secondary" className="gap-1">
                <M.icon className="h-3 w-3 text-brand-500" /> {M.label}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {windows.map((w) => (
          <span
            key={w.time}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
              w.available
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300'
                : 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400',
            )}
          >
            <Clock className="h-3 w-3 shrink-0" />
            {w.label}
            {!w.available && (
              <span className="ml-0.5 rounded bg-red-100 px-1 py-0 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-500/20 dark:text-red-300">
                Booked
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Booked
        </span>
      </div>
    </div>
  );
}
