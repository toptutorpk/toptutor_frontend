/** The character used to blank out hidden parts of a contact detail, shared with phone masking. */
export const MASK_CHAR = '•';

export const EMAIL_ERROR = 'Please enter a valid email address';

/**
 * Local part as an RFC 5322 dot-atom: atoms of permitted characters, joined by single dots.
 *
 * <p>Because the dots have to separate non-empty atoms, this rejects a leading dot, a trailing dot
 * and a doubled dot without needing to test for them. Quoted local parts ("john doe"@example.com)
 * are legal and not supported: essentially nobody has one, and accepting them would mean accepting
 * spaces and quotes into a field the rest of the system treats as a simple token.
 */
const LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/** One domain label: alphanumeric ends, hyphens only inside, 63 characters at most. */
const LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/**
 * The final label. Letters only and at least two of them — every real top-level domain is — or an
 * IDN in its punycode form, which is where the digits and hyphens in a TLD legitimately come from.
 *
 * <p>This is the rule that rejects alihassan@gmail.c. A one-letter TLD has never been delegated,
 * so a single trailing letter is a typed-too-fast .com far more often than it is an address.
 */
const TLD = /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})$/;

/** RFC 5321 limits: 64 octets for the local part, 254 for the whole address. */
const MAX_LOCAL = 64;
const MAX_TOTAL = 254;

/**
 * Whether the address is one we are willing to send mail to.
 *
 * <p>Deliberately stricter than the letter of RFC 5322 and stricter than a validator that only
 * looks for "something, an at-sign, something, a dot, something". The loose shape is what let
 * {@code alihassan@gmail.c} through to the point of sending an OTP — an address that cannot
 * receive one, discovered only when the code never arrives and the account is already half made.
 *
 * <p>What it turns away, none of which the previous check did: a top-level domain of one letter or
 * containing digits, a domain label opening or closing with a hyphen, an empty label from a
 * doubled or trailing dot, a local part starting or ending with a dot or containing two in a row,
 * more than one at-sign, and anything past the length limits.
 *
 * <p>Structure is all this can establish. Whether the mailbox exists is a question only sending to
 * it can answer, which is what the verification code is for.
 */
export function isValidEmail(raw: string | null | undefined): boolean {
  if (!raw) return false;

  const value = raw.trim();
  if (value.length === 0 || value.length > MAX_TOTAL) return false;

  const at = value.indexOf('@');
  // Rejects a missing at-sign, an empty local part, and any second at-sign.
  if (at < 1 || at !== value.lastIndexOf('@')) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length > MAX_LOCAL || !LOCAL.test(local)) return false;

  const labels = domain.split('.');
  // A bare hostname is a valid address on a local network and never one a person signs up with.
  if (labels.length < 2) return false;
  if (!labels.every((label) => LABEL.test(label))) return false;

  return TLD.test(labels[labels.length - 1]);
}

/**
 * The form an address is stored and compared in: trimmed and lower-cased.
 *
 * <p>Domains are case-insensitive, and no mail provider anyone signs up with treats the local part
 * as case-sensitive, so Ali@Gmail.com and ali@gmail.com are one account. Applied before the
 * address is sent, for the same reason phone numbers are canonicalised before they are sent: two
 * spellings of one identity are two accounts unless something reduces them to one.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * An email address with its local part hidden: {@code jamil@gmail.com} → {@code j••••@gmail.com}.
 *
 * <p>For confirmations that name where a code was sent. The first character and the domain are
 * enough for the owner to recognise their own address, and not enough for anyone reading over their
 * shoulder to learn one they did not already know.
 *
 * <p>The run of dots is a fixed length rather than the real one. Masking that preserves length
 * still discloses it, and the number of characters in someone's address is not worth leaking to
 * make the mask look tidy.
 *
 * <p>Anything without an '@' is returned unchanged: this is a display helper, and a value that
 * isn't an address is better shown as-is than mangled into something misleading.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';

  const at = email.lastIndexOf('@');
  if (at < 1) return email;

  const local = email.slice(0, at);
  const domain = email.slice(at);
  return `${local[0]}${MASK_CHAR.repeat(4)}${domain}`;
}
