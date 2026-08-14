import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query from React.
 *
 * <p>Used where a layout difference is structural rather than cosmetic — the schedule renders a
 * seven-column grid on desktop but a single day on a phone, which is a different component tree, not
 * a different stylesheet. Anything achievable with Tailwind breakpoints should stay in CSS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(list.matches); // re-sync in case the query changed between renders
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on phone-sized screens (below Tailwind's `sm`). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}
