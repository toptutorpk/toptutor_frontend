import { cn } from '@/lib/utils';
import type { AppNotification } from '@/services/notificationService';
import { metaFor, timeAgo } from './notificationMeta';

/** One notification row — used in the bell's panel and on the full Notifications page. */
export function NotificationItem({
  n,
  onOpen,
  compact,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
  compact?: boolean;
}) {
  const { icon: Icon, tone } = metaFor(n.type);
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl text-left transition-colors',
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        n.read
          ? 'hover:bg-secondary/70'
          : 'bg-brand-50/70 hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/15',
      )}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn('block text-sm leading-snug', n.read ? 'font-medium' : 'font-semibold')}
        >
          {n.title}
        </span>
        {n.body && (
          <span
            className={cn(
              'mt-0.5 block text-xs leading-relaxed text-muted-foreground',
              compact && 'line-clamp-2',
            )}
          >
            {n.body}
          </span>
        )}
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
      </span>
      {!n.read && (
        <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
      )}
    </button>
  );
}
