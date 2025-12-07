
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vignettePulse } from '../../utils/animations';

interface SuddenDeathOverlayProps {
  active: boolean;
}

const flashVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0, 0.8, 0], // Flash effect
    transition: {
      duration: 0.7,
      ease: 'linear',
      repeat: Infinity,
      repeatDelay: 1.5 // Pause between flashes
    }
  }
};

/**
 * Global animated overlay for Sudden Death scenarios.
 * Creates a "breathing" intense red vignette around the screen edges.
 */
export const SuddenDeathOverlay: React.FC<SuddenDeathOverlayProps> = ({ active }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[5] pointer-events-none"
          initial="hidden"
          animate="pulse"
          exit="hidden"
          variants={vignettePulse}
          style={{
            background: 'radial-gradient(circle, transparent 50%, rgba(220, 20, 60, 0.1) 85%, rgba(255, 0, 0, 0.5) 100%)',
            boxShadow: 'inset 0 0 100px 30px rgba(255, 0, 0, 0.6), inset 0 0 20px 10px rgba(255, 0, 0, 0.9)'
          }}
        />
      )}
    </AnimatePresence>
  );
};
