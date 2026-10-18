import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationKeys, useNotifications } from '@/hooks/useNotifications';
import { notificationService, type AppNotification } from '@/services/notificationService';

const PAGE_SIZE = 20;

/** Every notification, newest first — the bell's "View all". Shared by the student and tutor dashboards. */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  // The bell's hook is reused for the mark-read actions (and keeps its cache in step).
  const { unread, markRead, markAllRead } = useNotifications(undefined, { live: false });

  const { data, isLoading } = useQuery({
    queryKey: notificationKeys.page(unreadOnly, page),
    queryFn: () => notificationService.list({ unread: unreadOnly, page, size: PAGE_SIZE }),
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Bookings, reminders, payments and updates — all in one place."
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(v) => {
          setUnreadOnly(v === 'unread');
          setPage(0);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread{unread > 0 ? ` (${unread})` : ''}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 rounded-2xl border bg-card p-2 shadow-soft">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="mt-3 font-semibold">
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadOnly
                ? 'You’re all caught up.'
                : 'Bookings, reminders and updates will show up here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((n) => (
              <NotificationItem key={n.id} n={n} onOpen={open} />
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Newer
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Older <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
