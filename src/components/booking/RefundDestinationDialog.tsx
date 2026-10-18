import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { formatPKR } from '@/lib/utils';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { BookingSummary } from '@/services/bookingService';
import { refundService, type LearnerRefund } from '@/services/refundService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { RefundAccountForm } from './RefundAccountForm';
import {
  EMPTY_REFUND_ACCOUNT,
  refundAccountPayload,
  validateRefundAccount,
  type RefundAccount,
} from './refundAccount';

/**
 * The tutor cancelled: the learner says where their full refund should go. Until they do, the refund
 * waits — an admin can't send money without an account to send it to.
 */
export function RefundDestinationDialog({
  booking,
  onClose,
}: {
  booking: BookingSummary;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [account, setAccount] = useState<RefundAccount>(EMPTY_REFUND_ACCOUNT);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<LearnerRefund | null>(null);
  const amount = booking.refund?.refundAmount ?? 0;

  const save = useMutation({
    mutationFn: () => refundService.provideDestination(booking.id, refundAccountPayload(account)),
    onSuccess: (refund) => {
      setSaved(refund);
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: (e) => {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.';
      toast.error('Could not save your refund details', { description: msg });
      if (e instanceof ApiError && e.status === 409)
        void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });

  const submit = () => {
    setTouched(true);
    if (validateRefundAccount(account)) return;
    save.mutate();
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="no-scrollbar max-h-[90vh] gap-5 overflow-y-auto [&>*]:min-w-0">
        {saved ? (
          <div className="space-y-5 pt-2 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <DialogTitle className="font-display text-2xl font-extrabold">Got it</DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-sm text-sm">
                We’ll send{' '}
                <strong className="text-foreground">{formatPKR(saved.refundAmount)}</strong> to{' '}
                {saved.provider} {saved.accountMasked} within 24 hours, and email you when it’s
                done.
              </DialogDescription>
            </div>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="font-display text-xl">
                Where should we send your refund?
              </DialogTitle>
              <DialogDescription>
                {booking.tutorName} cancelled this session, so you get everything back.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-xl border bg-emerald-50/60 p-4 dark:bg-emerald-500/10">
              <Wallet className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="text-sm">
                <p className="font-display text-2xl font-extrabold tabular-nums">
                  {formatPKR(amount)}
                </p>
                <p className="text-muted-foreground">
                  Full refund — the processing fee included, nothing deducted.
                </p>
              </div>
            </div>

            <RefundAccountForm value={account} onChange={setAccount} showError={touched} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={save.isPending}>
                Later
              </Button>
              <Button variant="gradient" onClick={submit} disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send my refund here
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
