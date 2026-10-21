import { Pencil, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toNationalDisplay } from '@/lib/phone';
import type { ContactChannel } from '@/services/accountService';

interface Props {
  channel: ContactChannel;
  value?: string;
  verified?: boolean;
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
export function VerifiedContactField({ channel, value, verified = false, onEdit }: Props) {
  const isPhone = channel === 'PHONE';
  const display = isPhone ? toNationalDisplay(value) : (value ?? '');

  return (
    <div>
      {/* Match the compact label row used by the adjacent profile fields. */}
      <div className="flex h-3.5 items-center gap-1.5">
        <Label>{isPhone ? 'Phone' : 'Email'}</Label>
        {display && verified && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            title="Verified"
          >
            <ShieldCheck className="h-2.5 w-2.5" /> Verified
          </span>
        )}
      </div>

      {/* The button sits inside the field rather than beside it, so the pair reads as one control
          and the row keeps the same height as the editable fields around it. */}
      <div className="relative mt-1.5">
        <Input
          value={display}
          readOnly
          placeholder={isPhone ? 'Phone number not added' : 'Not set'}
          className="bg-secondary/40 pr-28"
        />
        <button
          type="button"
          onClick={() => onEdit(channel)}
          aria-label={`${display ? 'Change' : 'Add'} ${isPhone ? 'phone number' : 'email address'}`}
          className={`absolute right-1 top-1/2 flex h-8 -translate-y-1/2 items-center justify-center gap-1 rounded-md px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${!display || (isPhone && !verified) ? 'border border-border bg-background text-foreground shadow-sm hover:bg-secondary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          {(!display || (isPhone && !verified)) && (
            <span className="text-xs font-medium">
              {display ? 'Verify phone' : `Add ${isPhone ? 'phone' : 'email'}`}
            </span>
          )}
        </button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Changing this needs a code sent to the new {isPhone ? 'number' : 'address'}.
      </p>
    </div>
  );
}
