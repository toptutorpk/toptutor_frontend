import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  CalendarClock,
  FileSignature,
} from 'lucide-react';
import {
  contractService,
  hiringService,
  type Contract,
  type Offer,
  type OfferStatus,
  type Placement,
  type PlacementStatus,
} from '@/services/instituteService';
import { ContractDialog } from '@/components/institute/ContractDialog';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { toast } from '@/components/ui/sonner';
import { formatPKR, getInitials, cn } from '@/lib/utils';

const OFFER_BADGE: Record<
  OfferStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  OFFERED: { label: 'Awaiting reply', variant: 'gold' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'secondary' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'secondary' },
};

const PLACEMENT_BADGE: Record<
  PlacementStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  PENDING_START: { label: 'Awaiting start', variant: 'gold' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ENDED: { label: 'Ended', variant: 'secondary' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

export default function InstituteHiring() {
  const [tab, setTab] = useState<'offers' | 'placements'>('offers');

  const offers = useQuery({
    queryKey: ['institute', 'offers'],
    queryFn: () => hiringService.offers(),
  });
  const placements = useQuery({
    queryKey: ['institute', 'placements'],
    queryFn: () => hiringService.placements(),
  });

  const awaitingConfirm = (placements.data ?? []).filter((p) => p.awaitingMe).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Hiring</h1>
        <p className="mt-1 text-muted-foreground">
          Offers you've sent, and the placements they became.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'offers' ? 'default' : 'outline'} onClick={() => setTab('offers')}>
          Offers
        </Button>
        <Button
          variant={tab === 'placements' ? 'default' : 'outline'}
          onClick={() => setTab('placements')}
        >
          Placements
          {awaitingConfirm > 0 && (
            <span className="ml-1.5 rounded-full bg-gold-400 px-1.5 text-xs font-bold text-gold-950">
              {awaitingConfirm}
            </span>
          )}
        </Button>
      </div>

      {tab === 'offers' ? (
        offers.isLoading ? (
          <LoadingState label="Loading offers…" />
        ) : offers.isError ? (
          <ErrorState onRetry={() => offers.refetch()} message="Could not load offers." />
        ) : (offers.data ?? []).length === 0 ? (
          <Empty
            icon={Handshake}
            title="No offers yet"
            body="Find a teacher and send them a role, or offer one to somebody who applied to a job post."
          />
        ) : (
          <div className="space-y-4">
            {offers.data!.map((o) => <OfferRow key={o.id} offer={o} />)}
          </div>
        )
      ) : placements.isLoading ? (
        <LoadingState label="Loading placements…" />
      ) : placements.isError ? (
        <ErrorState onRetry={() => placements.refetch()} message="Could not load placements." />
      ) : (placements.data ?? []).length === 0 ? (
        <Empty
          icon={CheckCircle2}
          title="No placements yet"
          body="When a teacher accepts an offer it becomes a placement here."
        />
      ) : (
        <div className="space-y-4">
          {placements.data!.map((p) => <PlacementRow key={p.id} placement={p} />)}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function OfferRow({ offer }: { offer: Offer }) {
  const qc = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => hiringService.withdrawOffer(offer.id),
    onSuccess: () => {
      toast.success('Offer withdrawn');
      qc.invalidateQueries({ queryKey: ['institute', 'offers'] });
    },
    onError: (e) =>
      toast.error('Could not withdraw', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const badge = OFFER_BADGE[offer.status];

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={offer.tutorPhotoUrl} alt={offer.tutorName} />
            <AvatarFallback>{getInitials(offer.tutorName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-display font-bold leading-tight">{offer.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">to {offer.tutorName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> {formatPKR(offer.monthlySalary)}/month
              </span>
              {offer.startsOn && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Starts {new Date(offer.startsOn).toLocaleDateString()}
                </span>
              )}
              {offer.status === 'OFFERED' && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {offer.expired
                    ? 'Expired'
                    : `Replies by ${new Date(offer.expiresOn).toLocaleDateString()}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={offer.expired && offer.status === 'OFFERED' ? 'destructive' : badge.variant}>
            {offer.expired && offer.status === 'OFFERED' ? 'Expired' : badge.label}
          </Badge>
          {offer.status === 'OFFERED' && !offer.expired && (
            <Button
              size="sm"
              variant="outline"
              disabled={withdraw.isPending}
              onClick={() => withdraw.mutate()}
            >
              {withdraw.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {offer.message && (
        <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">{offer.message}</p>
      )}
    </article>
  );
}

function PlacementRow({ placement: p }: { placement: Placement }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['institute'] });
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const confirm = useMutation({
    mutationFn: () => hiringService.confirmPlacement(p.id),
    onSuccess: (updated) => {
      toast.success(
        updated.status === 'ACTIVE'
          ? 'Placement confirmed — your fee invoice is in Billing'
          : 'Confirmed. Waiting for the teacher to confirm too.',
      );
      refresh();
    },
    onError: fail,
  });
  const end = useMutation({
    mutationFn: () => hiringService.endPlacement(p.id, 'Ended by institute'),
    onSuccess: () => {
      toast.success('Placement ended');
      refresh();
    },
    onError: fail,
  });

  // The contract editor is opened by the same button that creates the contract — the server makes
  // that idempotent, so a second click reopens the same one rather than raising another.
  const [contract, setContract] = useState<Contract | null>(null);
  const openContract = useMutation({
    mutationFn: () => contractService.createFor(p.id),
    onSuccess: setContract,
    onError: fail,
  });

  // Keep the open dialog in step with what the server returned after a save or a signature.
  const contracts = useQuery({
    queryKey: ['institute', 'contracts'],
    queryFn: () => contractService.list(),
    enabled: contract !== null,
  });
  const live = contract
    ? ((contracts.data ?? []).find((c) => c.id === contract.id) ?? contract)
    : null;

  const badge = PLACEMENT_BADGE[p.status];
  const busy = confirm.isPending || end.isPending || openContract.isPending;

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-soft',
        p.awaitingMe && 'border-gold-300 bg-gold-50/40 dark:border-gold-500/30 dark:bg-gold-500/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={p.tutorPhotoUrl} alt={p.tutorName} />
            <AvatarFallback>{getInitials(p.tutorName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-display font-bold leading-tight">{p.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{p.tutorName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{formatPKR(p.monthlySalary)}/month</span>
              {p.startsOn && <span>Starts {new Date(p.startsOn).toLocaleDateString()}</span>}
              {p.feeAmount != null && (
                <span>
                  Fee {formatPKR(p.feeAmount)}
                  {p.feeRate != null && ` (${Math.round(p.feeRate * 100)}%)`}
                </span>
              )}
            </div>
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {p.status === 'PENDING_START' && (
        <div className="mt-4 rounded-xl border bg-card p-3.5 text-sm">
          <p className="leading-relaxed">
            <span className="font-semibold">Both sides confirm the start.</span> Your placement fee
            is charged once you and {p.tutorName.split(' ')[0]} have both confirmed they began.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={cn(p.instituteConfirmed && 'font-medium text-emerald-600')}>
              {p.instituteConfirmed ? '✓ You confirmed' : 'You haven’t confirmed'}
            </span>
            <span className={cn(p.tutorConfirmed && 'font-medium text-emerald-600')}>
              {p.tutorConfirmed ? '✓ Teacher confirmed' : 'Teacher hasn’t confirmed'}
            </span>
          </div>
          {p.awaitingMe && (
            <Button
              className="mt-3"
              size="sm"
              variant="gradient"
              disabled={busy}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Confirm they started
            </Button>
          )}
        </div>
      )}

      {/* A contract can be drawn up as soon as the placement exists — waiting for both start
          confirmations would mean the teacher starts work on nothing but an accepted offer. */}
      {(p.status === 'PENDING_START' || p.status === 'ACTIVE') && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => openContract.mutate()}
          >
            {openContract.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSignature className="h-3.5 w-3.5" />
            )}
            Contract
          </Button>
          {p.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => end.mutate()}>
              End placement
            </Button>
          )}
        </div>
      )}

      {p.endReason && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Reason: </span>{p.endReason}
        </p>
      )}

      <ContractDialog contract={live} side="institute" onClose={() => setContract(null)} />
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
