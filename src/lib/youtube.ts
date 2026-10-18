/**
 * Extracts a YouTube video id from the URL forms the platform stores or an admin might paste.
 *
 * <p>Exists because a video published to YouTube has its verification document repointed at the
 * watch URL. Anything rendering that document has to tell "a file I can play" from "a page I must
 * embed" — a `<video>` element pointed at a youtu.be link shows a dead black box, which is what
 * the admin panel did before this.
 *
 * @returns the 11-character id, or null when the URL is not YouTube
 */
export function youtubeIdFrom(url?: string | null): string | null {
  if (!url) return null;
  // youtu.be/<id> · youtube.com/watch?v=<id> · youtube.com/embed/<id> · /shorts/<id>
  const m = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,20})/,
  );
  return m ? m[1] : null;
}

/** Whether a stored document URL points at YouTube rather than at a file in our own storage. */
export function isYoutubeUrl(url?: string | null): boolean {
  return youtubeIdFrom(url) !== null;
}
