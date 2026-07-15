import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  MessageCircle,
  Video,
  Home,
  Building2,
  BadgeCheck,
  Award,
  Globe,
  Check,
  Sparkles,
} from 'lucide-react';

/** Green "Free Demo" pill — the leverage for tutors who opt into demo sessions. */
function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        className,
      )}
    >
      <Sparkles className="h-3 w-3" /> Free Demo
    </span>
  );
}
import { cn, formatPKR, getInitials } from '@/lib/utils';
import type { SessionMode, TeachingLanguage, Tutor } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/common/RatingStars';
import { VerificationBadge } from '@/components/common/VerificationBadge';
import { useUIStore } from '@/store/uiStore';

const MODE_ICON: Record<SessionMode, typeof Video> = {
  online: Video,
  home_visit: Home,
  institute: Building2,
};
const MODE_LABEL: Record<SessionMode, string> = {
  online: 'Online',
  home_visit: 'Home Visit',
  institute: 'Institute',
};

function languageLabel(lang: TeachingLanguage): string {
  return lang === 'Both' ? 'Urdu, English' : lang;
}

/** Animated green "active now" indicator, inspired by colored-outline status icons. */
function OnlineDot({ className }: { className?: string }) {
  return (
    <span className={cn('absolute flex h-4 w-4', className)} title="Active now">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card" />
      <span className="sr-only">Active now</span>
    </span>
  );
}

function FavoriteButton({ tutorId, className }: { tutorId: string; className?: string }) {
  const isFavorite = useUIStore((s) => s.favorites.includes(tutorId));
  const toggleFavorite = useUIStore((s) => s.toggleFavorite);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(tutorId);
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-all hover:scale-110 hover:border-red-200 hover:text-red-500',
        isFavorite && 'border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4 transition-transform', isFavorite && 'fill-red-500')} />
    </button>
  );
}

interface TutorCardProps {
  tutor: Tutor;
  index?: number;
  variant?: 'grid' | 'list';
}

export function TutorCard({ tutor, index = 0, variant = 'grid' }: TutorCardProps) {
  if (variant === 'list') return <TutorListCard tutor={tutor} index={index} />;
  return <TutorGridCard tutor={tutor} index={index} />;
}

/* -------------------------------------------------------------------------- */
/*  Horizontal list card — detail-rich, used on search / listing pages        */
/* -------------------------------------------------------------------------- */
function TutorListCard({ tutor, index }: { tutor: Tutor; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.25) }}
      className="group relative flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:border-brand-200 hover:shadow-[0_16px_44px_-16px_rgba(15,23,42,0.22)] sm:flex-row sm:gap-6 sm:p-6"
    >
      <FavoriteButton tutorId={tutor.id} className="absolute right-4 top-4 z-10" />

      {/* Left — avatar + quick facts */}
      <div className="flex shrink-0 items-center gap-4 sm:w-44 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
        <div className="relative">
          <Link to={`/tutors/${tutor.slug}`}>
            <Avatar className="h-24 w-24 ring-4 ring-secondary/60 sm:h-28 sm:w-28">
              <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
              <AvatarFallback className="text-xl">{getInitials(tutor.name)}</AvatarFallback>
            </Avatar>
          </Link>
          {tutor.isOnline && <OnlineDot className="bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5" />}
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            <Award className="h-3.5 w-3.5" /> {tutor.experienceYears} years tutoring
          </span>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{languageLabel(tutor.languages)}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {tutor.area}, {tutor.city}
            </span>
          </div>
        </div>
      </div>

      {/* Middle — identity + bio + subjects */}
      <div className="min-w-0 flex-1">
        {tutor.isPremium && (
          <Badge variant="gold" className="mb-1.5">
            <BadgeCheck className="h-3 w-3" /> Featured
          </Badge>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-10">
          <Link to={`/tutors/${tutor.slug}`} className="hover:underline">
            <h3 className="font-display text-xl font-bold leading-tight">{tutor.name}</h3>
          </Link>
          <VerificationBadge status={tutor.verificationStatus} size="sm" />
          {tutor.demoAvailable && <DemoBadge />}
          {tutor.isOnline && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active now
            </span>
          )}
        </div>

        {tutor.education[0]?.institution && (
          <p className="mt-0.5 text-sm text-muted-foreground">{tutor.education[0].institution}</p>
        )}

        <p className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug text-foreground/90">
          {tutor.headline}
        </p>

        {tutor.bio && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tutor.bio}</p>
        )}

        <p className="mt-3 line-clamp-1 text-sm">
          <span className="text-muted-foreground">Subjects: </span>
          <span className="text-foreground/90">{tutor.subjects.join(', ')}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {tutor.modes.map((m) => {
            const I = MODE_ICON[m];
            return (
              <span key={m} className="inline-flex items-center gap-1">
                <I className="h-3.5 w-3.5 text-brand-500" /> {MODE_LABEL[m]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Right — rating, price, perks, CTA */}
      <div className="flex shrink-0 flex-col gap-4 border-t pt-4 sm:w-52 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2">
          <RatingStars value={tutor.rating} size={15} showValue count={tutor.reviewCount} />
          <div className="text-right sm:text-left">
            <span className="font-display text-2xl font-extrabold">{formatPKR(tutor.hourlyRate)}</span>
            <span className="text-sm font-normal text-muted-foreground">/hr</span>
          </div>
        </div>

        <ul className="space-y-1.5 text-sm text-foreground/90">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" /> Free 15-min intro call
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" /> Verified credentials
          </li>
        </ul>

        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="icon" aria-label="Message tutor" asChild>
            <Link to={`/tutors/${tutor.slug}`}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="gradient" className="flex-1" asChild>
            <Link to={`/tutors/${tutor.slug}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vertical grid card — compact, used on the home / featured grid            */
/* -------------------------------------------------------------------------- */
function TutorGridCard({ tutor, index }: { tutor: Tutor; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)]"
    >
      {tutor.isPremium && (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="gold" className="shadow-sm">
            <BadgeCheck className="h-3 w-3" /> Featured
          </Badge>
        </div>
      )}

      {/* Cover */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-brand-500/15 to-brand-700/10">
        {tutor.coverUrl && (
          <img
            src={tutor.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <FavoriteButton tutorId={tutor.id} className="absolute left-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* Avatar + name */}
        <div className="-mt-9 flex items-end gap-3">
          <div className="relative">
            <Avatar className="h-18 w-18 border-4 border-card shadow-md">
              <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
              <AvatarFallback>{getInitials(tutor.name)}</AvatarFallback>
            </Avatar>
            {tutor.isOnline && <OnlineDot className="bottom-0.5 right-0.5" />}
          </div>
          <div className="mb-1.5 flex flex-1 flex-wrap items-center gap-1.5">
            <VerificationBadge status={tutor.verificationStatus} size="sm" />
            {tutor.demoAvailable && <DemoBadge />}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link to={`/tutors/${tutor.slug}`} className="min-w-0 hover:underline">
            <h3 className="truncate font-display text-lg font-bold leading-tight">{tutor.name}</h3>
          </Link>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
            title={`${tutor.experienceYears} years of teaching experience`}
          >
            <Award className="h-3 w-3" />
            {tutor.experienceYears}+ yrs
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{tutor.headline}</p>

        <div className="mt-2.5 flex items-center gap-2">
          <RatingStars value={tutor.rating} size={14} showValue count={tutor.reviewCount} />
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {tutor.area}, {tutor.city}
          </span>
        </div>

        {/* Subjects */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tutor.subjects.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="font-medium">
              {s}
            </Badge>
          ))}
        </div>

        {/* Modes */}
        <div className="mt-3 mb-5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {tutor.modes.map((m) => {
            const I = MODE_ICON[m];
            return (
              <span key={m} className="inline-flex items-center gap-1">
                <I className="h-3.5 w-3.5 text-brand-500" /> {MODE_LABEL[m]}
              </span>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Starting at</div>
            <div className="font-display text-lg font-bold text-foreground">
              {formatPKR(tutor.hourlyRate)}
              <span className="text-sm font-normal text-muted-foreground">/hr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Message" asChild>
              <Link to={`/tutors/${tutor.slug}`}>
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link to={`/tutors/${tutor.slug}`}>View Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function TutorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="h-24 animate-pulse bg-muted" />
      <div className="px-5 pb-5">
        <div className="-mt-9 h-18 w-18 animate-pulse rounded-full border-4 border-card bg-muted" />
        <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-5 h-10 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function TutorListCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:gap-6 sm:p-6">
      <div className="flex shrink-0 items-center gap-4 sm:w-44 sm:flex-col">
        <div className="h-24 w-24 animate-pulse rounded-full bg-muted sm:h-28 sm:w-28" />
        <div className="hidden w-full space-y-2 sm:block">
          <div className="mx-auto h-5 w-28 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="shrink-0 space-y-3 border-t pt-4 sm:w-52 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
