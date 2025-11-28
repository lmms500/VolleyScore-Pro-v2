import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const base = "font-inter font-semibold rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-indigo-500/50 dark:focus:ring-white/20";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-t border-white/10",
    secondary: "bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10 hover:border-black/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 dark:border-white/10 dark:hover:border-white/20 backdrop-blur-md",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:border-rose-500/40",
    ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white",
    icon: "p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-transparent hover:border-black/10 dark:hover:border-white/10"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs uppercase tracking-wider",
    md: "px-5 py-3 text-sm tracking-wide",
    lg: "px-8 py-4 text-base tracking-wide",
    xl: "px-10 py-5 text-xl font-bold tracking-tight"
  };

  const appliedSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button className={`${base} ${variants[variant]} ${appliedSize} ${className}`} {...props}>
      {children}
    </button>
  );
};