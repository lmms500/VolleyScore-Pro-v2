
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameConfig } from '../../types';
import { Check, Trophy, Sun, Zap, Download, Share, Smartphone, Menu, Moon, AlertTriangle, Globe } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onSave: (config: GameConfig, reset: boolean) => void;
  onInstall?: () => void;
  canInstall?: boolean;
  isIOS?: boolean;
  isStandalone?: boolean;
  isMatchActive: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, config, onSave, 
    onInstall, canInstall, isIOS, isStandalone, isMatchActive
}) => {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const hasConfigChanged = JSON.stringify(localConfig) !== JSON.stringify(config);
  const requiresReset = hasConfigChanged && isMatchActive;

  const handleSave = () => {
    onSave(localConfig, requiresReset);
    onClose();
  };

  const setPresetFIVB = () => setLocalConfig(prev => ({ ...prev, maxSets: 5, pointsPerSet: 25, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' }));
  const setPresetBeach = () => setLocalConfig(prev => ({ ...prev, maxSets: 3, pointsPerSet: 21, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' }));
  const setPresetSegunda = () => setLocalConfig(prev => ({ ...prev, maxSets: 1, pointsPerSet: 15, hasTieBreak: false, tieBreakPoints: 15, deuceType: 'sudden_death_3pt' }));

  const isFIVB = localConfig.maxSets === 5 && localConfig.pointsPerSet === 25 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isBeach = localConfig.maxSets === 3 && localConfig.pointsPerSet === 21 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isSegunda = localConfig.maxSets === 1 && localConfig.pointsPerSet === 15 && localConfig.hasTieBreak === false && localConfig.deuceType === 'sudden_death_3pt';

  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2";
  const sectionClass = "p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-inner";

  const PresetButton = ({ active, onClick, icon: Icon, label, sub, colorClass, borderClass, bgActive, textActive }: any) => (
    <button 
        onClick={onClick} 
        className={`relative py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 text-center group
            ${active 
                ? `${bgActive} ${borderClass} ${textActive} shadow-lg shadow-${colorClass}/20 ring-1 ring-${colorClass}/50` 
                : `bg-white dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 hover:text-slate-700 dark:hover:text-slate-200`}`}
    >
        {active && <div className={`absolute top-2 right-2 p-0.5 rounded-full ${textActive} bg-white/10`}><Check size={10} strokeWidth={3} /></div>}
        <Icon size={20} className={`mb-0.5 transition-colors ${active ? textActive : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-normal opacity-70`}>{sub}</span>
    </button>
  );

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
      <div className="space-y-6 pb-2">
        
        {/* Appearance Section */}
        <div className={sectionClass}>
          <label className={labelClass}><Sun size={12} /> {t('settings.appearance.title')}</label>
          <div className="space-y-5">
              
              {/* Theme Toggle */}
              <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-1 rounded-xl border border-black/5 dark:border-white/5">
                  {(['light', 'dark'] as const).map(th => (
                      <button key={th} onClick={() => setTheme(th)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${theme === th ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                          {th === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                          {t(`settings.appearance.themes.${th}`)}
                      </button>
                  ))}
              </div>

              {/* Language Selector - Grid Layout */}
              <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    <Globe size={10} /> {t('settings.appearance.language')}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((lang) => {
                      const isActive = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`
                            relative overflow-hidden flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300
                            ${isActive 
                              ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' 
                              : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10'
                            }
                          `}
                        >
                          <span className="text-xl mb-1 filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110">{lang.flag}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {lang.label}
                          </span>
                          
                          {/* Active Indicator Dot */}
                          {isActive && (
                            <motion.div 
                              layoutId="active-lang"
                              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_currentColor]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
              </div>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <PresetButton active={isFIVB} onClick={setPresetFIVB} icon={Trophy} label={t('presets.fivb.label')} sub={t('presets.fivb.sub')} colorClass="indigo-500" borderClass="border-indigo-500" bgActive="bg-indigo-500/20" textActive="text-indigo-600 dark:text-indigo-300"/>
           <PresetButton active={isBeach} onClick={setPresetBeach} icon={Sun} label={t('presets.beach.label')} sub={t('presets.beach.sub')} colorClass="orange-500" borderClass="border-orange-500" bgActive="bg-orange-500/20" textActive="text-orange-600 dark:text-orange-300"/>
           <PresetButton active={isSegunda} onClick={setPresetSegunda} icon={Zap} label={t('presets.custom.label')} sub={t('presets.custom.sub')} colorClass="emerald-500" borderClass="border-emerald-500" bgActive="bg-emerald-500/20" textActive="text-emerald-600 dark:text-emerald-300"/>
        </div>

        {/* Rules Section */}
        <div className={sectionClass}>
          <label className={labelClass}><Menu size={12} /> {t('settings.rules.title')}</label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('settings.rules.setsToPlay')}</span>
                <div className="flex bg-black/5 dark:bg-black/20 rounded-lg p-1 gap-1 border border-black/5 dark:border-white/5">
                {[1, 3, 5].map(val => (
                    <button key={val} onClick={() => setLocalConfig(prev => ({ ...prev, maxSets: val as any }))}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.maxSets === val ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                        {val}
                    </button>
                ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('settings.rules.pointsPerSet')}</span>
                <div className="flex bg-black/5 dark:bg-black/20 rounded-lg p-1 gap-1 border border-black/5 dark:border-white/5">
                {[15, 21, 25].map(val => (
                    <button key={val} onClick={() => setLocalConfig(prev => ({ ...prev, pointsPerSet: val as any }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.pointsPerSet === val ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                        {val}
                    </button>
                ))}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('settings.rules.tieBreak')}</span>
                <div className="flex items-center gap-3">
                    {localConfig.hasTieBreak && (
                        <select value={localConfig.tieBreakPoints} onChange={e => setLocalConfig(prev => ({ ...prev, tieBreakPoints: Number(e.target.value) }))}
                            className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 appearance-none font-bold">
                            <option className="bg-white dark:bg-slate-900" value={15}>{t('settings.rules.tieBreakTo15')}</option>
                            <option className="bg-white dark:bg-slate-900" value={25}>{t('settings.rules.tieBreakTo25')}</option>
                        </select>
                    )}
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, hasTieBreak: !prev.hasTieBreak }))}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${localConfig.hasTieBreak ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${localConfig.hasTieBreak ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('settings.rules.deuceLogic')}</span>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'standard' }))}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold text-left transition-all relative ${localConfig.deuceType === 'standard' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                        {t('settings.rules.deuceStandard')}
                        {localConfig.deuceType === 'standard' && <div className="absolute top-2 right-2 text-indigo-500"><Check size={12} /></div>}
                    </button>
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'sudden_death_3pt' }))}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold text-left transition-all relative ${localConfig.deuceType === 'sudden_death_3pt' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                        {t('settings.rules.deuceSuddenDeath')}
                        {localConfig.deuceType === 'sudden_death_3pt' && <div className="absolute top-2 right-2 text-indigo-500"><Check size={12} /></div>}
                    </button>
                </div>
            </div>
          </div>
        </div>
        
        {isStandalone === false && (
             <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between gap-4">
                 <div className="flex-1">
                     <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Smartphone size={12} /> {t('install.title')}
                     </span>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{t('install.description')}</p>
                 </div>
                 
                 {canInstall ? (
                    <Button onClick={onInstall} size="sm" className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/40">
                        <Download size={14} /> {t('install.installNow')}
                    </Button>
                 ) : isIOS ? (
                    <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            {t('install.ios.tap')} <Share size={10} /> {t('install.ios.then')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">"{t('install.ios.addToHome')}"</span>
                    </div>
                 ) : (
                    <div className="flex flex-col items-end text-right">
                         <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            {t('install.android.tap')} <Menu size={10} /> {t('install.android.then')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">"{t('install.android.installApp')}"</span>
                    </div>
                 )}
             </div>
        )}

        {requiresReset && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-2.5 bg-rose-500/20 rounded-full text-rose-500 shrink-0">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-0.5">{t('settings.warningTitle')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">{t('settings.warningMessage')}</p>
                </div>
            </div>
        )}

        <Button onClick={handleSave} className={`w-full mt-2 ${requiresReset ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 shadow-rose-500/20' : ''}`} size="lg">
            {requiresReset ? t('settings.applyAndReset') : t('settings.applyChanges')}
        </Button>
      </div>
    </Modal>
  );
};
