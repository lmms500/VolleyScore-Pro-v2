import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface CriticalPointOverlayProps {
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
 * Creates an intense, unmissable red flash to signify a critical moment.
 */
export const SuddenDeathOverlay: React.FC<CriticalPointOverlayProps> = ({ active }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[5] pointer-events-none"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={flashVariants}
          style={{
            // Use a saturated, vibrant red with a wider gradient for impact
            background: 'radial-gradient(circle, transparent 40%, #EF4444 110%)',
          }}
        />
      )}
    </AnimatePresence>
  );
};

const pulseVariants: Variants = {
  hidden: { opacity: 0, scale: 1 },
  visible: {
    opacity: [0, 0.5, 0], // Softer pulse effect
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    }
  }
};

/**
 * Softer pulse for Match Point scenarios. Less intrusive than Sudden Death.
 */
export const MatchPointOverlay: React.FC<CriticalPointOverlayProps> = ({ active }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[5] pointer-events-none"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={pulseVariants}
          style={{
            // Using a less intense amber/orange color for match point
            background: 'radial-gradient(circle, transparent 65%, #F59E0B 100%)',
          }}
        />
      )}
    </AnimatePresence>
  );
};
