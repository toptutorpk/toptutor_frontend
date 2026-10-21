import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Pencil,
  Search,
  Settings,
  Clock,
  Coins,
  Users,
  Video,
  ShieldCheck,
  MessageSquareWarning,
  Activity,
  Percent,
  Award,
  Hourglass,
  Wallet,
  Landmark,
  CalendarClock,
  TriangleAlert,
  ShieldAlert,
  Crown,
  List,
  History,
  LockKeyhole,
  type LucideIcon,
} from 'lucide-react';
import { adminService, type SystemParameter } from '@/services/adminService';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { DataTable, type Column } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { PasswordInput } from '@/components/common/PasswordInput';
import { SystemParameterHistory } from '@/components/admin/SystemParameterHistory';

const title = (key: string) => key.split('.').at(-1)!.replace(/_/g, ' ');
const queryKey = ['admin', 'system-configurations'];
const parameterIcons: Record<string, LucideIcon> = {
  'booking.cancellation_cutoff_hours': Clock,
  'booking.refund_fee_rate': Coins,
  'booking.tutor_cancellation_cutoff_hours': Users,
  'classroom.grace_minutes': Video,
  'classroom.allow_open_room': ShieldCheck,
  'messaging.contact_violation_threshold': MessageSquareWarning,
  'presence.online_window_seconds': Activity,
  'payout.commission_rate_default': Percent,
  'payout.commission_rate_loyal': Award,
  'payout.loyalty_session_threshold': Award,
  'payout.escrow_release_hours': Hourglass,
  'payout.min_withdrawal_pkr': Wallet,
  'payout.account_change_cooloff_hours': CalendarClock,
  'institute.payroll_fee_rate': Landmark,
  'tutor.strike_window_days': CalendarClock,
  'tutor.strike_warn_points': TriangleAlert,
  'tutor.strike_pause_points': ShieldAlert,
  'tutor_subscription.monthly_price_pkr': Crown,
  'tutor_subscription.six_month_discount_percent': Percent,
};

function ParameterName({ parameter }: { parameter: SystemParameter }) {
  const Icon = parameterIcons[parameter.key] ?? Settings;
  return (
    <div className="flex min-h-14 min-w-56 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold capitalize">{title(parameter.key)}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">{parameter.key}</p>
      </div>
    </div>
  );
}
const hint = (key: string) =>
  key.endsWith('_rate') || key.includes('commission_rate_')
    ? 'Enter a fraction from 0 to 1 (0.20 means 20%), up to four decimal places.'
    : key === 'tutor_subscription.six_month_discount_percent'
      ? 'Percentage below 100. Six-month price = monthly price × 6 × (1 − discount / 100).'
      : key === 'tutor_subscription.monthly_price_pkr'
        ? 'PKR 0.01–999,999.99, with up to two decimal places. Applies to future purchases.'
        : key === 'classroom.grace_minutes'
          ? 'Enter a whole number from 0 to 60 minutes.'
          : 'Use the units described for this parameter.';

export default function SystemConfigurations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<(SystemParameter & { next: string; note: string }) | null>(
    null,
  );
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<{ key?: string } | null>(null);
  const query = useQuery({ queryKey, queryFn: () => adminService.parameters() });
  const save = useMutation({
    mutationFn: (edit: NonNullable<typeof draft>) =>
      adminService.updateParameter(edit.key, {
        value: edit.next.trim(),
        expectedValue: edit.value,
        note: edit.note.trim(),
        password,
      }),
    onSuccess: (rows) => {
      qc.setQueryData(queryKey, rows);
      void qc.invalidateQueries({ queryKey: ['admin', 'tutor'] });
      void qc.invalidateQueries({ queryKey: ['tutor', 'commission'] });
      void qc.invalidateQueries({ queryKey: ['earnings'] });
      setDraft(null);
      setPassword('');
      void qc.invalidateQueries({ queryKey: ['admin', 'configuration-history'] });
      toast.success('System configuration updated');
    },
    onError: (e) => {
      setPassword('');
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
      void query.refetch();
    },
  });
  const rows = (query.data ?? []).filter((row) =>
    `${row.key} ${row.description ?? ''} ${row.value}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const columns: Column<SystemParameter>[] = [
    {
      header: 'Parameter',
      className: 'w-[32%]',
      cell: (row) => <ParameterName parameter={row} />,
    },
    {
      header: 'Description',
      cell: (row) => (
        <p className="min-w-60 max-w-xl text-muted-foreground">
          {row.description || 'No description provided.'}
        </p>
      ),
    },
    {
      header: 'Current value',
      className: 'w-48',
      cell: (row) => (
        <span
          title={row.value}
          className="flex h-10 w-40 items-center rounded-lg border bg-secondary/30 px-3 font-display text-sm font-semibold tracking-wide text-foreground tabular-nums"
        >
          <span className="truncate">{row.value}</span>
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'w-52',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={`View history for ${title(row.key)}`}
            onClick={() => setHistory({ key: row.key })}
          >
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError('');
              setPassword('');
              setDraft({ ...row, next: row.value, note: '' });
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div>
      <PageHeader
        title="System Configurations"
        description="Manage platform parameters and subscription pricing in one place."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <List aria-hidden="true" className="h-4 w-4" />
          {query.data?.length ?? '—'} system parameters
        </p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setHistory({})}>
            <History aria-hidden="true" className="h-4 w-4" />
            Change history
          </Button>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search system configurations"
              placeholder="Search parameters…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      {query.isPending ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : query.isError ? (
        <div className="rounded-2xl border bg-card p-6" role="alert">
          <p className="mb-3 text-sm text-muted-foreground">
            Could not load system configurations.
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex h-[min(68vh,760px)] min-h-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
          <DataTable
            embedded
            scrollable
            columns={columns}
            rows={rows}
            getKey={(row) => row.key}
            empty={search ? 'No matching parameters.' : 'No system parameters available.'}
          />
        </div>
      )}
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !save.isPending) {
            setDraft(null);
            setPassword('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit system configuration</DialogTitle>
            <DialogDescription>
              Changes apply across the platform. Provide a reason and confirm your admin password to
              save.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="system-configuration-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !save.isPending &&
                  password &&
                  draft.note.trim() &&
                  draft.next.trim() !== draft.value
                )
                  save.mutate(draft);
              }}
            >
              <div className="rounded-xl border bg-secondary/20 p-3">
                <p className="break-all text-sm font-semibold">{draft.key}</p>
                <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  Current value: {draft.value}
                </p>
              </div>
              <div>
                <Label htmlFor="configuration-value">New value</Label>
                {draft.key === 'classroom.allow_open_room' ? (
                  <Select
                    value={draft.next}
                    disabled={save.isPending}
                    onValueChange={(next) => setDraft({ ...draft, next })}
                  >
                    <SelectTrigger id="configuration-value" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="configuration-value"
                    className="mt-1"
                    autoComplete="off"
                    required
                    maxLength={255}
                    disabled={save.isPending}
                    value={draft.next}
                    onChange={(e) => setDraft({ ...draft, next: e.target.value })}
                  />
                )}
                <p className="mt-2 text-xs text-muted-foreground">{hint(draft.key)}</p>
              </div>
              <div>
                <Label htmlFor="configuration-note">Reason for change</Label>
                <Textarea
                  id="configuration-note"
                  className="mt-1"
                  required
                  maxLength={500}
                  disabled={save.isPending}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="configuration-password" className="flex items-center gap-2">
                  <LockKeyhole aria-hidden="true" className="h-4 w-4 text-primary" />
                  Admin password
                </Label>
                <PasswordInput
                  id="configuration-password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  disabled={save.isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your password is required for every change. The value, time, admin and reason will
                  be recorded.
                </p>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={save.isPending}
              onClick={() => {
                setDraft(null);
                setPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              type="submit"
              form="system-configuration-form"
              disabled={
                save.isPending ||
                !password ||
                !draft?.next.trim() ||
                !draft.note.trim() ||
                draft.next.trim() === draft.value
              }
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {history && (
        <SystemParameterHistory parameterKey={history.key} onClose={() => setHistory(null)} />
      )}
    </div>
  );
}
