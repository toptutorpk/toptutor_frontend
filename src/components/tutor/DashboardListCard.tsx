import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Shared frame for the list cards on the tutor dashboard.
 *
 * <p>They sit side by side, so the header height, padding and link placement have to be identical —
 * two cards built separately drift by a few pixels and the row stops looking like a row.
 */
export function DashboardListCard({
  title,
  icon: Icon,
  to,
  linkLabel,
  children,
}: {
  title: string;
  icon: React.ElementType;
  to: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
        <Link
          to={to}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
