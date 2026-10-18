import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  Loader2,
  Handshake,
  Check,
  X,
  Building2,
  Wallet,
  CalendarClock,
  Clock,
  CheckCircle2,
  FileSignature,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import {
  tutorContractService,
  tutorOfferService,
  tutorPayrollService,
  type Contract,
  type ContractStatus,
  type Offer,
  type OfferStatus,
  type PayrollCycle,
  type PayrollStatus,
  type Placement,
  type PlacementStatus,
} from '@/services/instituteService';
import { ContractDialog } from '@/components/institute/ContractDialog';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { formatPKR, cn } from '@/lib/utils';
import { InstituteLink } from '@/components/institute/InstituteLink';

const OFFER_BADGE: Record<
  OfferStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  OFFERED: { label: 'Needs your answer', variant: 'gold' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'You declined', variant: 'secondary' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'secondary' },
};

const PLACEMENT_BADGE: Record<
  PlacementStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  PENDING_START: { label: 'Confirm when you start', variant: 'gold' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ENDED: { label: 'Ended', variant: 'secondary' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

type Tab = 'offers' | 'placements' | 'contracts' | 'payroll';

export default function TutorOffers() {
  const [tab, setTab] = useState<Tab>('offers');

  const offers = useQuery({
    queryKey: ['tutor', 'offers'],
    queryFn: () => tutorOfferService.offers(),
  });
  const placements = useQuery({
    queryKey: ['tutor', 'placements'],
    queryFn: () => tutorOfferService.placements(),
  });
  const contracts = useQuery({
    queryKey: ['tutor', 'contracts'],
    queryFn: () => tutorContractService.list(),
  });
  const payroll = useQuery({
    queryKey: ['tutor', 'payroll'],
    queryFn: () => tutorPayrollService.list(),
  });

  const pending = (offers.data ?? []).filter((o) => o.status === 'OFFERED' && !o.expired).length;
  const toConfirm = (placements.data ?? []).filter((p) => p.awaitingMe).length;
  const toSign = (contracts.data ?? []).filter((c) => c.myTurn).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Offers</h1>
        <p className="mt-1 text-muted-foreground">
          Roles institutes have offered you, the placements you accepted, and what they pay.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'offers'} count={pending} onClick={() => setTab('offers')}>
          Offers
        </TabButton>
        <TabButton
          active={tab === 'placements'}
          count={toConfirm}
          onClick={() => setTab('placements')}
        >
          My placements
        </TabButton>
        <TabButton active={tab === 'contracts'} count={toSign} onClick={() => setTab('contracts')}>
          Contracts
        </TabButton>
        <TabButton active={tab === 'payroll'} onClick={() => setTab('payroll')}>
          Payroll
        </TabButton>
      </div>

      {tab === 'offers' && (
        <Section
          query={offers}
          errorMessage="Could not load offers."
          loading="Loading offers…"
          empty={
            <Empty
              icon={Handshake}
              title="No offers yet"
              body="Institutes offer roles to teachers they find in the database or who apply to their jobs. Make sure institute hiring is turned on."
            />
          }
          render={(rows) => rows.map((o) => <OfferRow key={o.id} offer={o} />)}
        />
      )}

      {tab === 'placements' && (
        <Section
          query={placements}
          errorMessage="Could not load placements."
          loading="Loading placements…"
          empty={
            <Empty
              icon={CheckCircle2}
              title="No placements yet"
              body="Accepting an offer creates a placement here. Completed ones become verified work history on your profile."
            />
          }
          render={(rows) => rows.map((p) => <PlacementRow key={p.id} placement={p} />)}
        />
      )}

      {tab === 'contracts' && (
        <Section
          query={contracts}
          errorMessage="Could not load contracts."
          loading="Loading contracts…"
          empty={
            <Empty
              icon={FileSignature}
              title="No contracts yet"
              body="Once you accept an offer, the institute draws up a contract and sends it here to sign. Nothing binds you until you do."
            />
          }
          render={(rows) => rows.map((c) => <ContractRow key={c.id} contract={c} />)}
        />
      )}

      {tab === 'payroll' && (
        <Section
          query={payroll}
          errorMessage="Could not load payroll."
          loading="Loading payroll…"
          empty={
            <Empty
              icon={Banknote}
              title="No payroll yet"
              body="When an institute pays you through TopTutor, each month shows here — including while we are holding it for you."
            />
          }
          render={(rows) => rows.map((c) => <PayrollRow key={c.id} cycle={c} />)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? 'default' : 'outline'} onClick={onClick}>
      {children}
      {count != null && count > 0 && (
        <span className="ml-1.5 rounded-full bg-gold-400 px-1.5 text-xs font-bold text-gold-950">
          {count}
        </span>
      )}
    </Button>
  );
}

/**
 * The loading / error / empty / rows ladder, once.
 *
 * <p>Four tabs each spelling out the same four states is where one of them quietly ends up with no
 * error branch, and a failed request renders as "nothing here" — which is a different and much
 * worse thing to tell someone about their salary.
 */
function Section<T>({
  query,
  loading,
  errorMessage,
  empty,
  render,
}: {
  query: UseQueryResult<T[]>;
  loading: string;
  errorMessage: string;
  empty: React.ReactNode;
  render: (rows: T[]) => React.ReactNode;
}) {
  if (query.isLoading) return <LoadingState label={loading} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} message={errorMessage} />;
  const rows = query.data ?? [];
  if (rows.length === 0) return <>{empty}</>;
  return <div className="space-y-4">{render(rows)}</div>;
}

function OfferRow({ offer }: { offer: Offer }) {
  const qc = useQueryClient();
  const respond = useMutation({
    mutationFn: (accept: boolean) => tutorOfferService.respond(offer.id, accept),
    onSuccess: (_d, accept) => {
      toast.success(accept ? 'Offer accepted' : 'Offer declined', {
        description: accept ? 'Confirm your start date once you begin.' : undefined,
      });
      qc.invalidateQueries({ queryKey: ['tutor'] });
    },
    onError: (e) =>
      toast.error('Could not respond', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const live = offer.status === 'OFFERED' && !offer.expired;
  const badge = OFFER_BADGE[offer.status];

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-soft',
        live && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{offer.title}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <InstituteLink name={offer.instituteName} slug={offer.instituteSlug} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> {formatPKR(offer.monthlySalary)}/month
            </span>
            {offer.startsOn && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Starts {new Date(offer.startsOn).toLocaleDateString()}
              </span>
            )}
            {live && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Reply by {new Date(offer.expiresOn).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Badge variant={offer.expired && offer.status === 'OFFERED' ? 'destructive' : badge.variant}>
          {offer.expired && offer.status === 'OFFERED' ? 'Expired' : badge.label}
        </Badge>
      </div>

      {offer.message && (
        <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">{offer.message}</p>
      )}

      {live && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="gradient"
            size="sm"
            disabled={respond.isPending}
            onClick={() => respond.mutate(true)}
          >
            {respond.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Accept offer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={respond.isPending}
            onClick={() => respond.mutate(false)}
          >
            <X className="h-3.5 w-3.5" /> Decline
          </Button>
        </div>
      )}
    </article>
  );
}

function PlacementRow({ placement: p }: { placement: Placement }) {
  const qc = useQueryClient();
  const confirm = useMutation({
    mutationFn: () => tutorOfferService.confirmPlacement(p.id),
    onSuccess: (updated) => {
      toast.success(
        updated.status === 'ACTIVE'
          ? 'Confirmed — this is now part of your verified work history'
          : 'Confirmed. Waiting for the institute to confirm too.',
      );
      qc.invalidateQueries({ queryKey: ['tutor'] });
    },
    onError: (e) =>
      toast.error('Could not confirm', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const badge = PLACEMENT_BADGE[p.status];

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-soft',
        p.awaitingMe && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold leading-tight">{p.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {p.instituteName ?? 'Verified institute'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatPKR(p.monthlySalary)}/month</span>
            {p.startsOn && <span>Starts {new Date(p.startsOn).toLocaleDateString()}</span>}
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {p.status === 'PENDING_START' && (
        <div className="mt-4 rounded-xl border bg-card p-3.5 text-sm">
          <p className="leading-relaxed">
            Confirm once you have actually started. Both you and the institute confirm, which is
            what turns this into verified work history on your profile.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={cn(p.tutorConfirmed && 'font-medium text-emerald-600')}>
              {p.tutorConfirmed ? '✓ You confirmed' : 'You haven’t confirmed'}
            </span>
            <span className={cn(p.instituteConfirmed && 'font-medium text-emerald-600')}>
              {p.instituteConfirmed ? '✓ Institute confirmed' : 'Institute hasn’t confirmed'}
            </span>
          </div>
          {p.awaitingMe && (
            <Button
              className="mt-3"
              size="sm"
              variant="gradient"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              I've started
            </Button>
          )}
        </div>
      )}

      {p.endReason && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Reason: </span>{p.endReason}
        </p>
      )}
    </article>
  );
}

const CONTRACT_BADGE: Record<
  ContractStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  // A teacher never sees a DRAFT, but the map has to be total for the type.
  DRAFT: { label: 'Being drafted', variant: 'secondary' },
  SENT: { label: 'Needs your signature', variant: 'gold' },
  SIGNED: { label: 'Signed by both', variant: 'success' },
  VOID: { label: 'Withdrawn', variant: 'secondary' },
};

function ContractRow({ contract: c }: { contract: Contract }) {
  const [open, setOpen] = useState(false);
  const badge = CONTRACT_BADGE[c.status];

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-soft',
        c.myTurn && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold leading-tight">{c.title}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <InstituteLink name={c.instituteName} slug={c.instituteSlug} />
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatPKR(c.monthlySalary)}/month</span>
            {c.startsOn && <span>Starts {new Date(c.startsOn).toLocaleDateString()}</span>}
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="mt-3">
        <Button size="sm" variant={c.myTurn ? 'gradient' : 'outline'} onClick={() => setOpen(true)}>
          <FileSignature className="h-3.5 w-3.5" />
          {c.myTurn ? 'Read and sign' : 'View contract'}
        </Button>
      </div>

      {open && (
        <ContractDialog contract={c} side="tutor" onClose={() => setOpen(false)} />
      )}
    </article>
  );
}

const PAYROLL_BADGE: Record<
  PayrollStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  DUE: { label: 'Not funded yet', variant: 'secondary' },
  FUNDED: { label: 'Secured for you', variant: 'gold' },
  RELEASED: { label: 'Paid', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

/**
 * One month of institute salary, from the teacher's side.
 *
 * <p>Read-only, and that is the design: the institute funds and releases. What this gives a teacher
 * is sight of the money before it moves — a month sitting in escrow is the reassurance the feature
 * exists to provide, so `FUNDED` gets a line of its own rather than a quiet grey badge.
 */
function PayrollRow({ cycle: c }: { cycle: PayrollCycle }) {
  const badge = PAYROLL_BADGE[c.status];

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold leading-tight">
            {c.periodLabel} — {c.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{c.counterparty}</p>
          {c.tutorNet != null && (
            <p className="mt-1.5 font-semibold tabular-nums">{formatPKR(c.tutorNet)}</p>
          )}
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {c.status === 'FUNDED' && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          TopTutor is holding this month for you. It reaches your balance when the institute
          releases it.
        </p>
      )}

      {c.note && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Note: </span>
          {c.note}
        </p>
      )}
    </article>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Handshake;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
