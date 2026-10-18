/**
 * Pakistani CNIC numbers: one accepted set of inputs, one stored form.
 *
 * <p>A CNIC is thirteen digits. Two input shapes are accepted, and nothing else:
 *
 * <pre>
 *   1234512345671     13 digits
 *   12345-1234567-1   the same, written as it appears on the card
 * </pre>
 *
 * <p>Both describe one number and both normalise to the dashed form, because that is how it is
 * printed on the card a reviewer checks the profile against — reading the two side by side should
 * not require reformatting either.
 *
 * <p>Separators other than the card's own dashes are rejected rather than stripped, for the same
 * reason the phone rules reject them: every accepted variation is another shape the rest of the
 * system must be trusted to normalise. The server applies the identical rule, since a browser
 * cannot promise anything about what reaches the database.
 */

/** Canonical form, as stored and transmitted. */
export const CNIC_CANONICAL = /^\d{5}-\d{7}-\d$/;

/** The two accepted input shapes. */
const ACCEPTED = /^\d{5}-?\d{7}-?\d$/;

/**
 * Shown when a CNIC fails the rule.
 *
 * <p>Carries the shape, unlike the phone message: a CNIC is copied off a card rather than known by
 * heart, so the useful correction is what the thirteen digits should look like.
 */
export const CNIC_ERROR = 'Enter a valid CNIC, e.g. 12345-1234567-1';

/** The canonical dashed form of an accepted input, or null if the input is not one of the two. */
export function toCanonicalCnic(raw: string): string | null {
  // Surrounding whitespace comes from paste and autofill rather than from the person typing.
  const value = raw.trim();
  if (!ACCEPTED.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/** Whether the input is one of the accepted shapes. Empty is not valid — callers allow it if optional. */
export function isValidCnic(raw: string): boolean {
  return toCanonicalCnic(raw) !== null;
}
