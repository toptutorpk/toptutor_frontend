import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday, parseISO } from 'date-fns';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import { NotificationItem } from './NotificationItem';
import { metaFor } from './notificationMeta';

/**
 * The header bell for students, parents and tutors.
 *
 * <p>The badge is the real unread count (hidden at zero, "9+" past nine) and gives a short pulse when
 * something arrives. The panel groups notifications into Today and Earlier; clicking one marks it read
 * and opens where it points. While the panel is closed, a live arrival also shows a toast with a View
 * action — while it's open, the item simply appears at the top.
 */
export function NotificationBell({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  const { items, loading, unread, markRead, markAllRead } = useNotifications((n) => {
    setPulse(true);
    if (!openRef.current) {
      const { icon: Icon } = metaFor(n.type);
      toast(n.title, {
        description: n.body ?? undefined,
        icon: <Icon className="h-4 w-4 text-brand-600" />,
        action: n.link ? { label: 'View', onClick: () => openNotification(n) } : undefined,
      });
    }
  });

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 1600);
    return () => clearTimeout(t);
  }, [pulse]);

  function openNotification(n: AppNotification) {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  const today = items.filter((n) => isToday(parseISO(n.createdAt)));
  const earlier = items.filter((n) => !isToday(parseISO(n.createdAt)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          {pulse ? (
            <BellRing className="h-5 w-5 animate-[wiggle_0.6s_ease-in-out_2]" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unread > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background',
                pulse && 'animate-bounce',
              )}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl p-0"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-display text-base font-bold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : 'You’re all caught up'}
            </p>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-600 dark:text-brand-300"
              onClick={markAllRead}
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        <div className="no-scrollbar max-h-[26rem] overflow-y-auto p-1.5">
          {loading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-semibold">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Bookings, reminders and updates will show up here.
              </p>
            </div>
          ) : (
            <>
              <Group label="Today" items={today} onOpen={openNotification} />
              <Group label="Earlier" items={earlier} onOpen={openNotification} />
            </>
          )}
        </div>

        <div className="border-t p-1.5">
          <Button
            variant="ghost"
            className="w-full text-sm font-semibold"
            onClick={() => {
              setOpen(false);
              navigate(`${basePath}/notifications`);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Group({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((n) => (
          <NotificationItem key={n.id} n={n} onOpen={onOpen} compact />
        ))}
      </div>
    </div>
  );
}
