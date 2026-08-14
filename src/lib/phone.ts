/**
 * Pakistani mobile numbers: one accepted set of inputs, one stored form, one displayed form.
 *
 * <p>Three input shapes are accepted, and nothing else:
 *
 * <pre>
 *   03001234567     11 digits, leading 0
 *   923001234567    12 digits, leading country code
 *   +923001234567   the same, written with a plus
 * </pre>
 *
 * <p>All three describe one number and all three normalise to a single canonical value,
 * {@code +923001234567}. That canonical form is what leaves this application — it is what gets
 * stored, what OTPs are sent to, what a login is looked up by, and what a duplicate is judged
 * against. Anything shown back to a person is rendered in the local {@code 03…} form instead,
 * because that is how the number is read aloud and written down in Pakistan.
 *
 * <p>Separators are deliberately rejected rather than stripped. A space or a dash is easy to
 * accept and harmless in isolation, but every accepted variation is another shape the rest of the
 * system has to be trusted to normalise; refusing them keeps the accepted set exactly as narrow as
 * it is specified to be. Only the leading '+' is punctuation, and only in the third form.
 *
 * <p>No dependency on a phone-number library. The general-purpose parsers accept far more than
 * this — separators, extensions, every region on earth — and widening the accepted set is the one
 * thing this must not do.
 *
 * <p>This is input hygiene, not a security boundary. The server has to apply the same rule to the
 * same values; a browser is not in a position to promise anything about what reaches the database.
 */

import { MASK_CHAR } from '@/lib/email';

/** The national significant number: a mobile prefix and eight further digits. */
const NATIONAL = /^3\d{9}$/;

/** Canonical form, as stored and transmitted. */
export const PHONE_E164 = /^\+923\d{9}$/;

/**
 * Shown when a number fails the rule.
 *
 * <p>Says that the number is wrong and nothing more. Reciting the three accepted spellings back at
 * someone reads as a specification rather than a correction, and it is the wrong help anyway: a
 * person who has mistyped their own number needs to look at it again, not to be taught a format.
 * The placeholder already shows the shape for anyone who has not started typing.
 */
export const PHONE_ERROR = 'Please enter a valid phone number';

/**
 * The canonical E.164 form of an accepted input, or null if the input is not one of the three.
 *
 * <p>Returns null rather than throwing: every caller here is validating user input, where an
 * invalid value is an expected outcome and not an exceptional one.
 */
export function toE164(raw: string): string | null {
  // Surrounding whitespace comes from paste and autofill rather than from the person typing, so it
  // is trimmed. Whitespace *within* the number is not: that is a separator, and separators are not
  // part of the accepted set.
  const value = raw.trim();

  let national: string;
  if (value.startsWith('+92')) {
    national = value.slice(3);
  } else if (value.startsWith('92')) {
    national = value.slice(2);
  } else if (value.startsWith('0')) {
    national = value.slice(1);
  } else {
    return null;
  }

  return NATIONAL.test(national) ? `+92${national}` : null;
}

/** Whether the input is one of the three accepted forms. */
export function isValidPhone(raw: string): boolean {
  return toE164(raw) !== null;
}

/**
 * Canonical E.164 → the local form shown to people: {@code +923001234567} → {@code 03001234567}.
 *
 * <p>Passes anything it does not recognise straight through. Display must never be the thing that
 * fails: a number that predates this rule, or one the server stored in some other shape, is better
 * rendered as-is than replaced with an error.
 */
export function toNationalDisplay(e164: string | null | undefined): string {
  if (!e164) return '';
  return PHONE_E164.test(e164) ? `0${e164.slice(3)}` : e164;
}

/**
 * The local form with the middle hidden: {@code 0300•••••67}.
 *
 * <p>For "we sent a code to…" confirmations, where the point is to let someone recognise their own
 * number without printing it in full on a shared screen. The operator prefix and the last two
 * digits are what make a number recognisable to its owner; the rest is what identifies it to
 * everyone else.
 *
 * <p>Uses the same mask character as the email masker, so a phone and an email sitting next to each
 * other read as one treatment rather than two.
 */
export function toMaskedDisplay(e164: string | null | undefined): string {
  const national = toNationalDisplay(e164);
  if (national.length !== 11) return national;
  return `${national.slice(0, 4)}${MASK_CHAR.repeat(5)}${national.slice(9)}`;
}

/**
 * Normalises a login identifier, which may be an email address or a phone number.
 *
 * <p>Someone who registers as {@code +923001234567} and later signs in as {@code 03001234567} has
 * given the same credential and must reach the same account, so a phone-shaped identifier is
 * converted before it is sent. Anything else — an email, or a phone that fails the rule — is passed
 * through untouched and left for the server to reject, since guessing at intent here would only
 * turn a wrong password into a confusing error.
 */
export function normalizeIdentifier(raw: string): string {
  const value = raw.trim();
  if (value.includes('@')) return value;
  return toE164(value) ?? value;
}
