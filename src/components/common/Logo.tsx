import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/constants';
// Imported rather than referenced from /public so Vite fingerprints the files:
// dropping in new artwork changes the emitted URL, so browsers can never serve
// a stale logo from cache. The 512px masters sit alongside each of these for
// anywhere the mark is displayed larger.
import logoMark from '@/assets/logo-256.png';
import logoMarkWhite from '@/assets/logo-white-256.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  to?: string;
  /**
   * `white` swaps in the knockout mark for brand-blue and other dark panels,
   * where the full-colour artwork loses its contrast against the background.
   * The wordmark inherits `currentColor` there instead of the brand gradient.
   */
  tone?: 'color' | 'white';
}

export function Logo({ className, showText = true, to = '/', tone = 'color' }: LogoProps) {
  return (
    <Link
      to={to}
      // The artwork is taller than wide, so squaring it leaves ~5% clear down
      // each side. That padding already reads as part of the space before the
      // wordmark, hence the tight flex gap — the two read as one lockup.
      className={cn('flex items-center gap-1.5 group', className)}
      aria-label={APP_NAME}
    >
      {/* Full-bleed artwork, so 32px keeps it in proportion with the wordmark.
          The 1px lift aligns it to the text's cap-height centre rather than its
          line box, which is offset by the descender space the box reserves.
          Sourced well above its display size to stay sharp on retina. */}
      <img
        src={tone === 'white' ? logoMarkWhite : logoMark}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 -translate-y-px object-contain transition-transform group-hover:scale-105"
      />
      {showText && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Top
          <span className={cn(tone === 'white' ? 'text-white' : 'text-gradient')}>Tutor</span>
        </span>
      )}
    </Link>
  );
}
