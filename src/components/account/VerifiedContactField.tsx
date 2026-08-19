import { Pencil, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toNationalDisplay } from '@/lib/phone';
import type { ContactChannel } from '@/services/accountService';

interface Props {
  channel: ContactChannel;
  value?: string;
  onEdit: (channel: ContactChannel) => void;
}

/**
 * A verified phone or email: shown, not typed into, with a pencil that starts the change flow.
 *
 * <p>The field is read-only because the value is a proved fact rather than a preference — editing
 * it in place would suggest the new value takes effect on save, when in truth it takes effect only
 * once a code sent to it comes back. The pencil is the honest affordance: it opens the process that
 * can actually change the value, rather than a box that pretends to.
 */
export function VerifiedContactField({ channel, value, onEdit }: Props) {
  const isPhone = channel === 'PHONE';
  const display = isPhone ? toNationalDisplay(value) : (value ?? '');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label>{isPhone ? 'Phone' : 'Email'}</Label>
        {display && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            title="Verified"
          >
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>

      {/* The button sits inside the field rather than beside it, so the pair reads as one control
          and the row keeps the same height as the editable fields around it. */}
      <div className="relative">
        <Input
          value={display}
          readOnly
          placeholder={isPhone ? '—' : 'Not set'}
          className="bg-secondary/40 pr-10"
        />
        <button
          type="button"
          onClick={() => onEdit(channel)}
          aria-label={`Change ${isPhone ? 'phone number' : 'email address'}`}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Changing this needs a code sent to the new {isPhone ? 'number' : 'address'}.
      </p>
    </div>
  );
}
