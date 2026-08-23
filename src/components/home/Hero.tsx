import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, ShieldCheck, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { ArcLights } from '@/components/animations/ArcLights';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CITIES, POPULAR_SUBJECTS } from '@/constants';
// Imported rather than referenced from /public so Vite fingerprints it — new
// artwork gets a new URL, so no browser can serve a stale hero from cache.
import heroImage from '@/assets/hero-classroom.jpg';

const ROTATING = ['Mathematics', 'O-Level Physics', 'Computer Science', 'IELTS Prep', 'Quran & Urdu'];

export function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState<string>('all');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % ROTATING.length), 2400);
    return () => clearInterval(id);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city !== 'all') params.set('city', city);
    navigate(`/tutors?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-brand-25 via-brand-25/50 to-background pt-14 pb-24 dark:from-secondary/30 dark:via-secondary/10 dark:to-background sm:pt-20 lg:pt-24 lg:pb-28">
      {/* Background — the same arc network drawn twice: blurred over the copy
          column so the strokes don't cut through the text, sharp over the
          visual. Complementary masks cross-fade the two around the midline, so
          the blur ramps off left-to-right instead of ending at a seam. */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 blur-[2.5px] [mask-image:linear-gradient(to_right,black_42%,transparent_62%)]">
          <ArcLights className="absolute inset-0" />
        </div>
        <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_42%,black_62%)]">
          <ArcLights className="absolute inset-0" />
        </div>
      </div>

      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-md border border-brand-200/70 bg-background/80 px-3.5 py-1.5 text-sm font-medium shadow-sm ring-1 ring-brand-500/5 backdrop-blur dark:border-brand-500/20"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              <Sparkles className="h-3 w-3" />
            </span>
            Pakistan’s only 6-step verified tutor marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl text-balance"
          >
            Find a tutor you can{' '}
            <span className="text-gradient">actually trust</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Every tutor is identity-checked, background-verified and demo-tested. Book safely with
            escrow payments — and only pay when the session actually happens.
          </motion.p>

          {/* Search */}
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/90 p-2 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_16px_40px_-16px_rgb(37_99_235/0.35)] ring-1 ring-brand-500/5 backdrop-blur-md sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search “${ROTATING[placeholderIdx]}”`}
                className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search subject or tutor"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-44">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12 border-0 bg-secondary/60 pl-9">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="gradient" size="lg" className="h-12 px-6">
                Search <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.form>

          {/* Popular */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-muted-foreground">Popular:</span>
            {POPULAR_SUBJECTS.slice(0, 5).map((s) => (
              <Link
                key={s}
                to={`/tutors?q=${encodeURIComponent(s)}`}
                className="rounded-md border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-300 hover:text-primary"
              >
                {s}
              </Link>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {[5, 12, 20, 25, 31].map((i) => (
                <Avatar key={i} className="h-9 w-9 border-2 border-background">
                  <AvatarImage src={`https://i.pravatar.cc/64?img=${i}`} alt="" />
                </Avatar>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> 4.8/5
              </div>
              <span className="text-muted-foreground">from 40,000+ parent reviews</span>
            </div>
          </motion.div>
        </div>

        {/* Visual */}
        <HeroVisual />
      </Container>
    </section>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative mx-auto hidden w-full max-w-md lg:block"
    >
      {/* Soft glow pooled under the card — reads as depth rather than a drop
          shadow pasted on the background. */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-400/25 via-brand-300/10 to-gold-300/20 blur-2xl"
      />
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/60 bg-slate-100 shadow-[0_2px_4px_rgb(15_23_42/0.04),0_24px_56px_-20px_rgb(15_23_42/0.35)] ring-1 ring-brand-500/10 dark:border-white/10">
        {/* The photo is landscape and the frame is 4:5, so `cover` shows only
            the middle ~55% of its width. Biasing the crop to 70% rather than
            centre keeps the foreground student off the right edge while still
            leaving the classroom behind her visible on the left. */}
        <img
          src={heroImage}
          alt="A student in a classroom holding her notebooks, with classmates studying behind her"
          className="h-full w-full object-cover object-[70%_50%]"
          loading="eager"
          decoding="async"
        />
        {/* Subtle bottom gradient only — keeps the photo fully visible while
            giving the floating cards contrast. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/40 to-transparent" />
      </div>

      {/* Floating verified card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-6 top-12 w-56 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-[0_1px_2px_rgb(15_23_42/0.05),0_16px_36px_-14px_rgb(15_23_42/0.3)] ring-1 ring-black/[0.02] backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">6/6 Verified</p>
            <p className="text-xs text-muted-foreground">CNIC · Degree · Background</p>
          </div>
        </div>
      </motion.div>

      {/* Floating rating card */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -right-4 bottom-16 w-48 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-[0_1px_2px_rgb(15_23_42/0.05),0_16px_36px_-14px_rgb(15_23_42/0.3)] ring-1 ring-black/[0.02] backdrop-blur-md"
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
          ))}
        </div>
        <p className="mt-1 text-sm font-bold">Booked in 2 mins</p>
        <p className="text-xs text-muted-foreground">Payment held in escrow</p>
      </motion.div>
    </motion.div>
  );
}
