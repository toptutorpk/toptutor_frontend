import { useState } from 'react';
import { Loader2, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingService } from '@/services/bookingService';
import { Button, type ButtonProps } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

/**
 * Opens a paid booking's PDF receipt.
 *
 * <p>One component for every place a receipt is offered — My Bookings, Payments, the payment
 * return page and the in-dialog confirmation — so the action looks and behaves the same wherever a
 * learner meets it: an outlined button with the receipt mark in brand blue, sized to sit beside
 * Join, and a spinner while the PDF is generated (it is rendered on request, which takes a moment).
 */
export function ReceiptButton({
  bookingId,
  disabled,
  size = 'sm',
  className,
  label = 'Receipt',
}: {
  bookingId: number;
  disabled?: boolean;
  size?: ButtonProps['size'];
  className?: string;
  label?: string;
}) {
  const [opening, setOpening] = useState(false);

  const open = async () => {
    setOpening(true);
    try {
      await bookingService.openReceipt(bookingId);
    } catch {
      toast.error('Could not open receipt', { description: 'Please try again in a moment.' });
    } finally {
      setOpening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={disabled || opening}
      onClick={open}
      className={cn(
        'border-slate-200 bg-white font-semibold text-foreground shadow-none hover:border-brand-200 hover:bg-brand-50/60',
        'dark:border-border dark:bg-card dark:hover:bg-brand-500/10',
        className,
      )}
    >
      {opening ? (
        <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" />
      ) : (
        <ReceiptText className="text-brand-600 dark:text-brand-400" />
      )}
      {label}
    </Button>
  );
}
