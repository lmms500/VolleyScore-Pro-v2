import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vignettePulse } from '../../utils/animations';

interface SuddenDeathOverlayProps {
  active: boolean;
}

/**
 * Global animated overlay for Sudden Death scenarios.
 * Creates a "breathing" red vignette around the screen edges.
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
            background: 'radial-gradient(circle, transparent 60%, rgba(225, 29, 72, 0.15) 100%)',
          }}
        />
      )}
    </AnimatePresence>
  );
};