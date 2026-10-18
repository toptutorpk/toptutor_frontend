import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, FileSignature, Loader2, PenLine, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { ApiError } from '@/api/client';
import { formatPKR, noNegative } from '@/lib/utils';
import {
  contractService,
  tutorContractService,
  type Contract,
  type ContractStatus,
  type SaveContract,
} from '@/services/instituteService';

const STATUS_BADGE: Record<
  ContractStatus,
  { label: string; variant: 'secondary' | 'success' | 'gold' | 'destructive' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Awaiting signature', variant: 'gold' },
  SIGNED: { label: 'Signed by both', variant: 'success' },
  VOID: { label: 'Withdrawn', variant: 'secondary' },
};

/**
 * One contract, read and signed by whichever side opened it.
 *
 * <p>Shared between the two portals because the document is the same document — what differs is
 * which button is offered, and the server decides that with `editable` and `myTurn` rather than the
 * screen guessing from the status. A signature is a typed name, so the field is a real input with
 * a real confirmation, not a checkbox that says "I agree".
 */
export function ContractDialog({
  contract,
  side,
  onClose,
}: {
  contract: Contract | null;
  side: 'institute' | 'tutor';
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [terms, setTerms] = useState<SaveContract | null>(null);
  const [signature, setSignature] = useState('');

  // Reset both whenever a different contract is opened — a signature typed into one contract must
  // never be sitting in the box when the next one opens.
  useEffect(() => {
    setSignature('');
    setTerms(
      contract
        ? {
            title: contract.title,
            monthlySalary: contract.monthlySalary,
            startsOn: contract.startsOn,
            workingHours: contract.workingHours,
            probationMonths: contract.probationMonths,
            noticePeriodDays: contract.noticePeriodDays,
            duties: contract.duties,
            extraTerms: contract.extraTerms,
          }
        : null,
    );
  }, [contract]);

  const refresh = () => qc.invalidateQueries({ queryKey: [side === 'institute' ? 'institute' : 'tutor'] });
  const fail = (e: unknown) =>
    toast.error('Could not complete', {
      description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
    });

  const save = useMutation({
    mutationFn: () => contractService.update(contract!.id, terms!),
    onSuccess: () => {
      toast.success('Contract saved');
      refresh();
    },
    onError: fail,
  });

  const sign = useMutation({
    mutationFn: () =>
      side === 'institute'
        ? contractService.sign(contract!.id, signature.trim())
        : tutorContractService.sign(contract!.id, signature.trim()),
    onSuccess: () => {
      toast.success(
        side === 'institute'
          ? 'Signed and sent — the teacher has been asked to countersign'
          : 'Signed — both signatures are now on file',
      );
      refresh();
      onClose();
    },
    onError: fail,
  });

  const withdraw = useMutation({
    mutationFn: () =>
      side === 'institute'
        ? contractService.withdraw(contract!.id)
        : tutorContractService.decline(contract!.id),
    onSuccess: () => {
      toast.success(side === 'institute' ? 'Contract withdrawn' : 'Contract declined');
      refresh();
      onClose();
    },
    onError: fail,
  });

  const busy = save.isPending || sign.isPending || withdraw.isPending;
  const canSign = signature.trim().length >= 2;

  if (!contract || !terms) return null;
  const badge = STATUS_BADGE[contract.status];
  const set = <K extends keyof SaveContract>(key: K, value: SaveContract[K]) =>
    setTerms((t) => (t ? { ...t, [key]: value } : t));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <FileSignature className="h-5 w-5 shrink-0 text-muted-foreground" />
            Employment contract
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {side === 'institute'
              ? `Between ${contract.instituteName ?? 'your institute'} and ${contract.tutorName ?? 'the teacher'}.`
              : `Offered by ${contract.instituteName ?? 'the institute'}.`}
          </DialogDescription>
        </DialogHeader>

        {contract.editable ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="c-title">Role</Label>
                <Input
                  id="c-title"
                  className="mt-1"
                  value={terms.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-salary">Monthly salary (PKR)</Label>
                <Input
                  id="c-salary"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1"
                  value={terms.monthlySalary}
                  // min={0} only constrains the spinner; noNegative drops a typed minus. These
                  // are the signed terms of an employment contract — a negative salary must not
                  // be representable, let alone savable.
                  onChange={(e) => set('monthlySalary', Number(noNegative(e.target.value)))}
                />
              </div>
              <div>
                <Label htmlFor="c-start">Start date</Label>
                <DatePicker
                  id="c-start"
                  className="mt-1"
                  value={terms.startsOn ?? ''}
                  // Empty stays `undefined` rather than '': the contract terms treat an absent
                  // start date as "not agreed yet", and an empty string would be sent as a value.
                  onChange={(next) => set('startsOn', next || undefined)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-hours">Working hours</Label>
                <Input
                  id="c-hours"
                  className="mt-1"
                  placeholder="Mon–Fri, 8:00am – 2:00pm"
                  value={terms.workingHours ?? ''}
                  onChange={(e) => set('workingHours', e.target.value || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="c-probation">Probation (months)</Label>
                <Input
                  id="c-probation"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1"
                  value={terms.probationMonths ?? ''}
                  onChange={(e) => {
                    const raw = noNegative(e.target.value);
                    set('probationMonths', raw ? Number(raw) : undefined);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="c-notice">Notice period (days)</Label>
                <Input
                  id="c-notice"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1"
                  value={terms.noticePeriodDays ?? ''}
                  onChange={(e) => {
                    const raw = noNegative(e.target.value);
                    set('noticePeriodDays', raw ? Number(raw) : undefined);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-duties">Duties</Label>
                <Textarea
                  id="c-duties"
                  className="mt-1"
                  rows={4}
                  placeholder="Subjects, grades, and anything else expected of the role."
                  value={terms.duties ?? ''}
                  onChange={(e) => set('duties', e.target.value || undefined)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-extra">Other terms</Label>
                <Textarea
                  id="c-extra"
                  className="mt-1"
                  rows={3}
                  placeholder="Leave entitlement, allowances, anything else agreed."
                  value={terms.extraTerms ?? ''}
                  onChange={(e) => set('extraTerms', e.target.value || undefined)}
                />
              </div>
            </div>

            <Button variant="outline" disabled={busy} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save draft
            </Button>
          </div>
        ) : (
          <ReadOnlyTerms contract={contract} />
        )}

        <Signatures contract={contract} />

        {contract.myTurn && (
          <div className="rounded-xl border bg-secondary/30 p-4">
            <Label htmlFor="c-signature" className="inline-flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5" /> Type your full name to sign
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {side === 'institute'
                ? 'Signing sends the contract to the teacher. You cannot change the terms afterwards.'
                : 'Signing makes this contract binding on both sides.'}
            </p>
            <Input
              id="c-signature"
              className="mt-2"
              autoComplete="off"
              placeholder="Your full name"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="gradient"
                disabled={busy || !canSign}
                onClick={() => sign.mutate()}
              >
                {sign.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {side === 'institute' ? 'Sign and send' : 'Sign contract'}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => withdraw.mutate()}>
                <X className="h-4 w-4" />
                {side === 'institute' ? 'Discard' : 'Decline'}
              </Button>
            </div>
          </div>
        )}

        {/* The institute can still pull a contract back while the teacher has not answered. */}
        {side === 'institute' && contract.status === 'SENT' && (
          <Button variant="outline" disabled={busy} onClick={() => withdraw.mutate()}>
            Withdraw contract
          </Button>
        )}

        {contract.voidReason && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Reason: </span>
            {contract.voidReason}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyTerms({ contract: c }: { contract: Contract }) {
  const rows = [
    ['Role', c.title],
    ['Monthly salary', formatPKR(c.monthlySalary)],
    c.startsOn && ['Starts', format(parseISO(c.startsOn), 'd MMMM yyyy')],
    c.workingHours && ['Working hours', c.workingHours],
    c.probationMonths != null && [
      'Probation',
      `${c.probationMonths} ${c.probationMonths === 1 ? 'month' : 'months'}`,
    ],
    c.noticePeriodDays != null && ['Notice period', `${c.noticePeriodDays} days`],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-4">
      <dl className="divide-y rounded-xl border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {c.duties && (
        <section>
          <h4 className="text-sm font-semibold">Duties</h4>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {c.duties}
          </p>
        </section>
      )}
      {c.extraTerms && (
        <section>
          <h4 className="text-sm font-semibold">Other terms</h4>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {c.extraTerms}
          </p>
        </section>
      )}
    </div>
  );
}

/** Both signatures, present or awaited — the point of the document. */
function Signatures({ contract: c }: { contract: Contract }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SignatureBlock
        role="Institute"
        name={c.instituteSignerName}
        signedAt={c.instituteSignedAt}
      />
      <SignatureBlock role="Teacher" name={c.tutorSignerName} signedAt={c.tutorSignedAt} />
    </div>
  );
}

function SignatureBlock({
  role,
  name,
  signedAt,
}: {
  role: string;
  name?: string;
  signedAt?: string;
}) {
  return (
    <div className="rounded-xl border p-3.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{role}</p>
      {name && signedAt ? (
        <>
          <p className="mt-1 font-display text-lg italic">{name}</p>
          <p className="text-xs text-muted-foreground">
            Signed {format(parseISO(signedAt), "d MMM yyyy 'at' HH:mm")}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not signed yet</p>
      )}
    </div>
  );
}
