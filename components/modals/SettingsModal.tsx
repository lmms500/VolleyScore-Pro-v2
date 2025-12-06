import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameConfig } from '../../types';
import { Check, Trophy, Sun, Zap, Download, Moon, AlertTriangle, Volume2, Umbrella, Activity, Globe, Scale, ToggleLeft, ToggleRight, RefreshCw, CloudDownload, Smartphone, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useServiceWorker } from '../../hooks/useServiceWorker';

// Defined constant to avoid importing package.json which causes build/runtime issues in some environments
const APP_VERSION = '2.0.5';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onSave: (config: GameConfig, reset: boolean) => void;
  // Deprecated props are handled internally by hook now, but kept for signature compat if needed
  onInstall?: () => void;
  canInstall?: boolean;
  isIOS?: boolean;
  isStandalone?: boolean;
  isMatchActive: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, config, onSave, isMatchActive
}) => {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Service Worker Hook
  const { 
      needRefresh, updateServiceWorker, checkForUpdates: checkSW, isChecking: isSWChecking,
      isInstallable, promptInstall, isStandalone
  } = useServiceWorker();

  // Smart Version Check State
  const [remoteCheckStatus, setRemoteCheckStatus] = useState<'idle' | 'checking' | 'latest' | 'available' | 'error'>('idle');
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      // Reset check status on open if not already needing refresh
      if (!needRefresh) {
          setRemoteCheckStatus('idle');
      }
    }
  }, [isOpen, config, needRefresh]);

  // --- SMART CHECK LOGIC ---
  const handleSmartCheck = async () => {
      // 1. Set UI to checking
      setRemoteCheckStatus('checking');
      
      // 2. Trigger SW Check (Standard PWA)
      checkSW();

      try {
          // 3. Manual Fetch of remote package.json to compare versions explicitly
          // Cache-busting with timestamp to ensure fresh read
          const response = await fetch(`/package.json?t=${Date.now()}`);
          
          if (response.ok) {
              const remotePkg = await response.json();
              setRemoteVersion(remotePkg.version);
              
              // Artificial delay for UX (spinner feel)
              await new Promise(r => setTimeout(r, 800));

              if (remotePkg.version !== APP_VERSION) {
                  setRemoteCheckStatus('available');
              } else {
                  setRemoteCheckStatus('latest');
              }
          } else {
              setRemoteCheckStatus('error');
          }
      } catch (e) {
          console.error("Remote version check failed", e);
          setRemoteCheckStatus('error');
      }
  };

  // Combine SW loading state with our manual check state
  const isActuallyChecking = isSWChecking || remoteCheckStatus === 'checking';
  const showUpdateAvailable = needRefresh || remoteCheckStatus === 'available';

  // --- SMART RESET LOGIC ---
  const structuralKeys: (keyof GameConfig)[] = ['maxSets', 'pointsPerSet', 'hasTieBreak', 'tieBreakPoints', 'deuceType', 'mode'];
  const requiresReset = isMatchActive && structuralKeys.some(key => localConfig[key] !== config[key]);

  const handleSave = () => {
    onSave(localConfig, requiresReset);
    onClose();
  };

  const setPresetFIVB = () => setLocalConfig(prev => ({ ...prev, mode: 'indoor', maxSets: 5, pointsPerSet: 25, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' }));
  const setPresetBeach = () => setLocalConfig(prev => ({ ...prev, mode: 'beach', maxSets: 3, pointsPerSet: 21, hasTieBreak: true, tieBreakPoints: 15, deuceType: 'standard' }));
  const setPresetSegunda = () => setLocalConfig(prev => ({ ...prev, mode: 'indoor', maxSets: 1, pointsPerSet: 15, hasTieBreak: false, tieBreakPoints: 15, deuceType: 'sudden_death_3pt' }));

  const isFIVB = localConfig.mode === 'indoor' && localConfig.maxSets === 5 && localConfig.pointsPerSet === 25;
  const isBeach = localConfig.mode === 'beach' && localConfig.maxSets === 3 && localConfig.pointsPerSet === 21;
  const isSegunda = localConfig.deuceType === 'sudden_death_3pt';

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
        
        {/* --- SYSTEM & UPDATES SECTION (New) --- */}
        <div className={sectionClass}>
            <label className={labelClass}>System</label>
            <div className="space-y-3">
                {/* Install Button (Only if installable) */}
                {isInstallable && !isStandalone && (
                    <Button 
                        onClick={promptInstall} 
                        size="md" 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 mb-3"
                    >
                        <Smartphone size={16} /> {t('install.installNow')}
                    </Button>
                )}

                {/* Update Checker */}
                <div className="flex items-center justify-between bg-white dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <div className={`
                            p-2 rounded-full transition-all
                            ${showUpdateAvailable ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}
                        `}>
                            {isActuallyChecking ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : showUpdateAvailable ? (
                                <CloudDownload size={18} />
                            ) : (
                                <RefreshCw size={18} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-wide opacity-50">App Version</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-sm font-black tracking-tight font-mono text-slate-700 dark:text-slate-200">v{APP_VERSION}</span>
                                {showUpdateAvailable && remoteVersion && (
                                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                        <ArrowRight size={10} className="text-slate-400" />
                                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-md font-bold shadow-sm shadow-emerald-500/20">
                                            v{remoteVersion}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Status Text */}
                            <span className={`text-[10px] font-medium mt-0.5 ${showUpdateAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                {isActuallyChecking ? "Checking remote..." : 
                                 showUpdateAvailable ? "Update available!" : 
                                 remoteCheckStatus === 'latest' ? "You are up to date" : 
                                 "Local Installation"}
                            </span>
                        </div>
                    </div>

                    {showUpdateAvailable ? (
                        <Button onClick={updateServiceWorker} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20">
                            Update
                        </Button>
                    ) : (
                        <button 
                            onClick={handleSmartCheck}
                            disabled={isActuallyChecking}
                            className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            {isActuallyChecking ? "..." : "Check"}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* --- PRESETS --- */}
        <div>
            <label className={labelClass}>{t('settings.rules.title')}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <PresetButton active={isFIVB} onClick={setPresetFIVB} icon={Trophy} label={t('presets.fivb.label')} sub={t('presets.fivb.sub')} colorClass="indigo-500" borderClass="border-indigo-500" bgActive="bg-indigo-500/20" textActive="text-indigo-600 dark:text-indigo-300"/>
                <PresetButton active={isBeach} onClick={setPresetBeach} icon={Umbrella} label={t('presets.beach.label')} sub={t('presets.beach.sub')} colorClass="orange-500" borderClass="border-orange-500" bgActive="bg-orange-500/20" textActive="text-orange-600 dark:text-orange-300"/>
                <PresetButton active={isSegunda} onClick={setPresetSegunda} icon={Zap} label={t('presets.custom.label')} sub={t('presets.custom.sub')} colorClass="emerald-500" borderClass="border-emerald-500" bgActive="bg-emerald-500/20" textActive="text-emerald-600 dark:text-emerald-300"/>
            </div>
        </div>

        {/* --- APPEARANCE (Theme + Language) --- */}
        <div className={sectionClass}>
          <label className={labelClass}>{t('settings.appearance.title')}</label>
          <div className="space-y-4">
              {/* Theme Selector */}
              <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                      <Sun size={16} className="text-slate-400" />
                      {t('settings.appearance.theme')}
                  </span>
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                      {(['light', 'dark'] as const).map(th => (
                          <button key={th} onClick={() => setTheme(th)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${theme === th ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                          >
                              {th === 'light' ? <Sun size={12} /> : <Moon size={12} />}
                              {t(`settings.appearance.themes.${th}`)}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="border-t border-black/5 dark:border-white/5"></div>

              {/* Language Selector */}
              <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                      <Globe size={16} className="text-slate-400" />
                      {t('settings.appearance.language')}
                  </span>
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                      {(['en', 'pt', 'es'] as const).map(lang => (
                          <button key={lang} onClick={() => setLanguage(lang)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${language === lang ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                          >
                              {lang.toUpperCase()}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
        </div>

        {/* --- DETAILED RULES --- */}
        <div className={sectionClass}>
          <div className="space-y-4">
             
             {/* Mode Selector */}
             <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                    <Trophy size={16} className="text-slate-400" />
                    Game Mode
                </span>
                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, mode: 'indoor' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${localConfig.mode === 'indoor' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        Indoor
                    </button>
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, mode: 'beach' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${localConfig.mode === 'beach' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        Beach
                    </button>
                </div>
             </div>

             <div className="border-t border-black/5 dark:border-white/5"></div>

             {/* Sets to Play */}
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

            {/* Points Per Set */}
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

            {/* Tie Break Logic */}
            <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                 <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                        <Scale size={16} className="text-slate-400" />
                        {t('settings.rules.tieBreak')}
                    </span>
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, hasTieBreak: !prev.hasTieBreak }))}
                        className={`text-2xl transition-colors ${localConfig.hasTieBreak ? 'text-indigo-500' : 'text-slate-400'}`}
                    >
                        {localConfig.hasTieBreak ? <ToggleRight size={32} fill="currentColor" fillOpacity={0.2} /> : <ToggleLeft size={32} />}
                    </button>
                 </div>
                 
                 {localConfig.hasTieBreak && (
                     <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target:</span>
                         <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                             {[15, 25].map(val => (
                                <button key={val} onClick={() => setLocalConfig(prev => ({ ...prev, tieBreakPoints: val as any }))}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${localConfig.tieBreakPoints === val ? 'bg-slate-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {val} pts
                                </button>
                             ))}
                         </div>
                     </div>
                 )}
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

        {/* --- EXTRAS & CONFIGS --- */}
        <div className={sectionClass}>
             <label className={labelClass}>Extras</label>
             <div className="space-y-3">
                 
                 {/* Scout Mode Toggle */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Activity size={16} className="text-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">Player Stats (Scout)</span>
                            <span className="text-[10px] text-slate-400">Track skills & scorers</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setLocalConfig(prev => ({...prev, enablePlayerStats: !prev.enablePlayerStats}))}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${localConfig.enablePlayerStats ? 'bg-cyan-500' : 'bg-black/10 dark:bg-white/10'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${localConfig.enablePlayerStats ? 'translate-x-4' : ''}`} />
                    </button>
                 </div>

                 {/* Sound Toggle */}
                 <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Volume2 size={16} className="text-emerald-500" />
                        <span className="text-sm font-bold">Sound Effects</span>
                    </div>
                    <button 
                        onClick={() => setLocalConfig(prev => ({...prev, enableSound: !prev.enableSound}))}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${localConfig.enableSound ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${localConfig.enableSound ? 'translate-x-4' : ''}`} />
                    </button>
                 </div>

             </div>
        </div>

        {requiresReset && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                    <AlertTriangle size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{t('settings.warningTitle')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">{t('settings.warningMessage')}</p>
                </div>
            </div>
        )}

        <Button onClick={handleSave} className={`w-full ${requiresReset ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 shadow-rose-500/20' : ''}`} size="lg">
            {requiresReset ? t('settings.applyAndReset') : t('settings.applyChanges')}
        </Button>
      </div>
    </Modal>
  );
};