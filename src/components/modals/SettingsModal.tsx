import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameConfig } from '../../types';
import { Check, Trophy, Sun, Zap, Download, Share, Smartphone, Menu, Moon, SunDim, Languages } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  teamAName: string;
  teamBName: string;
  onSave: (config: GameConfig, names: { nameA: string, nameB: string }) => void;
  onInstall?: () => void;
  canInstall?: boolean;
  isIOS?: boolean;
  isStandalone?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, config, teamAName, teamBName, onSave, 
    onInstall, canInstall, isIOS, isStandalone 
}) => {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const [names, setNames] = useState({ nameA: teamAName, nameB: teamBName });
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setNames({ nameA: teamAName, nameB: teamBName });
    }
  }, [isOpen, config, teamAName, teamBName]);

  const handleSave = () => {
    onSave(localConfig, names);
    onClose();
  };

  const setPresetFIVB = () => setLocalConfig({ maxSets: 5, pointsPerSet: 25, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' });
  const setPresetBeach = () => setLocalConfig({ maxSets: 3, pointsPerSet: 21, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' });
  const setPresetSegunda = () => setLocalConfig({ maxSets: 1, pointsPerSet: 15, hasTieBreak: false, tieBreakPoints: 15, deuceType: 'sudden_death_3pt' });

  const isFIVB = localConfig.maxSets === 5 && localConfig.pointsPerSet === 25 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isBeach = localConfig.maxSets === 3 && localConfig.pointsPerSet === 21 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isSegunda = localConfig.maxSets === 1 && localConfig.pointsPerSet === 15 && localConfig.hasTieBreak === false && localConfig.deuceType === 'sudden_death_3pt';

  const inputClass = "w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-slate-800 dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all font-inter";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2 block";
  const sectionClass = "p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5";

  const PresetButton = ({ active, onClick, icon: Icon, label, sub, colorClass, borderClass, bgActive, textActive }: any) => (
    <button 
        onClick={onClick} 
        className={`relative py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 text-center group
            ${active 
                ? `${bgActive} ${borderClass} ${textActive} shadow-lg shadow-${colorClass}/20 ring-1 ring-${colorClass}/50` 
                : `bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 hover:text-slate-700 dark:hover:text-slate-200`}`}
    >
        {active && <div className={`absolute top-2 right-2 p-0.5 rounded-full ${textActive} bg-white/10`}><Check size={10} strokeWidth={3} /></div>}
        <Icon size={20} className={`mb-0.5 transition-colors ${active ? textActive : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'}`} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-normal opacity-70`}>{sub}</span>
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
      <div className="space-y-6 pb-2">
        
        <div className={sectionClass}>
          <label className={labelClass}>{t('settings.appearance.title')}</label>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.appearance.theme')}</span>
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                      {(['light', 'dark', 'system'] as const).map(th => (
                          <button key={th} onClick={() => setTheme(th)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${theme === th ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                          >
                              {th === 'light' && <Sun size={12} />}
                              {th === 'dark' && <Moon size={12} />}
                              {th === 'system' && <SunDim size={12} />}
                              {t(`settings.appearance.themes.${th}`)}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.appearance.language')}</span>
                  <div className="relative">
                    <select value={language} onChange={(e) => setLanguage(e.target.value as any)}
                        className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-8 pr-4 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 appearance-none">
                        <option className="bg-white dark:bg-slate-900" value="en">{t('languages.en')}</option>
                        <option className="bg-white dark:bg-slate-900" value="pt">{t('languages.pt')}</option>
                        <option className="bg-white dark:bg-slate-900" value="es">{t('languages.es')}</option>
                    </select>
                    <Languages size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <PresetButton active={isFIVB} onClick={setPresetFIVB} icon={Trophy} label={t('presets.fivb.label')} sub={t('presets.fivb.sub')} colorClass="indigo-500" borderClass="border-indigo-500" bgActive="bg-indigo-500/20" textActive="text-indigo-600 dark:text-indigo-300"/>
           <PresetButton active={isBeach} onClick={setPresetBeach} icon={Sun} label={t('presets.beach.label')} sub={t('presets.beach.sub')} colorClass="orange-500" borderClass="border-orange-500" bgActive="bg-orange-500/20" textActive="text-orange-600 dark:text-orange-300"/>
           <PresetButton active={isSegunda} onClick={setPresetSegunda} icon={Zap} label={t('presets.custom.label')} sub={t('presets.custom.sub')} colorClass="emerald-500" borderClass="border-emerald-500" bgActive="bg-emerald-500/20" textActive="text-emerald-600 dark:text-emerald-300"/>
        </div>

        <div className={sectionClass}>
           <label className={labelClass}>{t('settings.teamNames.title')}</label>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase ml-1">{t('settings.teamNames.home')}</span>
                <input type="text" value={names.nameA} onChange={e => setNames(prev => ({ ...prev, nameA: e.target.value }))} className={`${inputClass} focus:border-indigo-500/50`} placeholder={t('settings.teamNames.placeholderA')}/>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase ml-1">{t('settings.teamNames.guest')}</span>
                <input type="text" value={names.nameB} onChange={e => setNames(prev => ({ ...prev, nameB: e.target.value }))} className={`${inputClass} focus:border-rose-500/50`} placeholder={t('settings.teamNames.placeholderB')}/>
              </div>
           </div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>{t('settings.rules.title')}</label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.rules.setsToPlay')}</span>
                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                {[1, 3, 5].map(val => (
                    <button key={val} onClick={() => setLocalConfig(prev => ({ ...prev, maxSets: val as any }))}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.maxSets === val ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                        {val}
                    </button>
                ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.rules.pointsPerSet')}</span>
                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                {[15, 21, 25].map(val => (
                    <button key={val} onClick={() => setLocalConfig(prev => ({ ...prev, pointsPerSet: val as any }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.pointsPerSet === val ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                        {val}
                    </button>
                ))}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.rules.tieBreak')}</span>
                <div className="flex items-center gap-3">
                    {localConfig.hasTieBreak && (
                        <select value={localConfig.tieBreakPoints} onChange={e => setLocalConfig(prev => ({ ...prev, tieBreakPoints: Number(e.target.value) }))}
                            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500/50">
                            <option className="bg-white dark:bg-slate-900" value={15}>{t('settings.rules.tieBreakTo15')}</option>
                            <option className="bg-white dark:bg-slate-900" value={25}>{t('settings.rules.tieBreakTo25')}</option>
                        </select>
                    )}
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, hasTieBreak: !prev.hasTieBreak }))}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${localConfig.hasTieBreak ? 'bg-indigo-500' : 'bg-black/10 dark:bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${localConfig.hasTieBreak ? 'translate-x-4' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-slate-700 dark:text-slate-300 text-sm">{t('settings.rules.deuceLogic')}</span>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'standard' }))}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all relative ${localConfig.deuceType === 'standard' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300' : 'bg-transparent border-black/5 dark:border-white/5 text-slate-500'}`}>
                        {t('settings.rules.deuceStandard')}
                        {localConfig.deuceType === 'standard' && <Check size={14} className="absolute right-2 top-2.5" />}
                    </button>
                    <button onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'sudden_death_3pt' }))}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all relative ${localConfig.deuceType === 'sudden_death_3pt' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-300' : 'bg-transparent border-black/5 dark:border-white/5 text-slate-500'}`}>
                        {t('settings.rules.deuceSuddenDeath')}
                        {localConfig.deuceType === 'sudden_death_3pt' && <Check size={14} className="absolute right-2 top-2.5" />}
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

        <Button onClick={handleSave} className="w-full" size="lg">
            {t('settings.applyChanges')}
        </Button>
      </div>
    </Modal>
  );
};