import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Panel, PersonCell } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { adminService, type AdminTutorSummary } from '@/services/adminService';

export default function AdminApprovals() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'tutors'], queryFn: () => adminService.tutors() });
  const [busy, setBusy] = useState(false);

  // Anyone who has submitted (under review) or is mid-way (partial) is awaiting a decision.
  const queue = useMemo(
    () => (data ?? []).filter((t) => t.verification === 'under_review' || t.verification === 'partial'),
    [data],
  );

  const decide = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    setBusy(true);
    try {
      await adminService.decide(id, decision);
      await qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast[decision === 'APPROVE' ? 'success' : 'error'](
        decision === 'APPROVE' ? 'Tutor approved & listed' : 'Application rejected',
        {
          description:
            decision === 'APPROVE'
              ? 'Their Verified Badge is now active.'
              : 'The tutor has been notified to make changes.',
        },
      );
    } catch {
      toast.error('Could not record decision');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tutor approvals"
        description="Open a tutor to review each document, or make a quick decision here."
        action={<Badge variant="gold" className="h-8 px-3 text-sm">{queue.length} pending</Badge>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : queue.length === 0 ? (
        <Panel className="items-center p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-display text-lg font-bold">All caught up!</p>
          <p className="text-sm text-muted-foreground">No tutors are waiting for review right now.</p>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {queue.map((t) => (
            <ApprovalCard key={t.id} tutor={t} busy={busy} onDecide={(d) => decide(t.id, d)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  tutor,
  busy,
  onDecide,
}: {
  tutor: AdminTutorSummary;
  busy: boolean;
  onDecide: (d: 'APPROVE' | 'REJECT') => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <PersonCell name={tutor.name} sub={`${tutor.city ?? '—'} · ${tutor.email}`} />
        <Badge variant="info">{tutor.stepsPassed}/{tutor.stepsTotal} steps</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Awaiting your review</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/admin/tutors/${tutor.id}`}>
              <Eye className="h-4 w-4" /> Review
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="text-red-600" disabled={busy} onClick={() => onDecide('REJECT')}>
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" variant="gradient" disabled={busy} onClick={() => onDecide('APPROVE')}>
            <Check className="h-4 w-4" /> Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
