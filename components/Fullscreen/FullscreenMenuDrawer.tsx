
import React from 'react';
import { X, Users, Settings, LogOut, Sun, Moon, History, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface FullscreenMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
  onOpenHistory: () => void;
  onExitFullscreen: () => void;
}

const MenuButton = ({ 
  icon: Icon, 
  label, 
  subLabel, 
  onClick, 
  colorClass, 
  bgClass 
}: { 
  icon: any, 
  label: string, 
  subLabel: string, 
  onClick: () => void,
  colorClass: string,
  bgClass: string 
}) => (
  <button 
    onClick={onClick} 
    className="
      w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden
      bg-white dark:bg-white/5 
      hover:bg-slate-50 dark:hover:bg-white/10 
      border border-slate-200 dark:border-white/5 
      hover:border-slate-300 dark:hover:border-white/10
      shadow-sm hover:shadow-md
    "
  >
    <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 ${bgClass} ${colorClass}`}>
        <Icon size={20} strokeWidth={2} />
    </div>
    <div className="flex-1 text-left">
        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide transition-colors">
          {label}
        </span>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {subLabel}
        </span>
    </div>
    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
  </button>
);

export const FullscreenMenuDrawer: React.FC<FullscreenMenuDrawerProps> = ({
  isOpen, onClose, onOpenSettings, onOpenRoster, onOpenHistory, onExitFullscreen
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-80 max-w-[90vw] z-[70]
        bg-slate-50/90 dark:bg-[#0a0a0a]/90 
        backdrop-blur-3xl 
        border-l border-white/20 dark:border-white/10 
        shadow-2xl shadow-black/20 dark:shadow-black/80
        transform transition-transform duration-300 ease-out cubic-bezier(0.16, 1, 0.3, 1)
        flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/[0.02]">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
            {t('game.menu')}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          
          <MenuButton 
            onClick={() => { onOpenRoster(); onClose(); }}
            icon={Users}
            label={t('controls.teams')}
            subLabel={t('teamManager.title')}
            colorClass="text-cyan-600 dark:text-cyan-400"
            bgClass="bg-cyan-100 dark:bg-cyan-500/20"
          />

          <MenuButton 
            onClick={() => { onOpenHistory(); onClose(); }}
            icon={History}
            label={t('controls.history')}
            subLabel={t('historyList.title')}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-100 dark:bg-amber-500/20"
          />

          <MenuButton 
            onClick={() => { onOpenSettings(); onClose(); }}
            icon={Settings}
            label={t('controls.settings')}
            subLabel={t('settings.title')}
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-100 dark:bg-indigo-500/20"
          />

          <div className="h-px bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent my-2"></div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
             <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
               {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
               {t('settings.appearance.theme')}
             </span>
             <div className="px-2 py-1 rounded-md bg-black/5 dark:bg-black/20 text-[10px] font-bold uppercase">
               {theme === 'dark' ? 'Dark' : 'Light'}
             </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
             <button 
                onClick={onExitFullscreen} 
                className="
                  w-full flex items-center justify-center gap-2 p-4 rounded-2xl 
                  bg-rose-50 dark:bg-rose-500/10 
                  text-rose-600 dark:text-rose-400 
                  hover:bg-rose-100 dark:hover:bg-rose-500/20 
                  hover:text-rose-700 dark:hover:text-rose-300 
                  border border-rose-200 dark:border-rose-500/20 
                  transition-all font-bold uppercase tracking-widest text-xs shadow-sm
                "
             >
                <LogOut size={16} />
                {t('controls.exitFullscreen')}
             </button>
        </div>
      </div>
    </>
  );
};
