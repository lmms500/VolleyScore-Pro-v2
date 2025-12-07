
import { Variants, Transition } from "framer-motion";

/**
 * VolleyScore Pro Motion System 2.0
 * Physics-based configuration for a premium, tactile feel.
 * Updated for "Apple Feel": Higher stiffness, perfect damping.
 */

// --- PHYSICS CONFIGS ---

// "Premium Spring": Padrão para transições de tela e elementos grandes.
// Rápido, mas com peso.
export const springPremium: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 1
};

// "Snappy Spring": Para interações de micro-UI (botões, toggles, badges).
// Resposta imediata, quase mecânica.
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 550,
  damping: 30,
  mass: 0.8
};

// "Heavy Spring": Para Modais e Gavetas. Sensação de inércia física.
export const springHeavy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 35,
  mass: 1.1
};

// "Slow Flow": Para elementos de fundo e ambientais.
export const springFloat: Transition = {
  type: "spring",
  stiffness: 40,
  damping: 20
};

// Layout Transition: Troca de lados suave e imperceptível.
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};

// --- REUSABLE VARIANTS ---

// Modal / Drawer: Entra de baixo com fade sutil.
export const modalVariants: Variants = {
  hidden: { 
    y: 20, 
    opacity: 0,
    scale: 0.96,
    filter: "blur(10px)", // Novo: Blur na entrada
    transition: { duration: 0.2, ease: "easeOut" } 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: springPremium
  },
  exit: { 
    y: 15, 
    opacity: 0, 
    scale: 0.98,
    filter: "blur(5px)",
    transition: { duration: 0.15, ease: "easeIn" }
  }
};

// Backdrop Fade
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.3, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

// Botões: Feedback tátil visual instantâneo.
export const buttonTap: Variants = {
  idle: { scale: 1 },
  tap: { scale: 0.94, transition: { type: "spring", stiffness: 800, damping: 15 } },
  hover: { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 15 } }
};

// List Items (Staggered)
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: springSnappy
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.1 }
  }
};

// Critical Event Pulse (Match Point) - "Heartbeat" humano.
export const pulseHeartbeat: Variants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.85, 1],
    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Stamp Effect (Entrada de Badges)
export const stampVariants: Variants = {
  hidden: { scale: 1.3, opacity: 0, y: 5, filter: "blur(8px)" },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: springSnappy
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    filter: "blur(4px)",
    transition: { duration: 0.15 }
  }
};

// Vignette Pulse (Sudden Death) - Aggressive Red Flash
export const vignettePulse: Variants = {
  hidden: { opacity: 0 },
  pulse: {
    opacity: [0.1, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }
};
