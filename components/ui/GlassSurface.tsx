
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  ...props 
}) => {
  
  const intensityMap = {
    low: 'bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-md',
    medium: 'bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-xl',
    high: 'bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-2xl'
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden
        ${intensityMap[intensity]}
        border border-white/20 dark:border-white/5
        shadow-2xl shadow-black/5 dark:shadow-black/20
        ring-1 ring-white/20 dark:ring-white/5 inset-ring
        ${className}
      `}
      {...props}
    >
      {/* Noise Texture Overlay for that "Premium Paper" feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      
      {/* Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};
