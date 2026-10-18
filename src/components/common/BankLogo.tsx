import { useState } from 'react';
import { cn } from '@/lib/utils';
import { findInstitution, initialsFor, logoSources } from '@/constants/banks';

/** Tints for the initials badge, picked from the name so a bank keeps the same colour everywhere. */
const TONES = [
  'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20',
  'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20',
  'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20',
  'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20',
  'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20',
  'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/20',
  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/30',
];

function toneFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

const SIZES = { sm: 28, md: 40, lg: 48 } as const;

/**
 * A bank's or wallet's logo in a round badge — or, when there is no logo for it (or it fails to
 * load), its initials on a soft tint. Logos sit on white in both themes: they are other companies'
 * full-colour marks and are never recoloured.
 */
export function BankLogo({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const meta = findInstitution(name);
  const px = SIZES[size];
  const sources = meta && !failed ? logoSources(meta, px) : null;
  const dims = { width: px, height: px };

  if (sources) {
    return (
      <span
        style={dims}
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white',
          // A full-bleed logo fills the circle; a mark on white keeps a little breathing room.
          meta?.fill ? 'p-0' : 'p-[3px]',
          className,
        )}
      >
        <img
          {...sources}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full rounded-full',
            meta?.fill ? 'object-cover' : 'object-contain',
          )}
        />
      </span>
    );
  }

  const initials = meta?.initials ?? initialsFor(name);
  return (
    <span
      style={dims}
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border font-display font-bold tracking-tight',
        size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-xs' : 'text-sm',
        toneFor(name),
        className,
      )}
    >
      {initials}
    </span>
  );
}
