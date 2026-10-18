import { useEffect, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Loader2, Video } from 'lucide-react';
import { useJoinSession } from '@/hooks/useJoinSession';
import { Button, type ButtonProps } from '@/components/ui/button';

/** 'YYYY-MM-DDTHH:mm' in Pakistan time (UTC+5, no DST) → epoch ms. */
function pktToEpoch(local: string): number {
  return new Date(`${local.length === 16 ? `${local}:00` : local}+05:00`).getTime();
}

/**
 * Join for a paid online session.
 *
 * <p>Open: the gradient Join button. Later today: disabled, saying when it opens, and it switches on
 * by itself at that moment (re-checked every 15 s). Any other day: nothing — Join only makes sense on
 * the day. The server decides for real when the button is pressed; this only keeps the screen honest.
 */
export function JoinSessionButton({
  bookingId,
  joinable,
  joinOpensAt,
  size = 'sm',
  className,
}: {
  bookingId: number;
  joinable: boolean;
  joinOpensAt: string | null;
  size?: ButtonProps['size'];
  className?: string;
}) {
  const { join, joiningId, rulesDialog } = useJoinSession();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!joinOpensAt) return null;
  const opensAt = pktToEpoch(joinOpensAt);
  const open = joinable || now >= opensAt;
  const today = isSameDay(new Date(opensAt), new Date(now));

  if (!open && !today) return null;
  if (!open) {
    return (
      <Button size={size} variant="outline" disabled className={className}>
        <Video /> Opens {format(parseISO(joinOpensAt), 'h:mm a')}
      </Button>
    );
  }
  const busy = joiningId === bookingId;
  return (
    <>
      <Button
        size={size}
        variant="gradient"
        className={className}
        disabled={busy}
        onClick={() => join(bookingId)}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Video />} Join
      </Button>
      {rulesDialog}
    </>
  );
}
