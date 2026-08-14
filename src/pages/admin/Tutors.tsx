import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { DataTable, Toolbar, PersonCell, AccountBadge, VerifyBadge, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import { getInitials } from '@/lib/utils';
import { toNationalDisplay } from '@/lib/phone';
import { adminService, type AdminTutorSummary } from '@/services/adminService';

export default function AdminTutors() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'tutors'], queryFn: () => adminService.tutors() });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [verify, setVerify] = useState('all');
  const [selected, setSelected] = useState<AdminTutorSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (t) =>
        (status === 'all' || t.status === status) &&
        (verify === 'all' || t.verification === verify) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          (t.city ?? '').toLowerCase().includes(q)),
    );
  }, [data, query, status, verify]);

  const setTutorStatus = async (t: AdminTutorSummary, next: 'active' | 'suspended') => {
    setBusy(true);
    try {
      await adminService.setStatus(t.id, next);
      await qc.invalidateQueries({ queryKey: ['admin', 'tutors'] });
      toast.success(next === 'suspended' ? `${t.name} suspended` : `${t.name} re-activated`);
      setSelected(null);
    } catch {
      toast.error('Could not update status');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminTutorSummary>[] = [
    { header: 'Tutor', cell: (t) => <PersonCell name={t.name} sub={t.email} /> },
    { header: 'City', cell: (t) => t.city ?? '—' },
    { header: 'Phone', cell: (t) => toNationalDisplay(t.phone) || '—' },
    { header: 'Verification', cell: (t) => <VerifyBadge status={t.verification} /> },
    { header: 'Steps', align: 'center', cell: (t) => `${t.stepsPassed}/${t.stepsTotal}` },
    { header: 'Status', cell: (t) => <AccountBadge status={t.status} /> },
    { header: 'Joined', cell: (t) => (t.createdAt ? t.createdAt.slice(0, 10) : '—') },
    {
      header: '',
      align: 'right',
      cell: (t) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(t)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tutors" description="Every teacher on the platform — live data." />

      <Toolbar
        left={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or city…"
              className="h-10 pl-9"
            />
          </div>
        }
        right={
          <>
            <Select value={verify} onValueChange={setVerify}>
              <SelectTrigger className="h-10 w-44">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <p className="mb-3 text-sm text-muted-foreground">
        {isLoading ? 'Loading…' : (
          <>Showing <span className="font-semibold text-foreground">{rows.length}</span> of {data?.length ?? 0} tutors</>
        )}
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} getKey={(t) => String(t.id)} empty="No tutors match your filters." />
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Tutor details</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{getInitials(selected.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-display text-lg font-bold">{selected.name}</div>
                  <div className="text-sm text-muted-foreground">{selected.email}</div>
                  <div className="mt-1.5 flex gap-2">
                    <VerifyBadge status={selected.verification} />
                    <AccountBadge status={selected.status} />
                  </div>
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <Detail label="City" value={selected.city ?? '—'} />
                <Detail label="Phone" value={toNationalDisplay(selected.phone) || '—'} />
                <Detail label="Verification steps" value={`${selected.stepsPassed}/${selected.stepsTotal} passed`} />
                <Detail label="Joined" value={selected.createdAt?.slice(0, 10) ?? '—'} />
              </dl>
              <div className="flex justify-end gap-2 border-t pt-4">
                {selected.status === 'suspended' ? (
                  <Button variant="gradient" disabled={busy} onClick={() => setTutorStatus(selected, 'active')}>
                    Re-activate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="text-red-600"
                    disabled={busy}
                    onClick={() => setTutorStatus(selected, 'suspended')}
                  >
                    Suspend account
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
