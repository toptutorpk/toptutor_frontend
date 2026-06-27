import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, MessageCircle, Video, Home, Building2, BadgeCheck } from 'lucide-react';
import { cn, formatPKR, getInitials } from '@/lib/utils';
import type { SessionMode, Tutor } from '@/types';
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

export function TutorCard({ tutor, index = 0 }: { tutor: Tutor; index?: number }) {
  const isFavorite = useUIStore((s) => s.favorites.includes(tutor.id));
  const toggleFavorite = useUIStore((s) => s.toggleFavorite);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] hover:border-brand-200"
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
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(tutor.id);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 dark:bg-slate-900/80"
        >
          <Heart
            className={cn(
              'h-4.5 w-4.5 transition-colors',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-500',
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* Avatar + name */}
        <div className="-mt-9 flex items-end gap-3">
          <Avatar className="h-18 w-18 border-4 border-card shadow-md">
            <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
            <AvatarFallback>{getInitials(tutor.name)}</AvatarFallback>
          </Avatar>
          <div className="mb-1.5 flex-1">
            <VerificationBadge status={tutor.verificationStatus} size="sm" />
          </div>
        </div>

        <Link to={`/tutors/${tutor.slug}`} className="mt-3">
          <h3 className="font-display text-lg font-bold leading-tight transition-colors group-hover:text-primary">
            {tutor.name}
          </h3>
        </Link>
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
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
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
        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-4 mt-4">
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
