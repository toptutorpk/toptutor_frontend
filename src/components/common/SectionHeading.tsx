import { cn } from '@/lib/utils';
import { Reveal } from '@/components/animations/Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  /** `dark` inverts the text for navy bands, where muted-foreground is unreadable. */
  tone?: 'default' | 'dark';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  const dark = tone === 'dark';
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center mx-auto max-w-2xl' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider',
            dark
              ? 'bg-white/10 text-brand-200'
              : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-base leading-relaxed sm:text-lg text-pretty',
            dark ? 'text-brand-100/80' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
