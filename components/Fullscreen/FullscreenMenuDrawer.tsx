import React from 'react';
import { X, Users, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface FullscreenMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
  onExitFullscreen: () => void;
}

export const FullscreenMenuDrawer: React.FC<FullscreenMenuDrawerProps> = ({
  isOpen, onClose, onOpenSettings, onOpenRoster, onExitFullscreen
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-80 max-w-[90vw] z-[70]
        bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl
        transform transition-transform duration-300 ease-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">{t('game.menu')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <button onClick={() => { onOpenRoster(); onClose(); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group">
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 group-hover:text-cyan-200 group-hover:scale-110 transition-transform">
                <Users size={20} />
            </div>
            <div>
                <span className="block text-sm font-bold text-slate-200 group-hover:text-white uppercase tracking-wide">{t('controls.teams')}</span>
                <span className="text-[10px] text-slate-500">{t('teamManager.title')}</span>
            </div>
          </button>

          <button onClick={() => { onOpenSettings(); onClose(); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group">
            <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:text-indigo-200 group-hover:scale-110 transition-transform">
                <Settings size={20} />
            </div>
            <div>
                <span className="block text-sm font-bold text-slate-200 group-hover:text-white uppercase tracking-wide">{t('controls.settings')}</span>
                <span className="text-[10px] text-slate-500">{t('settings.title')}</span>
            </div>
          </button>

          <div className="border-t border-white/10 my-4"></div>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 text-slate-400">
             <span className="text-xs font-bold uppercase tracking-wider">{t('settings.appearance.theme')}</span>
             {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
             <button onClick={onExitFullscreen} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 border border-rose-500/20 transition-all font-bold uppercase tracking-widest text-xs">
                <LogOut size={16} />
                {t('controls.exitFullscreen')}
             </button>
        </div>
      </div>
    </>
  );
};