
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high' | 'transparent';
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  ...props 
}) => {
  
  const intensityMap = {
    low: 'overflow-hidden bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 ring-1 ring-white/20 dark:ring-white/5 inset-ring',
    medium: 'overflow-hidden bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 ring-1 ring-white/20 dark:ring-white/5 inset-ring',
    high: 'overflow-hidden bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 ring-1 ring-white/20 dark:ring-white/5 inset-ring',
    transparent: 'bg-transparent border-none shadow-none ring-0 backdrop-blur-none'
  };

  return (
    <motion.div
      className={`
        relative
        ${intensityMap[intensity]}
        ${className}
      `}
      {...props}
    >
      {/* Noise Texture Overlay - Only show if not fully transparent to avoid muddying the global background */}
      {intensity !== 'transparent' && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};
