import { Variants, Transition } from "framer-motion";

/**
 * VolleyScore Pro Motion System
 * Physics-based configuration for a premium, tactile feel.
 */

// --- PHYSICS CONFIGS ---

// "Heavy" spring for major layout changes (drawers, modals)
export const springHeavy: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 35, // Low bounce, solid stop
  mass: 1.2
};

// "Snappy" spring for micro-interactions (numbers, buttons)
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1
};

// "Floaty" spring for ambient effects
export const springFloat: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20
};

// --- REUSABLE VARIANTS ---

// Modal / Drawer Slide Up
export const modalVariants: Variants = {
  hidden: { 
    y: "100%", 
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 } // Fast exit
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: springHeavy
  },
  exit: { 
    y: "40%", 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Backdrop Fade
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.3 } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2 } 
  }
};

// Button Tap (Tactile)
export const buttonTap: Variants = {
  tap: { scale: 0.92 },
  hover: { scale: 1.02 }
};

// List Items (Enter/Exit)
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: springSnappy
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    transition: { duration: 0.2 }
  }
};

// Critical Event Pulse (Match Point)
export const pulseHeartbeat: Variants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};