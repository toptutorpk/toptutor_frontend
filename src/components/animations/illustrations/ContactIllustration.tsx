import { motion } from 'framer-motion';

/**
 * Animated SVG stand-in for the contact hero. Built with framer-motion rather
 * than a Lottie asset so the page ships without an external dependency; swap in
 * a real animation later by passing `src` to <LottieAnimation>.
 *
 * Decorative — the surrounding LottieAnimation carries the aria-label.
 */
export function ContactIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 360"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="ct-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1434CB" />
          <stop offset="100%" stopColor="#3F71FF" />
        </linearGradient>
        <linearGradient id="ct-sheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F4FAFF" />
        </linearGradient>
      </defs>

      {/* Soft background blooms */}
      <motion.circle
        cx="330" cy="80" r="70" fill="#C7E2FF" opacity="0.55"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '330px 80px' }}
      />
      <motion.circle
        cx="70" cy="290" r="52" fill="#FBBF24" opacity="0.28"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ transformOrigin: '70px 290px' }}
      />

      {/* The form sheet */}
      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="72" y="66" width="234" height="238" rx="18" fill="url(#ct-sheet)" stroke="#D6D7DC" />
        {/* Field rows draw themselves in, staggered */}
        {[
          { y: 104, w: 84 },
          { y: 140, w: 150 },
          { y: 176, w: 118 },
          { y: 212, w: 162 },
        ].map((row, i) => (
          <g key={row.y}>
            <rect x="98" y={row.y} width="60" height="7" rx="3.5" fill="#99C6FF" opacity="0.75" />
            <motion.rect
              x="98" y={row.y + 15} height="12" rx="6" fill="#E9F4FF"
              initial={{ width: 0 }}
              animate={{ width: row.w }}
              transition={{
                duration: 0.7,
                delay: 0.35 + i * 0.22,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            />
          </g>
        ))}
        {/* Submit button */}
        <rect x="98" y="256" width="104" height="30" rx="8" fill="url(#ct-card)" />
        <rect x="114" y="269" width="52" height="5" rx="2.5" fill="#FFFFFF" opacity="0.9" />
      </motion.g>

      {/* Floating message bubble */}
      <motion.g
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      >
        <rect x="256" y="132" width="120" height="76" rx="16" fill="url(#ct-card)" />
        <path d="M282 208 L282 228 L302 208 Z" fill="#1434CB" />
        {[152, 168, 184].map((y, i) => (
          <motion.rect
            key={y}
            x="276" y={y} height="7" rx="3.5" fill="#FFFFFF"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: [0, 78 - i * 18, 78 - i * 18], opacity: [0, 0.95, 0.95] }}
            transition={{ duration: 2.4, delay: 0.8 + i * 0.3, repeat: Infinity, repeatDelay: 2.2 }}
          />
        ))}
      </motion.g>

      {/* Sent-check badge */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5, type: 'spring', stiffness: 180 }}
        style={{ transformOrigin: '92px 258px' }}
      >
        <circle cx="92" cy="258" r="24" fill="#16A34A" />
        <motion.path
          d="M81 258 L89 266 L104 250"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 1.85, ease: 'easeOut' }}
        />
      </motion.g>
    </svg>
  );
}
