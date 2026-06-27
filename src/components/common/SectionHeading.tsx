import { cn } from '@/lib/utils';
import { Reveal } from '@/components/animations/Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center mx-auto max-w-2xl' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">
          {description}
        </p>
      )}
    </Reveal>
  );
}
