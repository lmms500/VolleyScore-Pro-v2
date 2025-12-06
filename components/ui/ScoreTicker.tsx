
import React, { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '../../utils/animations';

interface ScoreTickerProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ScoreTicker
 * Animates numbers sliding up/down like an odometer based on value change.
 * Memoized to prevent re-renders when parent re-renders but value is identical.
 */
export const ScoreTicker: React.FC<ScoreTickerProps> = memo(({ value, className, style }) => {
  const prevValue = useRef(value);
  const [direction, setDirection] = useState(0); // 1 = up (increase), -1 = down (decrease)

  useEffect(() => {
    if (value > prevValue.current) {
      setDirection(1);
    } else if (value < prevValue.current) {
      setDirection(-1);
    }
    prevValue.current = value;
  }, [value]);

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "50%" : "-50%",
      opacity: 0,
      scale: 0.5,
      filter: "blur(10px)"
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: springSnappy
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-50%" : "50%",
      opacity: 0,
      scale: 1.2,
      filter: "blur(10px)",
      transition: { duration: 0.15 } // Quick exit
    })
  };

  return (
    <div className={`relative inline-grid place-items-center overflow-visible ${className}`} style={style}>
        {/* We use popLayout so elements don't push each other around, they overlap */}
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.span
          key={value}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="block w-full text-center leading-none"
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
});
