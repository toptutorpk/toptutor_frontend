/**
 * The client-side half of the upload rules, shared by the tutor and institute portals.
 *
 * <p>These rules are the server's, not ours: every slot carries the `accept`, `maxBytes` and
 * `pdfMaxBytes` of the upload category the server will validate against, and everything here
 * reads those rather than restating them. Duplicating a server rule is usually a smell, but not
 * for uploads — without a check on this side someone waits for a 3MB photo to finish travelling
 * before being told it was never going to be accepted, and on a phone connection that wait is
 * the whole experience of the step.
 *
 * <p>Extracted from the tutor's VerificationSlot when the institute portal needed the same
 * behaviour. Two copies of a size limit is exactly the kind of thing that drifts, and the one
 * that drifts is always the one nobody is testing.
 */

const PDF_TYPE = 'application/pdf';

/** The upload rules a slot carries, in whichever portal it came from. */
export interface UploadRules {
  kind: 'image' | 'document' | 'video';
  /** Comma-separated MIME types, from the server's upload category. */
  accept?: string;
  maxBytes?: number;
  pdfMaxBytes?: number;
}

export function formatBytes(bytes: number): string {
  // One decimal at most: the point is "a bit over the limit", and 1.1005859375MB says that worse
  // than 1.1MB does.
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

/** MIME type → the name a person would call the file. */
const TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'video/mp4': 'MP4',
  'video/webm': 'WebM',
  'video/quicktime': 'MOV',
};

/**
 * What `kind` used to imply, for a server that does not send the slot's upload rules yet.
 *
 * <p>Not a guess so much as the previous contract written down. Without it, a front-end deployed
 * ahead of its backend reads `undefined.split` and takes the whole page down — and these rules
 * were correct for every slot that existed before the two were separated, so an older server
 * paired with this fallback still behaves exactly as it did.
 */
const LEGACY_ACCEPT: Record<UploadRules['kind'], string> = {
  image: 'image/jpeg,image/png',
  document: 'application/pdf,image/jpeg,image/png',
  video: 'video/mp4,video/webm,video/quicktime',
};
const LEGACY_MAX_BYTES = 500 * 1024;
const LEGACY_PDF_MAX_BYTES = 1024 * 1024;

export function acceptedTypes(slot: UploadRules): string[] {
  return (slot.accept || LEGACY_ACCEPT[slot.kind]).split(',').filter(Boolean);
}

export function maxBytesOf(slot: UploadRules): number {
  return slot.maxBytes ?? LEGACY_MAX_BYTES;
}

export function pdfMaxBytesOf(slot: UploadRules): number {
  return slot.pdfMaxBytes ?? (slot.kind === 'document' ? LEGACY_PDF_MAX_BYTES : LEGACY_MAX_BYTES);
}

/** "JPG or PNG", "PDF, JPG or PNG" — the formats named the way the file dialog names them. */
export function formatList(slot: UploadRules): string {
  const names = [...new Set(acceptedTypes(slot).map((t) => TYPE_LABELS[t] ?? t))];
  if (names.length <= 1) return names[0] ?? 'a file';
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/** What this slot will take, phrased for the box itself. */
export function acceptHint(slot: UploadRules): string {
  const formats = formatList(slot);
  if (slot.kind === 'video') return formats;
  // Two caps only where they actually differ — repeating the same number twice reads as a rule
  // with an exception when there isn't one.
  return pdfMaxBytesOf(slot) !== maxBytesOf(slot)
    ? `${formats} · ${formatBytes(maxBytesOf(slot))} image, ${formatBytes(pdfMaxBytesOf(slot))} PDF`
    : `${formats} · max ${formatBytes(maxBytesOf(slot))}`;
}

/**
 * Why this file cannot be uploaded, or null if it can.
 *
 * <p>Returns the reason rather than a boolean so the message can name the actual problem — the
 * wrong format and the right format-but-too-big need different answers.
 */
export function rejectReason(file: File, slot: UploadRules): string | null {
  if (slot.kind === 'video') return null; // videos keep the server's own, much larger, limits

  if (!acceptedTypes(slot).includes(file.type)) {
    return `This slot takes ${formatList(slot)}.`;
  }

  const isPdf = file.type === PDF_TYPE;
  const limit = isPdf ? pdfMaxBytesOf(slot) : maxBytesOf(slot);
  if (file.size > limit) {
    return `This file is ${formatBytes(
      Math.round(file.size / 1024) * 1024,
    )}. The limit is ${formatBytes(limit)} for ${isPdf ? 'a PDF' : 'an image'}.`;
  }
  return null;
}
