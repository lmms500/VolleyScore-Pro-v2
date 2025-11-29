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

// Smooth Layout Transition (Magic Swap)
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1
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
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Vignette Pulse (Sudden Death)
export const vignettePulse: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  },
  pulse: {
    opacity: [0.3, 0.7, 0.3],
    boxShadow: [
      "inset 0 0 50px rgba(225, 29, 72, 0.2)", 
      "inset 0 0 150px rgba(225, 29, 72, 0.5)", 
      "inset 0 0 50px rgba(225, 29, 72, 0.2)"
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Stamp Effect (Impact entrance)
export const stampVariants: Variants = {
  hidden: { scale: 2.5, opacity: 0, rotate: -15 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    rotate: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15,
      mass: 0.8
    }
  },
  exit: { 
    scale: 0.5, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Pop & Rotate (Server Indicator)
export const popRotateVariants: Variants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  },
  pop: {
    scale: [1, 1.3, 1],
    rotate: [0, 360],
    transition: { duration: 0.6, ease: "circOut" }
  }
};

// Shake (Timeout/Error)
export const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -3, 3, -3, 3, 0],
    transition: { duration: 0.4 }
  }
};

// Glow Pulse (Sudden Death / Deuce - TopBar)
export const pulseGlowVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: springSnappy
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2 }
  },
  pulse: {
    boxShadow: [
      "0 0 0px rgba(0,0,0,0)",
      "0 0 20px rgba(255,255,255,0.3)",
      "0 0 0px rgba(0,0,0,0)"
    ],
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};