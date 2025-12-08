
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
  showCloseButton?: boolean;
  persistent?: boolean;
  onBackdropClick?: () => void; // Propriedade adicionada
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md',
  showCloseButton = true,
  persistent = false,
  onBackdropClick // Propriedade consumida
}) => {
  
  const handleBackdropClick = () => {
    // Prioriza o novo manipulador se ele existir
    if (onBackdropClick) {
        onBackdropClick();
        return;
    }
    // Mantém o comportamento legado
    if (!persistent) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop with Blur */}
          <motion.div 
            className="absolute inset-0 bg-black/40 dark:bg-[#000000]/60 backdrop-blur-md"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={handleBackdropClick}
            style={{ willChange: 'opacity' }}
          />
          
          {/* Container - Ultra Clean Glass */}
          <motion.div 
            className={`
              relative w-full ${maxWidth} 
              bg-[#f8fafc]/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 
              rounded-[2.5rem] shadow-2xl shadow-black/30
              overflow-hidden flex flex-col max-h-[85vh]
              ring-1 ring-black/5 dark:ring-white/5
            `}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            style={{ willChange: 'transform, opacity, filter' }}
          >
            {/* Header - Minimalist */}
            <div className="px-6 pt-5 pb-3 flex justify-between items-center bg-transparent z-10">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-80 pl-1">{title}</h2>
              {showCloseButton && (
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-800 dark:hover:text-white active:scale-95"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Content Area */}
            <div className="p-6 pt-0 overflow-y-auto custom-scrollbar text-slate-700 dark:text-slate-300">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
