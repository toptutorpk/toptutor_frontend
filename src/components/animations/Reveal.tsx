import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

const variants: Variants = {
  hidden: (custom: { y: number }) => ({ opacity: 0, y: custom.y }),
  visible: { opacity: 1, y: 0 },
};

/** Fade + slide up when scrolled into view. The workhorse scroll animation. */
export function Reveal({ children, className, delay = 0, y = 24, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      custom={{ y }}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
