import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  size?: 'default' | 'sm';
  /**
   * Insert a separator after every N boxes. Six undivided boxes are read as one long number and
   * have to be counted to be checked against the message; split three and three, each half is
   * small enough to hold in your head while you look away from the phone. Set 0 to keep one run.
   */
  groupEvery?: number;
  /**
   * Change this to empty the boxes and put the caret back in the first one.
   *
   * <p>For when the code on screen has stopped being the code that works — a resend, above all.
   * Digits left sitting in the boxes after the code behind them has been superseded are an
   * invitation to submit something already known to fail.
   */
  resetToken?: number | string;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
}

export function OtpInput({
  length = 6,
  size = 'default',
  groupEvery = 3,
  resetToken,
  onComplete,
  onChange,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const lastReset = useRef(resetToken);

  useEffect(() => {
    // Skip the first run: the boxes are already empty on mount, and reporting a change nobody made
    // would clobber whatever the parent is holding.
    if (resetToken === lastReset.current) return;
    lastReset.current = resetToken;
    setValues(Array(length).fill(''));
    onChange?.('');
    refs.current[0]?.focus();
  }, [resetToken, length, onChange]);

  const update = (next: string[]) => {
    setValues(next);
    const code = next.join('');
    onChange?.(code);
    if (code.length === length && !next.includes('')) onComplete?.(code);
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[i] = digit;
    update(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length)
      .fill('')
      .map((_, idx) => pasted[idx] ?? '');
    update(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  const sm = size === 'sm';
  return (
    <div
      className={cn('flex items-center justify-center', sm ? 'gap-1.5' : 'gap-2 sm:gap-3')}
      onPaste={handlePaste}
    >
      {values.map((v, i) => {
        // Never after the final box: a trailing separator would read as a missing digit.
        const separatorAfter = groupEvery > 0 && (i + 1) % groupEvery === 0 && i < length - 1;
        return (
          <Fragment key={i}>
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={v}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                'rounded-lg border-2 bg-background text-center font-display font-bold shadow-sm transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                sm ? 'h-10 w-9 text-lg' : 'h-14 w-12 rounded-xl text-2xl',
                v ? 'border-brand-500' : 'border-input',
              )}
            />
            {separatorAfter && (
              // Decorative, and hidden from assistive technology: the boxes are already labelled
              // "Digit 1…6", and a dash announced between them would only add noise.
              <span
                aria-hidden="true"
                className={cn(
                  'select-none text-muted-foreground/50',
                  sm ? 'mx-0.5 text-sm' : 'mx-1 text-lg',
                )}
              >
                –
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
