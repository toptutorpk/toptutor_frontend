import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  FileSignature,
  Database,
  Send,
  Wallet,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinalCTA } from '@/components/home/Sections';

const FEATURES = [
  { icon: Database, title: 'Verified Teacher Database', desc: 'Search a searchable pool of pre-verified teachers by subject, location and salary range.' },
  { icon: Send, title: 'Post Unlimited Jobs', desc: 'Advertise unlimited teaching positions and receive applications from verified candidates.' },
  { icon: Users, title: 'Bulk Shortlisting', desc: 'Send interview invites to multiple tutors simultaneously and track responses in one place.' },
  { icon: FileSignature, title: 'Digital Contracts', desc: 'Generate teaching contracts with built-in e-signature — no paperwork required.' },
  { icon: Wallet, title: 'Retainer Payments', desc: 'Monthly payment tools to pay and retain your best teachers, all in-platform.' },
  { icon: Building2, title: 'Credential Access', desc: 'View and download verified credential documents for every shortlisted teacher.' },
];

export default function InstitutesPage() {
  return (
    <div className="flex flex-col gap-24 py-12">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Badge variant="gold" className="mb-4">For Schools & Academies</Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Hire verified teachers in <span className="text-gradient">days, not weeks</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Access a database of background-checked, credential-verified teachers. Post jobs,
              shortlist in bulk, and sign digital contracts — all from one dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/signup">
                  Start Hiring <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Book a Demo</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['No setup fees', 'Verified candidates only', 'Cancel anytime'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop"
                alt="Institute dashboard"
                className="h-full w-full object-cover opacity-80 mix-blend-luminosity"
              />
            </div>
          </Reveal>
        </div>
      </Container>

      <Container>
        <SectionHeading
          eyebrow="Institute Dashboard"
          title="Everything you need to staff your school"
          description="Purpose-built hiring tools for schools, academies and coaching centres across Pakistan."
        />
        <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>

      <FinalCTA />
    </div>
  );
}
