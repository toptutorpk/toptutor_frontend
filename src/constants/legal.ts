/**
 * Single source of truth for the facts that appear in both legal documents.
 *
 * Legal copy goes stale in one specific way: the entity name, an address or a
 * contact route changes, someone updates the Privacy Policy, and the Terms
 * quietly keep asserting the old fact. Keeping the shared facts here means a
 * change lands in both documents at once — and the effective dates below are
 * the values users are told the documents took effect, so they must only be
 * moved when the text genuinely changes.
 */

/** Registered legal entity — the contracting party, not the brand name. */
export const LEGAL_ENTITY = 'TopTutor (Private) Limited';

/** Short form used mid-sentence once the entity has been introduced. */
export const LEGAL_SHORT = 'TopTutor';

export const REGISTERED_OFFICE = {
  line1: 'Arfa Software Technology Park',
  line2: 'Ferozepur Road',
  city: 'Lahore 54600',
  province: 'Punjab',
  country: 'Pakistan',
} as const;

export const REGISTERED_OFFICE_ONELINE =
  'Arfa Software Technology Park, Ferozepur Road, Lahore 54600, Punjab, Pakistan';

/**
 * Contact routes cited in the documents. `privacy` and `legal` are the two
 * addresses these pages introduce — they must be live mailboxes monitored by a
 * named owner before the documents are published, because both documents
 * commit to statutory response windows against them.
 */
export const LEGAL_CONTACTS = {
  privacy: 'privacy@toptutor.pk',
  legal: 'legal@toptutor.pk',
  support: 'support@toptutor.pk',
  safety: 'safety@toptutor.pk',
  phone: '+92 42 3890 0000',
  phoneHref: 'tel:+924238900000',
} as const;

/**
 * Displayed to users as the date the current text took effect. Bump both this
 * and `DOCUMENT_VERSION` only on a substantive change, and notify existing
 * users when the change is material — the Terms promise exactly that.
 */
export const LEGAL_EFFECTIVE_DATE = '9 August 2026';
export const LEGAL_LAST_UPDATED = '9 August 2026';
export const DOCUMENT_VERSION = '1.0';

/** Governing law and forum asserted by both documents. */
export const GOVERNING_LAW = 'the laws of the Islamic Republic of Pakistan';
export const GOVERNING_FORUM = 'the courts at Lahore, Punjab';

/**
 * Statutory response window quoted for data-subject requests. Thirty days is
 * the commitment made to users; it is deliberately stated in one place so the
 * two documents cannot drift to different promises.
 */
export const DATA_REQUEST_WINDOW_DAYS = 30;

/** Minimum age for an account held in a person's own name. */
export const MINIMUM_ACCOUNT_AGE = 18;
