import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REFUND_METHOD_LABEL, type RefundMethod } from '@/services/refundService';
import { formatIban, validateRefundAccount, type RefundAccount } from './refundAccount';
import { catalogService } from '@/services/catalogService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProviderPicker } from '@/components/common/ProviderPicker';
import { PaymentMethodIcon } from './PaymentMethodIcon';

/**
 * Choosing Easypaisa, JazzCash or a bank account for a refund, with the same checks the server makes
 * so most mistakes are caught before the request. Used when a learner cancels, and when a tutor
 * cancelled and the learner says where their refund should go.
 */
export function RefundAccountForm({
  value,
  onChange,
  showError,
}: {
  value: RefundAccount;
  onChange: (next: RefundAccount) => void;
  /** Show the validation message (after the first submit attempt). */
  showError: boolean;
}) {
  const { method, title, number, bankName } = value;
  const set = (patch: Partial<RefundAccount>) => onChange({ ...value, ...patch });

  // Banks come from the same database catalog the tutor payout form uses; fetched once Bank is chosen.
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ['catalog', 'payout-banks'],
    queryFn: () => catalogService.getOne('payout-banks'),
    enabled: method === 'BANK',
    staleTime: 60 * 60_000,
  });

  const error = validateRefundAccount(value);

  return (
    <>
      <div role="radiogroup" aria-label="Refund method" className="grid grid-cols-3 gap-2">
        {(['EASYPAISA', 'JAZZCASH', 'BANK'] as RefundMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            onClick={() => set({ method: m, number: '' })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors',
              method === m
                ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                : 'hover:bg-secondary/60',
            )}
          >
            {m === 'BANK' ? (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200">
                <Landmark className="h-5 w-5" />
              </span>
            ) : (
              <PaymentMethodIcon method={m} />
            )}
            {REFUND_METHOD_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {method === 'BANK' && (
          <Field id="refund-bank" label="Bank">
            <ProviderPicker
              id="refund-bank"
              items={banks}
              value={bankName}
              onChange={(v) => set({ bankName: banks.find((b) => b.value === v)?.label ?? v })}
              placeholder={banksLoading ? 'Loading…' : 'Choose bank'}
              searchPlaceholder="Search bank…"
              disabled={banksLoading}
            />
          </Field>
        )}

        <Field
          id="refund-title"
          label="Account title"
          hint="The name on the account, exactly as your bank or wallet shows it."
        >
          <Input
            id="refund-title"
            value={title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Usama Basharat"
            maxLength={120}
            autoComplete="name"
          />
        </Field>

        {method === 'BANK' ? (
          <Field
            id="refund-iban"
            label="IBAN"
            hint="24 characters, starting with PK — it’s in your banking app."
          >
            <Input
              id="refund-iban"
              value={number}
              onChange={(e) => set({ number: formatIban(e.target.value) })}
              placeholder="PK36 SCBL 0000 0011 2345 6702"
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-wide"
            />
          </Field>
        ) : (
          <Field
            id="refund-mobile"
            label={`${REFUND_METHOD_LABEL[method]} mobile number`}
            hint={`The number registered with your ${REFUND_METHOD_LABEL[method]} account.`}
          >
            <div className="flex h-11 items-stretch overflow-hidden rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="flex items-center border-r bg-secondary/50 px-3 text-sm font-semibold text-muted-foreground">
                +92
              </span>
              <input
                id="refund-mobile"
                inputMode="numeric"
                autoComplete="tel-national"
                value={number}
                onChange={(e) =>
                  set({ number: e.target.value.replace(/[^\d\s+-]/g, '').slice(0, 16) })
                }
                placeholder="300 1234567"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Field>
        )}
      </div>

      {showError && error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
