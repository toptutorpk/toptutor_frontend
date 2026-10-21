import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent, Pencil, Loader2 } from 'lucide-react';
import {
  tutorCommissionService,
  type TutorCommission,
  type UpdateTutorRates,
} from '@/services/tutorCommissionService';
import { commissionPercent } from '@/lib/commission';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

type RateDraft = {
  standard: string;
  loyal: string;
  useStandardSystem: boolean;
  useLoyalSystem: boolean;
  version: number;
  note: string;
};
const fraction = (value: string) => Number((Number(value) / 100).toFixed(4));
const validPercent = (value: string) =>
  /^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) >= 0 && Number(value) <= 100;
const time = (value: string) =>
  new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

export function TutorCommissionSection({ tutorId }: { tutorId: number }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<RateDraft | null>(null);
  const [formError, setFormError] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'tutor', tutorId, 'commission'],
    queryFn: ({ signal }) => tutorCommissionService.admin(tutorId, signal),
  });
  const changed = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'tutor', tutorId] });
    void qc.invalidateQueries({ queryKey: ['earnings'] });
    void qc.invalidateQueries({ queryKey: ['tutor', 'commission'] });
  };
  const saveRates = useMutation({
    mutationFn: (body: UpdateTutorRates) => tutorCommissionService.update(tutorId, body),
    onSuccess: (view) => {
      qc.setQueryData(['admin', 'tutor', tutorId, 'commission'], view);
      changed();
      setDraft(null);
      toast.success('Tutor commission updated');
    },
    onError: (e) => {
      setFormError(e instanceof Error ? e.message : 'Could not save. Please try again.');
      void query.refetch();
    },
  });
  const busy = saveRates.isPending;
  const view = query.data;
  const edit = (v: TutorCommission) => {
    setFormError('');
    setDraft({
      standard: String(Number(((v.customRate ?? v.systemRate) * 100).toFixed(2))),
      loyal: String(Number(((v.customLoyalRate ?? v.systemLoyalRate) * 100).toFixed(2))),
      useStandardSystem: v.customRate == null,
      useLoyalSystem: v.customLoyalRate == null,
      version: v.version,
      note: '',
    });
  };
  const submit = () => {
    if (!draft) return;
    if (
      (!draft.useStandardSystem && !validPercent(draft.standard)) ||
      (!draft.useLoyalSystem && !validPercent(draft.loyal)) ||
      !draft.note.trim()
    ) {
      setFormError(
        'Enter rates from 0 to 100 with up to two decimal places, and a reason for the change.',
      );
      return;
    }
    saveRates.mutate({
      standardRate: draft.useStandardSystem ? null : fraction(draft.standard),
      loyalRate: draft.useLoyalSystem ? null : fraction(draft.loyal),
      version: draft.version,
      note: draft.note.trim(),
    });
  };
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Percent className="h-4 w-4 text-primary" />
            Commission
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rates apply when future session payments are confirmed.
          </p>
        </div>
        {view && !query.isError && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !view.profileExists}
            onClick={() => edit(view)}
          >
            <Pencil className="h-4 w-4" />
            Edit commission
          </Button>
        )}
      </div>
      {query.isPending ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : query.isError || !view ? (
        <div className="space-y-2 text-sm text-muted-foreground" role="alert">
          Could not load commission settings.{' '}
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {!view.profileExists && (
            <p className="mb-4 text-sm text-muted-foreground">
              This tutor has not created a profile yet. System rates apply until their profile is
              created.
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Item
              label="Standard commission"
              value={commissionPercent(view.customRate ?? view.systemRate)}
              hint={view.customRate == null ? 'System fallback' : 'Tutor setting'}
            />
            <Item
              label="Loyalty commission"
              value={commissionPercent(
                Math.min(
                  view.customRate ?? view.systemRate,
                  view.customLoyalRate ?? view.systemLoyalRate,
                ),
              )}
              hint={
                view.customLoyalRate == null
                  ? 'System fallback · capped at standard rate'
                  : 'Tutor setting · capped at standard rate'
              }
            />
            <Item
              label="Current base rate"
              value={commissionPercent(view.baseRate)}
              hint={`${view.completedSessions} completed paid sessions`}
            />
            <Item
              label="Effective commission"
              value={commissionPercent(view.effectiveRate)}
              hint={
                view.discountRate > 0
                  ? `${commissionPercent(view.discountRate)} subscription reduction`
                  : 'No active subscription discount'
              }
            />
          </dl>
          <div className="mt-4 rounded-xl border bg-secondary/20 p-4 text-sm">
            <p>
              Loyalty threshold: <strong>{view.loyaltyThreshold} completed paid sessions</strong>.{' '}
              {view.sessionsToLoyalRate
                ? `${view.sessionsToLoyalRate} more to qualify.`
                : 'Loyalty threshold reached.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Loyalty progress continues during a subscription. Expiry removes the plan discount;
              the tutor’s normal rates and loyalty eligibility remain.
            </p>
          </div>
          {view.recentChanges.length > 0 && (
            <details className="mt-4 rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Recent commission changes
              </summary>
              <ul className="mt-3 space-y-3">
                {view.recentChanges.map((change) => (
                  <li key={change.id} className="border-t pt-3 text-sm">
                    <p>
                      {change.newRate == null
                        ? 'System standard rate'
                        : commissionPercent(change.newRate)}{' '}
                      ·{' '}
                      {change.newLoyalRate == null
                        ? 'System loyalty rate'
                        : `${commissionPercent(change.newLoyalRate)} loyalty`}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">{change.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {time(change.createdAt)} · Admin #{change.actorId}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit tutor commission</DialogTitle>
            <DialogDescription>
              Only future payment confirmations use these rates. A paid plan automatically reduces
              the applicable rate. Previous earnings stay unchanged.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="tutor-standard-rate">Standard commission (%)</Label>
                <Input
                  id="tutor-standard-rate"
                  className="mt-1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={busy || draft.useStandardSystem}
                  value={draft.standard}
                  onChange={(e) => setDraft({ ...draft, standard: e.target.value })}
                />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox
                    disabled={busy}
                    checked={draft.useStandardSystem}
                    onCheckedChange={(checked) =>
                      setDraft({ ...draft, useStandardSystem: checked === true })
                    }
                  />
                  Use system standard rate ({view && commissionPercent(view.systemRate)})
                </label>
              </div>
              <div>
                <Label htmlFor="tutor-loyal-rate">Loyalty commission (%)</Label>
                <Input
                  id="tutor-loyal-rate"
                  className="mt-1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={busy || draft.useLoyalSystem}
                  value={draft.loyal}
                  onChange={(e) => setDraft({ ...draft, loyal: e.target.value })}
                />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox
                    disabled={busy}
                    checked={draft.useLoyalSystem}
                    onCheckedChange={(checked) =>
                      setDraft({ ...draft, useLoyalSystem: checked === true })
                    }
                  />
                  Use system loyalty rate ({view && commissionPercent(view.systemLoyalRate)})
                </label>
              </div>
              <Label htmlFor="commission-change-note">Reason for change</Label>
              <Textarea
                id="commission-change-note"
                maxLength={500}
                disabled={busy}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="gradient" disabled={busy || !draft?.note.trim()} onClick={submit}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}Save commission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function Item({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}
