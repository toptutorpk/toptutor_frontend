/**
 * Where the tutor background-check fee is collected.
 *
 * <p>Everything the payment panel shows lives here, so changing an account detail never means
 * editing a page component. The amount is NOT here — it comes from the server
 * (`VerificationView.backgroundCheckFee`), which is the one that has to agree with what is
 * reconciled.
 */
export const BACKGROUND_CHECK_PAYMENT = {
  /**
   * Shown as the account title.
   *
   * <p>Spelled exactly as the QR encodes it (EMVCo tag 59), because that string is what the payer's
   * wallet displays at the moment of payment. Any difference — including the casing of "Pk" — puts
   * one name on the page and another in the app, and on a screen asking for money that reads as
   * fraud. If the JazzCash account is renamed again, this and `qrPayload` move together.
   */
  accountTitle: 'TopTutor Pk',

  /**
   * JazzCash Till ID, for paying without scanning.
   *
   * <p>Matches the Terminal Label encoded in `qrPayload` (EMVCo tag 62, subtag 07), so the two
   * routes provably point at the same till.
   */
  tillId: '984245131',

  /** The JazzCash shortcode to dial, then enter the Till ID — the route for a tutor with no camera. */
  ussdCode: '*786*10#',

  /**
   * Raw EMVCo payload from the static merchant QR, rendered to a vector QR at display time.
   *
   * <p>Verified on the way in rather than pasted on trust — decoded from the poster image, CRC
   * (tag 63) recomputed and matched, and the structure parsed:
   *
   * <ul>
   *   <li>tag 01 = <strong>11</strong>, a STATIC QR: reusable, no fixed amount. That is what makes
   *       it safe to publish — a dynamic `12` QR carries one bill, and every tutor would be paying
   *       against the same single-use instance of it.
   *   <li><strong>no tag 54</strong>, so the payer types the amount in. The panel shows the fee the
   *       server states and the QR does not contradict it.
   *   <li>tag 59 = <code>TopTutor Pk</code> — the name the payer's wallet shows, matching
   *       `accountTitle` above.
   *   <li>tag 62 subtag 07 = <code>984245131</code>, the same till as `tillId`.
   * </ul>
   *
   * <p>To replace: decode the new QR image (any QR reader shows the raw string), check those four
   * points, and paste it here. The panel regenerates the image itself — there is no asset to swap.
   */
  qrPayload:
    '000201010211260600020528760032ed4f5fe2e5614e6cbd07d49765ca8a470108WMBLPKKA0224PK52JCMA0010103095544407520457345802PK5911TopTutor Pk6006Lahore530358662460214+92-309554440706110309554440707099842451316304B6CD',
} as const;

/** How a learner pays for a session. The server's enum uses the same spelling. */
export type BookingPaymentMethod = 'CARD' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER';

export interface BookingPaymentMethodInfo {
  id: BookingPaymentMethod;
  name: string;
  /** One line under the name on the method picker. */
  blurb: string;
  /** Short chip beside the name, if any. */
  tag?: string;
  /** Colour of the tag chip. */
  tagTone?: 'success' | 'info' | 'neutral';
  /**
   * Processing fee the learner pays on top of the session price, as a percentage. Absent means free.
   * The server adds the same fee when it sets the amount to charge; this copy is only for display.
   */
  feePercent?: number;
  /**
   * Path under `public/` to the provider's official mark. Until one is dropped in, the tile falls
   * back to a lucide icon in the provider's colour — never a home-drawn imitation of a logo.
   */
  logo?: string;
  /**
   * The provider's wordmark (dark artwork on transparent). Always shown on a white surface — it is
   * someone else's brand, so it is never recoloured to suit a dark theme.
   */
  wordmark?: string;
  /**
   * Whether the server can take this method yet. A method that is not live is still shown (so the
   * learner knows it is coming) but cannot be selected — except in mock mode, where the whole flow
   * runs against a simulated provider for design review.
   */
  live: boolean;
}

/**
 * Listed in the order the picker shows them: the wallets first, because they are what most
 * learners pay with and they carry no fee.
 */
export const BOOKING_PAYMENT_METHODS: readonly BookingPaymentMethodInfo[] = [
  {
    id: 'EASYPAISA',
    name: 'Easypaisa',
    logo: '/payments/easypaisa-logo.png',
    wordmark: '/payments/easypaisa-text.png',
    blurb: 'Approve from your Easypaisa mobile account · no fee',
    tag: 'Most used',
    tagTone: 'success',
    live: false,
  },
  {
    id: 'JAZZCASH',
    name: 'JazzCash',
    logo: '/payments/jazzcash-logo.png',
    wordmark: '/payments/jazzcash-text.png',
    blurb: 'Approve from your JazzCash mobile account · no fee',
    tag: 'Most used',
    tagTone: 'success',
    live: false,
  },
  {
    id: 'CARD',
    name: 'Debit / Credit card',
    blurb: 'Visa, Mastercard, UnionPay, PayPak · 2.25% processing fee',
    feePercent: 2.25,
    live: true,
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Bank transfer',
    blurb: 'IBFT / Raast to our account · confirmed within 1 hour · no fee',
    tag: 'Manual review',
    tagTone: 'neutral',
    live: false,
  },
] as const;

/**
 * Where learners send a manual bank transfer for a session.
 *
 * <p>PLACEHOLDER — these are not real account details. Bank transfer stays non-live (see
 * `BOOKING_PAYMENT_METHODS`) until they are replaced with the account the finance team reconciles
 * against; the panel only renders them in mock mode.
 */
export const BOOKING_BANK_ACCOUNT = {
  bankName: 'Meezan Bank',
  accountTitle: 'TopTutor Pk',
  accountNumber: '0000 0000000000',
  iban: 'PK00 MEZN 0000 0000 0000 0000',
  /** How long an admin takes to match a transfer to its booking, stated to the learner. */
  reviewWindow: 'within 1 hour',
} as const;

/** Mirrors the server's `booking.hold-minutes`: how long an unpaid booking keeps its slot. */
export const BOOKING_HOLD_MINUTES = 15;
