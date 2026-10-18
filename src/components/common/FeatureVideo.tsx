import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/animations/Reveal';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';

/** Asset names as uploaded to the public media bucket. */
const SOURCES = {
  hd: 'brand-film-1080.mp4',
  sd: 'brand-film-720.mp4',
  poster: 'brand-film-poster.webp',
} as const;

/**
 * Below which width the smaller encode is used.
 *
 * <p>720p is 3.9MB against 8.3MB, and on a phone the difference in picture is invisible while the
 * difference in a metered Pakistani mobile plan is not. Chosen once on mount rather than watched:
 * swapping the source mid-playback would restart the film.
 */
const SD_BREAKPOINT = 900;

interface FeatureVideoProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** `tint` for the light page sections, `dark` for the navy band. */
  tone?: 'dark' | 'tint';
  className?: string;
}

/**
 * The TopTutor brand film.
 *
 * <p>The film carries no audio track, and that is what shapes this component. With nothing to
 * hear there is no reason to demand a click before playing: it can behave like a moving
 * illustration that starts when it comes into view, which removes the one piece of friction a
 * play button always adds. The mute control still exists, because a silent video with no visible
 * audio affordance reads as broken rather than as deliberate.
 *
 * <p>Nothing downloads until the section is near the viewport — the poster carries the layout
 * until then, so the film costs nothing on first paint no matter which page it sits on.
 */
export function FeatureVideo({
  eyebrow,
  title,
  description,
  tone = 'dark',
  className,
}: FeatureVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [load, setLoad] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reduced, setReduced] = useState(false);

  // No bucket configured yet — show nothing rather than a broken player.
  const base = env.mediaBaseUrl;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  /**
   * Begin fetching the film — but never before the page itself has finished loading.
   *
   * <p>On the home page this section sits directly under the hero, close enough that any
   * pre-roll margin would match on first paint and put an 8MB download in a race with the hero
   * image for LCP. Waiting for `load` costs nothing perceptible (the poster holds the frame) and
   * keeps the film entirely out of the critical path.
   */
  useEffect(() => {
    const el = frameRef.current;
    if (!el || reduced || !base) return;

    let observer: IntersectionObserver | undefined;

    const attach = () => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setLoad(true);
            observer?.disconnect();
          }
        },
        // A modest pre-roll so the first frames are decoded by the time it is scrolled to.
        { rootMargin: '300px 0px' },
      );
      observer.observe(el);
    };

    if (document.readyState === 'complete') attach();
    else window.addEventListener('load', attach, { once: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('load', attach);
    };
  }, [base, reduced]);

  /**
   * Play while it is genuinely on screen, pause the moment it is not.
   *
   * <p>Separate from the loader above, and deliberately without a root margin: sharing one
   * observer meant the pre-roll margin kept the element "intersecting" long after it had left
   * the screen, so the film carried on playing to nobody. Ratio rather than a boolean, so
   * scrolling it half out of view stops it too.
   */
  useEffect(() => {
    const el = frameRef.current;
    if (!el || reduced || !base) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const video = videoRef.current;
        if (!video) return;
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.4) {
            if (!ended) {
              // Autoplay can still be refused (data-saver, an unusual policy). The poster stays
              // underneath either way, so a rejection costs nothing.
              void video.play().catch(() => undefined);
            }
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.4] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [base, reduced, ended]);

  const replay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setEnded(false);
    void video.play().catch(() => undefined);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  if (!base) return null;

  const dark = tone === 'dark';

  return (
    <section
      className={cn(
        'section-y',
        dark ? 'bg-[linear-gradient(160deg,#172554_0%,#0b1533_55%,#060b18_100%)]' : 'bg-brand-25 dark:bg-secondary/40',
        className,
      )}
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-[0.18em]',
                dark ? 'text-sky-300' : 'text-brand-600',
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className={cn(
              'mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl',
              dark ? 'text-white' : 'text-foreground',
            )}
          >
            {title}
          </h2>
          {description && (
            <p className={cn('mt-4 leading-relaxed', dark ? 'text-slate-300' : 'text-muted-foreground')}>
              {description}
            </p>
          )}
        </Reveal>

        <Reveal delay={0.08}>
          <div
            ref={frameRef}
            className="group relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-[var(--radius-3xl)] shadow-[0_24px_80px_-24px_rgb(15_23_42/0.6)] ring-1 ring-white/10"
          >
            {/* The film opens and closes on deep navy, so the frame sits on the same value and
                the video reads as part of the page rather than as a pasted-in rectangle. */}
            <div className="aspect-video w-full bg-[#060b18]">
              <video
                ref={videoRef}
                poster={`${base}/${SOURCES.poster}`}
                muted={muted}
                playsInline
                preload={load ? 'auto' : 'none'}
                // Silent film: looping an 80-second piece would be wearing, so it plays once and
                // offers a replay instead.
                onEnded={() => setEnded(true)}
                className="h-full w-full object-cover"
                aria-label={title}
              >
                {load && (
                  <source
                    src={`${base}/${
                      typeof window !== 'undefined' && window.innerWidth < SD_BREAKPOINT
                        ? SOURCES.sd
                        : SOURCES.hd
                    }`}
                    type="video/mp4"
                  />
                )}
              </video>
            </div>

            {/* Controls fade in on hover and whenever the film has finished. Kept off the picture
                while it plays, because there is nothing to adjust in a silent film mid-run. */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity',
                ended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
              )}
            >
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={replay}
                aria-label="Replay"
                className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <RotateCcw className="h-4 w-4" />
                Replay
              </button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
