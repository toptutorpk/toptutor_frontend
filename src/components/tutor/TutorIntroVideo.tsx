import { useState } from 'react';
import { PlayCircle } from 'lucide-react';

interface TutorIntroVideoProps {
  /** YouTube video id, when the branded cut was published there. Wins over `videoUrl`. */
  youtubeId?: string | null;
  /** Direct URL to an MP4 in storage, when the cut was published to Cloudflare R2. */
  videoUrl?: string | null;
  /** Shown as the still frame before playback starts. */
  posterUrl?: string | null;
  /** The tutor's name, for the accessible label — a player called "video" tells nobody anything. */
  name: string;
}

/**
 * Plays a tutor's introduction video from whichever destination it was published to.
 *
 * <p>The two sources are not interchangeable: an R2 object is a file a `<video>` element can play,
 * while YouTube only hands out an embed. Both can be set at once — a tutor processed under one
 * upload mode and later reprocessed under the other leaves both behind — so the precedence is
 * fixed rather than incidental: **YouTube wins**, because that is the copy the pipeline keeps
 * when it runs in `Y` mode and deletes the storage original.
 *
 * Renders nothing at all when neither is present. A tutor who is live but whose video is still
 * encoding should not see an empty frame promising something that is not there.
 */
export function TutorIntroVideo({ youtubeId, videoUrl, posterUrl, name }: TutorIntroVideoProps) {
  // Nothing loads until the viewer asks for it. A YouTube iframe pulls several hundred KB and
  // sets cookies on sight; an autoplaying MP4 is worse on a phone plan. The facade below costs
  // one image.
  const [playing, setPlaying] = useState(false);

  if (!youtubeId && !videoUrl) {
    return null;
  }

  const frame =
    'group relative aspect-video w-full overflow-hidden rounded-2xl border bg-slate-900';

  if (playing) {
    return (
      <div className={frame}>
        {youtubeId ? (
          <iframe
            // youtube-nocookie.com so a visitor who never presses play is not tracked, and
            // `autoplay=1` because they just did press it.
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={`${name} — video introduction`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <video
            src={videoUrl ?? undefined}
            poster={posterUrl ?? undefined}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-contain bg-black"
          >
            Your browser cannot play this video.
          </video>
        )}
      </div>
    );
  }

  return (
    <div className={frame}>
      <img
        // A YouTube thumbnail is free and already the right frame; hqdefault exists for every
        // video, where maxresdefault does not and would leave a broken image.
        src={youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : (posterUrl ?? undefined)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-60"
      />
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play ${name}'s video introduction`}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/90 text-brand-600 shadow-lg transition-transform group-hover:scale-110">
          <PlayCircle className="h-9 w-9" />
        </span>
      </button>
    </div>
  );
}
