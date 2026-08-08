import { cn } from '@/lib/utils';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import type { ReactNode } from 'react';

type SectionTone = 'default' | 'tint' | 'dark';

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Background treatment. `dark` paints the brand navy for full-bleed bands. */
  tone?: SectionTone;
  align?: 'left' | 'center';
  /** Width of the inner Container. */
  size?: 'default' | 'wide' | 'narrow';
  /** Right-hand slot in the header row — only rendered when align is `left`. */
  action?: ReactNode;
  children?: ReactNode;
  /** Drop the standard vertical rhythm (for sections managing their own). */
  flush?: boolean;
}

const toneClasses: Record<SectionTone, string> = {
  default: 'bg-background text-foreground',
  tint: 'bg-brand-25 text-foreground dark:bg-secondary/40',
  // Fixed navy in both themes: these bands are meant to punctuate the page, so
  // they must stay dark even when the rest of the UI already is.
  dark: 'bg-brand-950 text-white',
};

/**
 * The standard page section: consistent vertical rhythm plus the
 * eyebrow → title → description header used across the marketing pages.
 */
export function Section({
  eyebrow,
  title,
  description,
  tone = 'default',
  align = 'left',
  size = 'default',
  action,
  flush = false,
  className,
  children,
  ...props
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || title || description);
  const centered = align === 'center';

  return (
    <section
      className={cn(toneClasses[tone], !flush && 'section-y', className)}
      {...props}
    >
      <Container size={size}>
        {hasHeader && (
          <div
            className={cn(
              'mb-12 lg:mb-16',
              !centered && action && 'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
            )}
          >
            <SectionHeading
              eyebrow={typeof eyebrow === 'string' ? eyebrow : undefined}
              title={title}
              description={description}
              align={align}
              tone={tone === 'dark' ? 'dark' : 'default'}
              className={cn(!centered && 'max-w-2xl')}
            />
            {action && !centered && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
