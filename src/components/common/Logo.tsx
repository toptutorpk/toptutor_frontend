import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/constants';

interface LogoProps {
  className?: string;
  showText?: boolean;
  to?: string;
}

export function Logo({ className, showText = true, to = '/' }: LogoProps) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5 group', className)} aria-label={APP_NAME}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_18px_-6px_rgba(37,99,235,0.7)] transition-transform group-hover:scale-105">
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
          <path d="M9 13.5L16 9l7 4.5-7 4.5-7-4.5z" />
          <path
            d="M12 16.2v3.1c0 .6 1.8 1.7 4 1.7s4-1.1 4-1.7v-3.1l-4 2.6-4-2.6z"
            fillOpacity="0.85"
          />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Top<span className="text-gradient">Tutor</span>
        </span>
      )}
    </Link>
  );
}
