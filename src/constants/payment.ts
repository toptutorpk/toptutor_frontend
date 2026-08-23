/**
 * Where the tutor background-check fee is collected.
 *
 * <p>Everything the payment panel shows lives here, so changing an account detail never means
 * editing a page component. The amount is NOT here — it comes from the server
 * (`VerificationView.backgroundCheckFee`), which is the one that has to agree with what is
 * reconciled.
 *
 * ---------------------------------------------------------------------------
 * ⚠ ONE THING STILL OUTSTANDING — the merchant name.
 *
 * The QR encodes `USAMA Shop`, city Lahore (EMVCo tag 59), and that name is what the payer's app
 * displays at the moment of payment. This panel is labelled TopTutor PK, so a tutor sees one name
 * on the page and another in their wallet — on a page asking for money, that reads as fraud and
 * will cost abandoned payments and support tickets.
 *
 * Renaming the business account is a JazzCash-side change; nothing in the front end can alter what
 * is encoded here. Until it is done, the account title below is the honest thing to question, not
 * the QR.
 * ---------------------------------------------------------------------------
 */
export const BACKGROUND_CHECK_PAYMENT = {
  /** Shown as the account title. Must match what the payer's app displays — see the note above. */
  accountTitle: 'TopTutor PK',

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
   * <p>Static and reusable — Point of Initiation Method (tag 01) is `11`, and there is no
   * Transaction Amount (tag 54), so the payer types the amount in. That is what makes it safe to
   * publish: it replaced a dynamic `12` QR with Rs 299.00 and a one-off bill number baked in,
   * which every tutor would have been paying against the same single-use instance of.
   *
   * <p>To replace: decode the new QR image (any QR reader shows the raw string) and paste it here.
   * The panel regenerates itself — there is no image asset to swap.
   */
  qrPayload:
    '000201010211260600020528760032467f839ccb8e4be1bbad283064dbf82f0108WMBLPKKA0224PK52JCMA0010103095544407520457345802PK5910USAMA Shop6006Lahore530358662460214+92-30955444070611030955444070709984245131630424AE',
} as const;
