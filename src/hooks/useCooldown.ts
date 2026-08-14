import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a one-time code must be left alone before another can be requested. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * A countdown that gates an action until it reaches zero.
 *
 * <p>Used to hold the resend button shut for a minute after a code goes out. Two reasons, and the
 * second is the one that matters: SMS costs money per message and an ungated button is a way to
 * spend it, but more importantly a code that has just been sent has not arrived yet, and someone
 * who presses resend while it is in flight invalidates the code they are about to receive. They
 * then type it, are told it is wrong, and press resend again. The wait is what breaks that loop.
 *
 * <p>Counts down from a timestamp rather than by decrementing a number once per tick. Background
 * tabs have their timers throttled to once a second at best and often far less, so a counter that
 * subtracts one per fire drifts further behind real time the longer the tab is hidden — and would
 * keep the button locked well past the minute the person actually waited.
 */
export function useCooldown(seconds: number = OTP_RESEND_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(seconds);
  const endsAt = useRef(Date.now() + seconds * 1000);

  const start = useCallback(() => {
    endsAt.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;

    const tick = () => {
      const left = Math.ceil((endsAt.current - Date.now()) / 1000);
      setRemaining(left > 0 ? left : 0);
    };

    const id = window.setInterval(tick, 250);
    // Also settles the count the moment the tab is looked at again, rather than up to a tick later.
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [remaining]);

  return { remaining, active: remaining > 0, start };
}
