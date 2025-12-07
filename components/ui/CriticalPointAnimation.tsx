
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vignettePulse } from '../../utils/animations';

interface SuddenDeathOverlayProps {
  active: boolean;
}

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
            background: 'radial-gradient(circle, transparent 40%, rgba(220, 20, 60, 0.4) 85%, rgba(255, 0, 0, 0.6) 100%)',
            boxShadow: 'inset 0 0 80px 20px rgba(255, 0, 0, 0.4)'
          }}
        />
      )}
    </AnimatePresence>
  );
};
