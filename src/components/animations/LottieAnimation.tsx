import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * `lottie-react` pulls in the full lottie-web runtime (~250kB). Loading it
 * lazily keeps that weight out of the page chunk entirely unless an animation
 * is actually going to play.
 */
const Lottie = lazy(() => import('lottie-react'));

interface LottieAnimationProps {
  /**
   * Path to a Lottie JSON animation, e.g. `/lottie/contact.json`. When omitted
   * — or when the fetch fails — `fallback` is rendered instead, so a page can
   * ship before its animation asset exists.
   */
  src?: string;
  /** Static or CSS/SVG-driven stand-in. Also used for reduced-motion users. */
  fallback: ReactNode;
  className?: string;
  loop?: boolean;
  /** Root margin for the intersection observer that defers the fetch. */
  rootMargin?: string;
  'aria-label'?: string;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Renders a Lottie animation, deferring the JSON fetch until the element scrolls
 * near the viewport. Falls back to `fallback` when there is no `src`, the fetch
 * fails, or the user has asked for reduced motion — so callers never need to
 * branch on any of those cases themselves.
 */
export function LottieAnimation({
  src,
  fallback,
  className,
  loop = true,
  rootMargin = '200px',
  'aria-label': ariaLabel,
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  // Track the motion preference live — users can toggle it mid-session.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Defer work until the animation is nearly on screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  useEffect(() => {
    if (!src || !inView || reducedMotion || data || failed) return;

    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Lottie fetch failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        // Non-fatal: the fallback illustration carries the page.
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src, inView, reducedMotion, data, failed]);

  const showLottie = Boolean(src) && !reducedMotion && !failed && data !== null;

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      {showLottie ? (
        // The fallback stays on screen while the runtime chunk downloads, so
        // there is never an empty gap where the illustration should be.
        <Suspense fallback={fallback}>
          <Lottie animationData={data as object} loop={loop} autoplay className="h-full w-full" />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
