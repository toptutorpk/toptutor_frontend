import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/**
 * A QR code drawn as vector SVG.
 *
 * <p>Generated from the payload rather than shipped as a picture, which is the only way to get one
 * that is sharp at every size: a screenshot of a QR carries whatever resolution the phone happened
 * to capture, and enlarging it on a desktop page softens exactly the edges a camera needs to find
 * the module grid. Drawn as paths, the same code is crisp in a 140px card and on a printed page.
 *
 * <p>Always dark-on-white, in both themes. Scanners tolerate an inverted QR poorly, and a payment
 * code is the last place to find out — so this deliberately ignores the colour scheme.
 */
export interface QrCodeProps {
  /** The exact string to encode. */
  value: string;
  /**
   * Error-correction level. `M` is the payment-QR convention: enough redundancy for a phone camera
   * at an angle, without the extra density of `Q`/`H` that makes the modules smaller on screen.
   */
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
  /** Describes the code for screen readers — it is an image, not decoration. */
  label: string;
}

/** ISO/IEC 18004 requires four clear modules around the symbol for a scanner to find it. */
const QUIET_ZONE = 4;

export function QrCode({ value, level = 'M', className, label }: QrCodeProps) {
  const { path, span } = useMemo(() => {
    // Type version 0 = pick the smallest symbol the payload fits into.
    const qr = qrcode(0, level);
    qr.addData(value);
    qr.make();

    const count = qr.getModuleCount();
    // One path for the whole symbol rather than a rect per module: a dense payment QR is a few
    // thousand modules, and that many DOM nodes is what makes naive QR components janky.
    let d = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, span: count + QUIET_ZONE * 2 };
  }, [value, level]);

  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      className={className}
      role="img"
      aria-label={label}
      // Without this the browser antialiases every module edge, and a scanner reads a blurred
      // grid — the one rendering hint this component cannot do without.
      shapeRendering="crispEdges"
    >
      <rect width={span} height={span} fill="#ffffff" />
      <path d={path} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} fill="#000000" />
    </svg>
  );
}
