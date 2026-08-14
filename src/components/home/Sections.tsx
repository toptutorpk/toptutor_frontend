import { Link } from 'react-router-dom';
import { DynamicIcon } from '@/lib/icons';
import {
  ShieldCheck,
  Wallet,
  MessageSquareLock,
  CalendarCheck,
  Search,
  CreditCard,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { ArcLights } from '@/components/animations/ArcLights';
import { DotField } from '@/components/animations/DotField';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { AnimatedCounter } from '@/components/animations/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/common/RatingStars';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { PLATFORM_STATS, TESTIMONIALS, SUCCESS_STORIES } from '@/services/mock/misc';

/* --------------------------------- Stats --------------------------------- */
export function StatsBar() {
  return (
    <Container>
      <StaggerGroup className="grid grid-cols-2 gap-4 rounded-3xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-xl sm:gap-6 lg:grid-cols-4 lg:p-10">
        {PLATFORM_STATS.map((s) => (
          <StaggerItem key={s.label} className="text-center lg:text-left">
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <DynamicIcon name={s.icon} fallback={Sparkles} className="h-5 w-5" />
            </div>
            <div className="font-display text-3xl font-extrabold sm:text-4xl">
              <AnimatedCounter value={s.value} />
            </div>
            <div className="mt-1 text-sm text-white/75">{s.label}</div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Container>
  );
}

/* ------------------------------ Why Choose ------------------------------- */
const WHY = [
  { icon: ShieldCheck, title: '7-Step Verification', desc: 'CNIC, degree, criminal background, experience, proficiency, demo & admin review — every single tutor.', color: 'from-sky-500 to-blue-600' },
  { icon: Wallet, title: 'Escrow Protection', desc: 'Your money is held securely and only released after you confirm the session was completed.', color: 'from-blue-500 to-indigo-600' },
  { icon: MessageSquareLock, title: 'Private & Encrypted', desc: 'In-app encrypted messaging keeps your phone number private until you confirm a booking.', color: 'from-violet-500 to-purple-600' },
  { icon: CalendarCheck, title: 'Free Trial Calls', desc: 'Book a free 15-minute intro call before committing to find the perfect match.', color: 'from-amber-500 to-orange-600' },
];

export function WhyChoose() {
  return (
    <Container>
      <SectionHeading
        eyebrow="Why TopTutor"
        title="Trust built into every booking"
        description="We solved the biggest problem in tutoring — knowing who you’re really letting teach your child."
      />
      <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map((w) => (
          <StaggerItem key={w.title}>
            <div className="group h-full rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg">
              <span
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${w.color} text-white shadow-md transition-transform group-hover:scale-110`}
              >
                <w.icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg font-bold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Container>
  );
}

/* --------------------------- Learning Journey ---------------------------- */
const JOURNEY = [
  { icon: Search, title: 'Discover', desc: 'Search verified tutors by subject, city, budget & language. Post a requirement and let tutors come to you.' },
  { icon: MessageSquareLock, title: 'Connect', desc: 'Chat privately, then book a free 15-minute intro call to make sure it’s the right fit.' },
  { icon: CreditCard, title: 'Book & Pay Safely', desc: 'Confirm your session and pay via JazzCash, Easypaisa or card. Money is held in escrow.' },
  { icon: Star, title: 'Learn & Review', desc: 'Your tutor teaches, you confirm completion, payment is released, and you leave a review.' },
];

export function LearningJourney() {
  return (
    <Container>
      <SectionHeading
        eyebrow="How it works"
        title="Your learning journey, simplified"
        description="Four simple steps from finding a tutor to seeing real results."
      />
      <div className="relative mt-14">
        <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 lg:block" />
        <StaggerGroup className="grid gap-8 lg:grid-cols-4">
          {JOURNEY.map((step, i) => (
            <StaggerItem key={step.title} className="relative text-center">
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card border-2 border-brand-500 shadow-lg">
                <step.icon className="h-6 w-6 text-brand-600" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </Container>
  );
}

/* --------------------------- Success Stories ----------------------------- */
export function SuccessStories() {
  return (
    <Container>
      <div className="grid items-center gap-12 rounded-3xl border bg-secondary/40 p-8 lg:grid-cols-2 lg:p-14">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            Real results
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Students don’t just pass — they thrive.
          </h2>
          <p className="mt-4 text-muted-foreground">
            With consistent, verified tutoring, our students see measurable improvement term after
            term. And tutors get guaranteed, on-time payouts that keep great teachers on the
            platform.
          </p>
          <Button className="mt-6" variant="gradient" size="lg" asChild>
            <Link to="/tutors">
              Find your tutor <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
        <StaggerGroup className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {SUCCESS_STORIES.map((s) => (
            <StaggerItem key={s.id}>
              <div className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="font-display text-3xl font-extrabold text-gradient">{s.metric}</div>
                <div className="mt-1 font-semibold">{s.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </Container>
  );
}

/* ------------------------------ Testimonials ----------------------------- */
export function Testimonials() {
  return (
    <Container>
      <SectionHeading
        eyebrow="Loved by parents"
        title="Trusted across Pakistan"
        description="Join 25,000+ families who found the right tutor — safely."
      />
      <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t) => (
          <StaggerItem key={t.id}>
            <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-lg">
              <RatingStars value={t.rating} size={16} />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar} alt={t.name} />
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} · {t.city}
                  </div>
                </div>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Container>
  );
}

/* --------------------------------- CTA ----------------------------------- */
export function FinalCTA() {
  return (
    <Container>
      <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-8 py-16 text-center text-white shadow-2xl sm:px-16">
        {/* Same stack as the contact page's dark band: lattice, then arcs.
            The copy sits on a solid gradient, so nothing needs masking out. */}
        {/* Blurred so the lattice reads as texture behind the copy rather than
            a crisp grid competing with it. */}
        <DotField tone="dark" className="blur-[3px]" />
        <ArcLights tone="dark" className="absolute inset-0" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to find a tutor you can trust?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Get started free in under 2 minutes. No card required to browse verified tutors.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" variant="secondary" className="bg-white text-brand-700 hover:bg-white/90" asChild>
              <Link to="/signup/student">Find a Tutor</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/signup/tutor">Become a Tutor</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
