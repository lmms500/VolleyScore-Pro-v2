
import React, { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence, Transition, Variants } from 'framer-motion';

interface ScoreTickerProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

const tickerTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 35, // High damping for no-bounce, precise stop
  mass: 1
};

/**
 * ScoreTicker (AnimatedNumber)
 * Implements a vertical slide animation based on value direction.
 * Prev < Curr: Slide Up (New comes from bottom).
 * Prev > Curr: Slide Down (New comes from top).
 */
export const ScoreTicker: React.FC<ScoreTickerProps> = memo(({ value, className, style }) => {
  const prevValue = useRef(value);
  const [direction, setDirection] = useState(0); // 1 = Increase, -1 = Decrease

  useEffect(() => {
    if (value > prevValue.current) {
      setDirection(1);
    } else if (value < prevValue.current) {
      setDirection(-1);
    }
    prevValue.current = value;
  }, [value]);

  const variants: Variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "70%" : "-70%",
      opacity: 0,
      scale: 0.8,
      filter: "blur(8px)",
      zIndex: 1
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      zIndex: 2,
      transition: tickerTransition
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-70%" : "70%",
      opacity: 0,
      scale: 0.8,
      filter: "blur(8px)",
      zIndex: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    })
  };

  return (
    // Removed overflow: hidden to prevent large font clipping (border cutting off numbers)
    <div className={`relative inline-grid place-items-center ${className}`} style={{ ...style }}>
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.span
          key={value}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="block w-full text-center leading-none"
          // Force hardware acceleration for smoother text rendering during transform
          style={{ willChange: "transform, opacity, filter" }} 
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
