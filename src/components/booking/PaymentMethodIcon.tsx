import { CreditCard, Landmark, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingPaymentMethod } from '@/constants/payment';
import { METHOD_TONE, methodInfo } from './flow';

const FALLBACK_ICON = {
  CARD: CreditCard,
  EASYPAISA: Smartphone,
  JAZZCASH: Smartphone,
  BANK_TRANSFER: Landmark,
} as const;

/** The square mark for a method: the provider's logo once supplied, a tinted icon until then. */
export function PaymentMethodIcon({
  method,
  size = 'md',
  className,
}: {
  method: BookingPaymentMethod;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const info = methodInfo(method);
  const Icon = FALLBACK_ICON[method];
  const box = { sm: 'h-6 w-6 rounded-md', md: 'h-11 w-11 rounded-xl', lg: 'h-16 w-16 rounded-2xl' }[size];
  const glyph = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' }[size];

  // The marks are full-colour artwork on transparent, so they sit on white in both themes — the
  // same size and radius as the icon tiles, so a row of methods still reads as one set.
  if (info.logo) {
    const pad = { sm: 'p-0.5', md: 'p-1.5', lg: 'p-2.5' }[size];
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white',
          box,
          pad,
          className,
        )}
      >
        <img src={info.logo} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center', box, METHOD_TONE[method].tile, className)}>
      <Icon className={glyph} />
    </span>
  );
}

/**
 * Heights per provider, set by eye rather than one number for all. The artwork is cropped tight, but
 * the shapes differ: Easypaisa is letters edge to edge, while the JazzCash lockup puts its mark
 * beside the word, so the letters are about a third of its height. At equal heights JazzCash reads
 * far smaller; these keep the two at about the same width and letter size side by side.
 */
const WORDMARK_HEIGHT: Partial<Record<BookingPaymentMethod, { sm: string; md: string }>> = {
  EASYPAISA: { sm: 'h-3.5', md: 'h-6' },
  JAZZCASH: { sm: 'h-6', md: 'h-9' },
};

/**
 * The provider's wordmark, or null when it has none. Dark artwork, so the caller puts it on white.
 * The alt text is the provider's name: where a wordmark stands in for a label, it is the label.
 */
export function PaymentWordmark({
  method,
  size = 'sm',
  className,
}: {
  method: BookingPaymentMethod;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const info = methodInfo(method);
  if (!info.wordmark) return null;
  const height = WORDMARK_HEIGHT[method]?.[size] ?? (size === 'sm' ? 'h-4' : 'h-7');
  return <img src={info.wordmark} alt={info.name} className={cn('w-auto object-contain', height, className)} />;
}
