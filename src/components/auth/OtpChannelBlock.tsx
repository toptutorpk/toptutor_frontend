import { useState } from 'react';
import type { MessageSquare } from 'lucide-react';
import { OtpInput } from '@/components/auth/OtpInput';
import { useCooldown } from '@/hooks/useCooldown';

/**
 * One verification channel: where the code went, six boxes to type it into, and a resend held
 * shut until the cooldown expires.
 *
 * <p>Shared by every flow that proves a phone and an email (tutor and institute sign-up), so the
 * two onboarding journeys are the same screen rather than two that look alike and drift apart.
 */
export function OtpChannelBlock({
  icon: Icon,
  title,
  sentTo,
  onChange,
  onResend,
}: {
  icon: typeof MessageSquare;
  title: string;
  /** Masked destination — enough for the owner to recognise, not enough for anyone else to learn. */
  sentTo: string;
  onChange: (code: string) => void;
  onResend: () => void | Promise<void>;
}) {
  // The clock starts on mount, which is the moment this block appears — i.e. the moment the first
  // code was sent. There is no window in which resend is available before the code has had a
  // chance to arrive.
  const { remaining, active, start } = useCooldown();
  const [resetToken, setResetToken] = useState(0);

  const resend = async () => {
    await onResend();
    start();
    // Empties the boxes and drops the caret back in the first one. The code that was being typed
    // belongs to the message that was just superseded, so leaving it there would offer the person
    // a code the server has already discarded.
    setResetToken((n) => n + 1);
    onChange('');
  };

  return (
    <div className="rounded-xl border bg-card p-3 shadow-soft">
      {/* The heading is pure identity — which channel this is, and where it went. The action sits
          below the boxes: resending is what you reach for after looking for a code and not finding
          one, which is a decision made at the end of the block rather than before it. */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold">{title}</div>
          <div className="truncate text-[11px] text-muted-foreground">Sent to {sentTo || '—'}</div>
        </div>
      </div>

      <OtpInput size="sm" resetToken={resetToken} onChange={onChange} />

      <div className="mt-2.5 text-center text-[11px] text-muted-foreground">
        Didn&rsquo;t get it?{' '}
        {active ? (
          // The wait is stated as a time, not as a greyed-out button with no explanation. A
          // disabled control that says only "Resend code" reads as broken.
          <span className="font-medium tabular-nums">Resend in {formatCountdown(remaining)}</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="font-semibold text-primary hover:underline"
          >
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}

/** 60 → "1:00", 9 → "0:09". Seconds alone read as a bigger number than they are at a minute. */
function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
