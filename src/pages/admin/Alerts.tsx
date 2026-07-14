import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Ban, Eye, ShieldCheck, Loader2, X } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Panel } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { adminService, type AdminNotification } from '@/services/adminService';
import { adminAlertCountKey } from '@/hooks/useAdminAlerts';

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

  const busy = resolve.isPending || block.isPending;

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Rule violations and safety flags that need your attention."
        action={<Badge variant="gold" className="h-8 px-3 text-sm">{data.length} open</Badge>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <Panel className="items-center p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-display text-lg font-bold">No open alerts</p>
          <p className="text-sm text-muted-foreground">Everyone’s playing by the rules right now.</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {data.map((n) => (
            <div key={n.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{n.subjectName ?? 'Unknown account'}</span>
                    {n.subjectRole && (
                      <Badge variant="secondary" className="text-[10px] uppercase">{n.subjectRole}</Badge>
                    )}
                    <Badge variant="destructive">{n.occurrences}× violations</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {n.subjectRole === 'TUTOR' && n.subjectAccountId && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/tutors/${n.subjectAccountId}`}>
                          <Eye className="h-4 w-4" /> View tutor
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      disabled={busy || !n.subjectAccountId}
                      onClick={() => block.mutate(n)}
                    >
                      <Ban className="h-4 w-4" /> Block account
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => resolve.mutate(n.id)}>
                      <X className="h-4 w-4" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
