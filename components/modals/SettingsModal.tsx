import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GameConfig } from '../../types';
import { Check, Trophy, Sun, Zap, Download, Share, Smartphone, Menu } from 'lucide-react';

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

  const setPresetFIVB = () => {
    setLocalConfig({
      maxSets: 5,
      pointsPerSet: 25,
      hasTieBreak: true,
      tieBreakPoints: 15,
      deuceType: 'standard'
    });
  };

  const setPresetBeach = () => {
    setLocalConfig({
      maxSets: 3,
      pointsPerSet: 21,
      hasTieBreak: true,
      tieBreakPoints: 15,
      deuceType: 'standard'
    });
  };

  const setPresetSegunda = () => {
    setLocalConfig({
      maxSets: 1,
      pointsPerSet: 15,
      hasTieBreak: false,
      tieBreakPoints: 15,
      deuceType: 'sudden_death_3pt'
    });
  };

  // Logic to check active preset
  const isFIVB = localConfig.maxSets === 5 && localConfig.pointsPerSet === 25 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isBeach = localConfig.maxSets === 3 && localConfig.pointsPerSet === 21 && localConfig.hasTieBreak === true && localConfig.deuceType === 'standard';
  const isSegunda = localConfig.maxSets === 1 && localConfig.pointsPerSet === 15 && localConfig.hasTieBreak === false && localConfig.deuceType === 'sudden_death_3pt';

  // Glass Input Styles
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all font-inter";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block";
  const sectionClass = "p-4 rounded-2xl bg-white/[0.02] border border-white/5";

  const PresetButton = ({ 
    active, onClick, icon: Icon, label, sub, colorClass, borderClass, bgActive, textActive 
  }: any) => (
    <button 
        onClick={onClick} 
        className={`
            relative py-3 px-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 text-center group
            ${active 
                ? `${bgActive} ${borderClass} ${textActive} shadow-lg shadow-${colorClass}/20 ring-1 ring-${colorClass}/50` 
                : `bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200`}
        `}
    >
        {active && <div className={`absolute top-2 right-2 p-0.5 rounded-full ${textActive} bg-white/10`}><Check size={10} strokeWidth={3} /></div>}
        <Icon size={20} className={`mb-0.5 transition-colors ${active ? textActive : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-normal opacity-70`}>{sub}</span>
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuration">
      <div className="space-y-6 pb-2">
        
        {/* Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <PresetButton 
             active={isFIVB} 
             onClick={setPresetFIVB}
             icon={Trophy}
             label="Indoor (FIVB)"
             sub="5 Sets • 25 Pts"
             colorClass="indigo-500"
             borderClass="border-indigo-500"
             bgActive="bg-indigo-500/20"
             textActive="text-indigo-300"
           />
           <PresetButton 
             active={isBeach} 
             onClick={setPresetBeach}
             icon={Sun}
             label="Beach Volley"
             sub="3 Sets • 21 Pts"
             colorClass="orange-500"
             borderClass="border-orange-500"
             bgActive="bg-orange-500/20"
             textActive="text-orange-300"
           />
           <PresetButton 
             active={isSegunda} 
             onClick={setPresetSegunda}
             icon={Zap}
             label="Vôlei de Segunda"
             sub="1 Set • 15 Pts • Sudden Death"
             colorClass="emerald-500"
             borderClass="border-emerald-500"
             bgActive="bg-emerald-500/20"
             textActive="text-emerald-300"
           />
        </div>

        {/* Team Names */}
        <div className={sectionClass}>
           <label className={labelClass}>Team Names</label>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase ml-1">Home (A)</span>
                <input 
                    type="text" 
                    value={names.nameA}
                    onChange={e => setNames(prev => ({ ...prev, nameA: e.target.value }))}
                    className={`${inputClass} focus:border-indigo-500/50`}
                    placeholder="Team A"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-rose-400 font-bold uppercase ml-1">Guest (B)</span>
                <input 
                    type="text" 
                    value={names.nameB}
                    onChange={e => setNames(prev => ({ ...prev, nameB: e.target.value }))}
                    className={`${inputClass} focus:border-rose-500/50`}
                    placeholder="Team B"
                />
              </div>
           </div>
        </div>

        {/* Rules */}
        <div className={sectionClass}>
          <label className={labelClass}>Match Rules</label>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Sets to Play</span>
                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                {[1, 3, 5].map(val => (
                    <button 
                        key={val}
                        onClick={() => setLocalConfig(prev => ({ ...prev, maxSets: val as any }))}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.maxSets === val ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        {val}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Points per Set</span>
                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                {[15, 21, 25].map(val => (
                    <button 
                        key={val}
                        onClick={() => setLocalConfig(prev => ({ ...prev, pointsPerSet: val as any }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${localConfig.pointsPerSet === val ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        {val}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-slate-300 text-sm">Tie Break (Final Set)</span>
                <div className="flex items-center gap-3">
                    {localConfig.hasTieBreak && (
                        <select 
                            value={localConfig.tieBreakPoints}
                            onChange={e => setLocalConfig(prev => ({ ...prev, tieBreakPoints: Number(e.target.value) }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50"
                        >
                            <option className="bg-slate-900" value={15}>to 15 pts</option>
                            <option className="bg-slate-900" value={25}>to 25 pts</option>
                        </select>
                    )}
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, hasTieBreak: !prev.hasTieBreak }))}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${localConfig.hasTieBreak ? 'bg-indigo-500' : 'bg-white/10'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${localConfig.hasTieBreak ? 'translate-x-4' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <span className="text-slate-300 text-sm">Deuce Logic</span>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'standard' }))}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all relative ${localConfig.deuceType === 'standard' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-transparent border-white/5 text-slate-500'}`}
                    >
                        Advantage of 2
                        {localConfig.deuceType === 'standard' && <Check size={14} className="absolute right-2 top-2.5" />}
                    </button>
                    <button 
                        onClick={() => setLocalConfig(prev => ({ ...prev, deuceType: 'sudden_death_3pt' }))}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all relative ${localConfig.deuceType === 'sudden_death_3pt' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-transparent border-white/5 text-slate-500'}`}
                    >
                        Sudden Death (3pts)
                        {localConfig.deuceType === 'sudden_death_3pt' && <Check size={14} className="absolute right-2 top-2.5" />}
                    </button>
                </div>
            </div>
          </div>
        </div>
        
        {/* INSTALL APP SECTION - Shows if NOT standalone (installed) */}
        {isStandalone === false && (
             <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between gap-4">
                 <div className="flex-1">
                     <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Smartphone size={12} /> Install App
                     </span>
                     <p className="text-xs text-slate-400">Add to home screen for full experience.</p>
                 </div>
                 
                 {canInstall ? (
                    <Button onClick={onInstall} size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/40">
                        <Download size={14} /> Install Now
                    </Button>
                 ) : isIOS ? (
                    <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            Tap <Share size={10} /> then
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">"Add to Home Screen"</span>
                    </div>
                 ) : (
                    /* Fallback for Android/Chrome when event hasn't fired yet */
                    <div className="flex flex-col items-end text-right">
                         <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            Tap <Menu size={10} /> then
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">"Install App"</span>
                    </div>
                 )}
             </div>
        )}

        <Button onClick={handleSave} className="w-full" size="lg">
            Apply Changes
        </Button>

      </div>
    </Modal>
  );
};
