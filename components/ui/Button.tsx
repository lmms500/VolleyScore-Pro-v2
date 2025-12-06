
import React from 'react';
import { motion } from 'framer-motion';
import { buttonTap } from '../../utils/animations';
import { useGameAudio } from '../../hooks/useGameAudio';
import { DEFAULT_CONFIG } from '../../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', children, onClick, ...props }) => {
  const audio = useGameAudio({ ...DEFAULT_CONFIG, enableSound: true }); 

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      audio.playTap();
      if (onClick) onClick(e);
  };

  const base = "font-inter font-bold rounded-2xl flex items-center justify-center gap-2 outline-none focus:none select-none relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  
  // Design System Update:
  // - Thinner borders (border-opacity-50 or smaller widths)
  // - Reduced shadow spread
  // - More subtle hover states
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500",
    secondary: "bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 backdrop-blur-md shadow-sm",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 shadow-sm",
    ghost: "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
    icon: "p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/5"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] uppercase tracking-widest",
    md: "px-5 py-3 text-xs uppercase tracking-wider",
    lg: "px-8 py-4 text-sm uppercase tracking-wide",
    xl: "px-10 py-5 text-lg tracking-tight"
  };

  const appliedSize = variant === 'icon' ? '' : sizes[size];

  return (
    <motion.button 
      className={`${base} ${variants[variant]} ${appliedSize} ${className}`}
      variants={buttonTap}
      initial="idle"
      whileTap="tap"
      whileHover="hover"
      onClick={handleClick}
      {...props as any} 
    >
      {children}
    </motion.button>
  );
};
