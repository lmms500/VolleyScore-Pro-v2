import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, overlayVariants } from '../../utils/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 dark:bg-[#000000]/60 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          />
          
          {/* Container */}
          <motion.div 
            className={`
              relative w-full ${maxWidth} 
              bg-slate-100/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl 
              border border-black/10 dark:border-white/10 
              rounded-[2rem] shadow-2xl shadow-black/50
              overflow-hidden flex flex-col max-h-[90vh]
            `}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] font-inter opacity-90">{title}</h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar text-slate-700 dark:text-slate-300">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};