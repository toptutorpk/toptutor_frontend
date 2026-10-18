import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  Check,
  Clock,
  Copy,
  Eye,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BankLogo } from '@/components/common/BankLogo';
import { PageHeader, StatCard } from '@/components/dashboard/DashboardKit';
import { DataTable, PersonCell, Toolbar, type Column } from '@/components/admin/AdminKit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { adminPayoutService, type AdminPayoutAccount } from '@/services/payoutService';

const KEY = ['admin', 'payout-accounts'] as const;

/**
 * Where an admin sees the accounts tutors are paid into.
 *
 * <p>Masked throughout. The full number is one deliberate click away, on a tutor at a time, and
 * every reveal is recorded against the admin who asked — finance genuinely needs it to make a
 * transfer, and that need is exactly why it must not be sitting on a list page.
 */
export default function AdminPayoutAccounts() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: adminPayoutService.list });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<AdminPayoutAccount | null>(null);

  const accounts = useMemo(() => data ?? [], [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'flagged' && (!a.titleMatched || a.numberShared)) ||
        (filter === 'blocked' && a.status === 'REJECTED') ||
        (filter === 'cooling' && a.coolingOff);
      const matchesQuery =
        !q ||
        a.tutorName.toLowerCase().includes(q) ||
        a.tutorEmail.toLowerCase().includes(q) ||
        a.accountTitle.toLowerCase().includes(q) ||
        a.provider.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [accounts, filter, query]);

  const flagged = accounts.filter((a) => !a.titleMatched || a.numberShared).length;
  const blocked = accounts.filter((a) => a.status === 'REJECTED').length;
  const cooling = accounts.filter((a) => a.coolingOff).length;

  const columns: Column<AdminPayoutAccount>[] = [
    {
      header: 'Tutor',
      cell: (a) => <PersonCell name={a.tutorName || '—'} sub={a.tutorEmail} />,
    },
    {
      header: 'Paid into',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <BankLogo name={a.provider} size="sm" className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate font-medium">{a.provider}</p>
            <p className="truncate text-xs tabular-nums text-muted-foreground">{a.maskedNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Account title',
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate">{a.accountTitle}</p>
          {!a.titleMatched && (
            <p className="truncate text-xs text-amber-600 dark:text-amber-400">
              Verified name: {a.tutorName || 'not on file'}
            </p>
          )}
        </div>
      ),
    },
    { header: 'Flags', cell: (a) => <Flags account={a} /> },
    {
      header: 'Changed',
      cell: (a) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(a.changedAtIso), { addSuffix: true })}
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      cell: (a) => (
        <Button variant="ghost" size="sm" onClick={() => setSelected(a)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payout accounts"
        description="The bank accounts and wallets tutors are paid into. Numbers stay encrypted — reveal one only to make a transfer."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          icon="Wallet"
          label="Registered accounts"
          value={String(accounts.length)}
          accent="brand"
        />
        <StatCard icon="Flag" label="Flagged for a look" value={String(flagged)} accent="amber" />
        <StatCard icon="Clock" label="In cooling-off" value={String(cooling)} accent="violet" />
        <StatCard icon="Ban" label="Blocked" value={String(blocked)} accent="rose" />
      </div>

      <Toolbar
        left={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutor, email or account title…"
              className="pl-9"
            />
          </div>
        }
        right={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="cooling">In cooling-off</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getKey={(a) => String(a.tutorAccountId)}
          empty="No payout accounts registered yet."
        />
      )}

      {selected && (
        <AccountDialog tutorId={selected.tutorAccountId} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Flags({ account }: { account: AdminPayoutAccount }) {
  const flags = [];
  if (account.status === 'REJECTED') {
    flags.push(
      <Badge key="blocked" variant="destructive">
        <Ban className="h-3 w-3" /> Blocked
      </Badge>,
    );
  }
  if (!account.titleMatched) {
    flags.push(
      <Badge key="name" variant="warning">
        <AlertTriangle className="h-3 w-3" /> Name mismatch
      </Badge>,
    );
  }
  if (account.numberShared) {
    flags.push(
      <Badge key="shared" variant="warning">
        <Users className="h-3 w-3" /> Shared number
      </Badge>,
    );
  }
  if (account.coolingOff) {
    flags.push(
      <Badge key="cooling" variant="secondary">
        <Clock className="h-3 w-3" /> Cooling off
      </Badge>,
    );
  }
  if (flags.length === 0) {
    return (
      <Badge variant="success">
        <Check className="h-3 w-3" /> Clear
      </Badge>
    );
  }
  return <div className="flex flex-wrap gap-1.5">{flags}</div>;
}

/** One account, its history, and the two things an admin can do about it. */
function AccountDialog({ tutorId, onClose }: { tutorId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: account, isLoading } = useQuery({
    queryKey: [...KEY, tutorId],
    queryFn: () => adminPayoutService.get(tutorId),
  });
  const [revealed, setRevealed] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [notes, setNotes] = useState('');

  const reveal = useMutation({
    mutationFn: () => adminPayoutService.reveal(tutorId),
    onSuccess: (number) => {
      setRevealed(number);
      // The reveal wrote an audit row, so the history on screen is now out of date.
      void qc.invalidateQueries({ queryKey: [...KEY, tutorId] });
    },
    onError: (e) => toast.error('Could not reveal the number', { description: message(e) }),
  });

  const decide = useMutation({
    mutationFn: (status: 'ACTIVE' | 'REJECTED') =>
      adminPayoutService.decide(tutorId, status, status === 'REJECTED' ? notes : undefined),
    onSuccess: (updated) => {
      qc.setQueryData([...KEY, tutorId], updated);
      void qc.invalidateQueries({ queryKey: KEY });
      setBlocking(false);
      setNotes('');
      toast.success(updated.status === 'REJECTED' ? 'Account blocked' : 'Account restored');
    },
    onError: (e) => toast.error('Could not save that decision', { description: message(e) }),
  });

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payout account</DialogTitle>
          <DialogDescription>
            {account ? `${account.tutorName || 'Tutor'} · ${account.tutorEmail}` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !account ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-secondary/25 p-4 text-sm">
              <Detail
                label="Method"
                value={account.method === 'BANK' ? 'Bank account' : 'Mobile wallet'}
              />
              <Detail
                label={account.method === 'BANK' ? 'Bank' : 'Wallet'}
                value={account.provider}
              />
              <Detail label="Account title" value={account.accountTitle} />
              <Detail label="Verified name" value={account.tutorName || '—'} />
              <Detail label="Number" value={account.maskedNumber} mono />
              <Detail
                label="Last changed"
                value={format(parseISO(account.changedAtIso), 'd MMM yyyy, HH:mm')}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Flags account={account} />
            </div>

            {account.coolingOff && account.payableFromIso && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Changed too recently to be paid. Payable{' '}
                  {formatDistanceToNow(parseISO(account.payableFromIso), { addSuffix: true })}.
                </span>
              </p>
            )}

            {account.status === 'REJECTED' && account.reviewNotes && (
              <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Ban className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Blocked: {account.reviewNotes}</span>
              </p>
            )}

            <RevealPanel
              revealed={revealed}
              pending={reveal.isPending}
              blocked={account.status === 'REJECTED'}
              onReveal={() => reveal.mutate()}
            />

            {account.history && account.history.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">History</h3>
                <ol className="space-y-2">
                  {account.history.map((h) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {ACTION_LABEL[h.action] ?? h.action}
                          {h.last4 && (
                            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
                              ••••{h.last4}
                            </span>
                          )}
                        </p>
                        {h.detail && <p className="text-xs text-muted-foreground">{h.detail}</p>}
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(h.createdAtIso), 'd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {blocking && (
              <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <Label htmlFor="block-reason">Why is this account being blocked?</Label>
                <Textarea
                  id="block-reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. The account title does not match the verified CNIC name."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  The tutor is shown this, so it needs to say what they must fix.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {account?.status === 'REJECTED' ? (
            <Button
              variant="outline"
              disabled={decide.isPending}
              onClick={() => decide.mutate('ACTIVE')}
            >
              Restore account
            </Button>
          ) : blocking ? (
            <>
              <Button
                variant="outline"
                onClick={() => setBlocking(false)}
                disabled={decide.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={notes.trim() === '' || decide.isPending}
                onClick={() => decide.mutate('REJECTED')}
              >
                {decide.isPending ? 'Blocking…' : 'Block account'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setBlocking(true)} disabled={!account}>
              <Ban className="h-4 w-4" /> Block account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The one place a full account number appears.
 *
 * <p>Behind a click, and behind a plain statement that the click is recorded. An admin who knows
 * their name goes on the audit row treats the button differently from one who does not, and that
 * difference is most of what the audit trail is for.
 */
function RevealPanel({
  revealed,
  pending,
  blocked,
  onReveal,
}: {
  revealed: string | null;
  pending: boolean;
  blocked: boolean;
  onReveal: () => void;
}) {
  if (blocked && !revealed) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        This account is blocked and must not be paid to. Restore it first if that was a mistake.
      </div>
    );
  }

  if (revealed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Full account number
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 break-all font-mono text-base">{revealed}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(revealed);
              toast.success('Copied');
            }}
          >
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This view was recorded against your account. Close this dialog when you are done.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-secondary/25 p-4">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>The number is encrypted. Reveal it only when you are making a transfer.</span>
      </p>
      <Button variant="outline" size="sm" onClick={onReveal} disabled={pending}>
        <Eye className="h-4 w-4" /> {pending ? 'Revealing…' : 'Reveal number'}
      </Button>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('truncate font-medium', mono && 'font-mono tabular-nums')}>{value}</p>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  CREATED: 'Account added by the tutor',
  CHANGED: 'Account changed by the tutor',
  APPROVED: 'Restored by an admin',
  REJECTED: 'Blocked by an admin',
  REVEALED: 'Number revealed to an admin',
};

function message(e: unknown) {
  return e instanceof Error ? e.message : 'Please try again.';
}
