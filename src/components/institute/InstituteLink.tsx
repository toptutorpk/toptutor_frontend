import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * An institute's name, linked to its public page when there is one to link to.
 *
 * <p>Shared because the fallback matters as much as the link: a teacher looking at a job or an
 * offer needs the school's name either way, and a screen that renders nothing when the slug is
 * missing loses the one thing they were reading. Older rows have no slug, so both shapes are live.
 */
export function InstituteLink({
  name,
  slug,
  className,
}: {
  name?: string;
  slug?: string;
  className?: string;
}) {
  const label = name ?? 'Verified institute';
  if (!slug) return <span className={className}>{label}</span>;
  return (
    <Link
      to={`/institutes/${slug}`}
      className={cn('underline-offset-2 hover:text-foreground hover:underline', className)}
    >
      {label}
    </Link>
  );
}
