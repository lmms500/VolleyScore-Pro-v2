import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop com Blur Intenso e Escuro */}
      <div 
        className="absolute inset-0 bg-[#000000]/60 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Container de Vidro */}
      <div className={`
        relative w-full ${maxWidth} 
        bg-[#0a0a0a]/80 backdrop-blur-2xl 
        border border-white/10 
        rounded-[2rem] shadow-2xl shadow-black/50
        overflow-hidden flex flex-col max-h-[90vh] 
        animate-in fade-in zoom-in-95 duration-300
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-inter opacity-90">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};