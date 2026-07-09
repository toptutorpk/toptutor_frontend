import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  size?: 'default' | 'sm';
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
}

export function OtpInput({ length = 6, size = 'default', onComplete, onChange }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

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
    <div className={cn('flex justify-center', sm ? 'gap-1.5' : 'gap-2 sm:gap-3')} onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={v}
          inputMode="numeric"
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
      ))}
    </div>
  );
}
