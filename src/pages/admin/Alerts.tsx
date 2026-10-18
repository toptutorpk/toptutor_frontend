import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  CalendarX2,
  PlayCircle,
  UserX,
  Video,
  VideoOff,
  Ban,
  ExternalLink,
  Eye,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Panel } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { adminService, type AdminNotification } from '@/services/adminService';
import { adminAlertCountKey } from '@/hooks/useAdminAlerts';

/**
 * How each alert type is shown. Alerts started out as contact-sharing violations only, so everything
 * used to render as one — a refund to send is not a violation, and offering "Block account" on it
 * would suspend a parent for cancelling a session.
 */
const KIND: Record<
  string,
  {
    icon: typeof AlertTriangle;
    tile: string;
    badge: (n: AdminNotification) => string;
    variant: 'destructive' | 'warning' | 'info';
    link?: { to: string; label: string };
    canBlock: boolean;
  }
> = {
  CONTACT_VIOLATION: {
    icon: AlertTriangle,
    tile: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    badge: (n) => `${n.occurrences}× violations`,
    variant: 'destructive',
    canBlock: true,
  },
  REFUND_REQUESTED: {
    icon: RotateCcw,
    tile: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    badge: () => 'Refund to send',
    variant: 'info',
    link: { to: '/admin/refunds', label: 'Open refunds' },
    canBlock: false,
  },
  MISCONDUCT_REPORT: {
    icon: ShieldAlert,
    tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badge: () => 'Report',
    variant: 'warning',
    link: { to: '/admin/reports', label: 'Open reports' },
    canBlock: false,
  },
  // A session needs a look (one side absent, never held, no recording). The tutor is the subject so
  // the alert can name them — but this is a question, not an accusation, so no Block button.
  SESSION_ISSUE: {
    icon: Video,
    tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badge: () => 'Session check',
    variant: 'warning',
    link: { to: '/admin/bookings', label: 'Open bookings' },
    canBlock: false,
  },
  // Reliability strikes crossed the warning or the pause threshold.
  TUTOR_STRIKES: {
    icon: CalendarX2,
    tile: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    badge: (n) => (/paused/i.test(n.title) ? 'Bookings paused' : 'Reliability'),
    variant: 'warning',
    canBlock: false,
  },
  CLASSROOM_DOWN: {
    icon: VideoOff,
    tile: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    badge: () => 'Classroom offline',
    variant: 'destructive',
    canBlock: false,
  },
};

export default function AdminAlerts() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminService.notifications(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    qc.invalidateQueries({ queryKey: adminAlertCountKey });
    qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const resolve = useMutation({
    mutationFn: (id: number) => adminService.resolveNotification(id),
    onSuccess: () => {
      invalidate();
      toast.success('Alert dismissed');
    },
  });

  const block = useMutation({
    mutationFn: async (n: AdminNotification) => {
      if (n.subjectAccountId) await adminService.setStatus(n.subjectAccountId, 'suspended');
      await adminService.resolveNotification(n.id);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Account blocked', { description: 'The account has been suspended.' });
    },
    onError: () => toast.error('Could not block the account'),
  });

  const resume = useMutation({
    mutationFn: async (n: AdminNotification) => {
      await adminService.resumeBookings(n.subjectAccountId!);
      await adminService.resolveNotification(n.id);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Bookings resumed', {
        description: 'The tutor is back in search and can be booked.',
      });
    },
    onError: () => toast.error('Could not resume bookings'),
  });

  // From a session alert: the tutor cancelled late through support, or didn't turn up.
  const strike = useMutation({
    mutationFn: async ({ n, kind }: { n: AdminNotification; kind: 'LATE_CANCEL' | 'NO_SHOW' }) => {
      await adminService.addStrike(n.subjectAccountId!, {
        kind,
        bookingId: bookingIdOf(n),
        note: n.title,
      });
      await adminService.resolveNotification(n.id);
    },
    onSuccess: (_, { kind }) => {
      invalidate();
      toast.success(kind === 'NO_SHOW' ? 'No-show recorded' : 'Late cancellation recorded', {
        description: 'It counts toward the tutor’s reliability strikes.',
      });
    },
    onError: () => toast.error('Could not record the strike'),
  });

  const busy = resolve.isPending || block.isPending || resume.isPending || strike.isPending;

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Rule violations, safety reports, refunds and tutor reliability that need your attention."
        action={
          <Badge variant="gold" className="h-8 px-3 text-sm">
            {data.length} open
          </Badge>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <Panel className="items-center p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-display text-lg font-bold">No open alerts</p>
          <p className="text-sm text-muted-foreground">
            Everyone’s playing by the rules right now.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {data.map((n) => {
            const kind = KIND[n.type] ?? KIND.CONTACT_VIOLATION;
            const Icon = kind.icon;
            return (
              <div key={n.id} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kind.tile}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{n.subjectName ?? 'Unknown account'}</span>
                      {n.subjectRole && (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {n.subjectRole}
                        </Badge>
                      )}
                      <Badge variant={kind.variant}>{kind.badge(n)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {kind.link && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={kind.link.to}>
                            <ExternalLink className="h-4 w-4" /> {kind.link.label}
                          </Link>
                        </Button>
                      )}
                      {n.type === 'TUTOR_STRIKES' &&
                        /paused/i.test(n.title) &&
                        n.subjectAccountId && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => resume.mutate(n)}
                          >
                            <PlayCircle className="h-4 w-4" /> Resume bookings
                          </Button>
                        )}
                      {n.type === 'SESSION_ISSUE' && n.subjectAccountId && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => strike.mutate({ n, kind: 'NO_SHOW' })}
                          >
                            <UserX className="h-4 w-4" /> Tutor no-show
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => strike.mutate({ n, kind: 'LATE_CANCEL' })}
                          >
                            <CalendarX2 className="h-4 w-4" /> Late cancellation
                          </Button>
                        </>
                      )}
                      {(kind.canBlock || n.type === 'TUTOR_STRIKES') &&
                        n.subjectRole === 'TUTOR' &&
                        n.subjectAccountId && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/admin/tutors/${n.subjectAccountId}`}>
                              <Eye className="h-4 w-4" /> View tutor
                            </Link>
                          </Button>
                        )}
                      {kind.canBlock && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          disabled={busy || !n.subjectAccountId}
                          onClick={() => block.mutate(n)}
                        >
                          <Ban className="h-4 w-4" /> Block account
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => resolve.mutate(n.id)}
                      >
                        <X className="h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Session alerts are titled "… — booking #24"; the strike is linked to that booking. */
function bookingIdOf(n: AdminNotification): number | undefined {
  const m = /booking #(d+)/i.exec(n.title);
  return m ? Number(m[1]) : undefined;
}
