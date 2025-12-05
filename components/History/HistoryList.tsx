

import React, { useState, useMemo, useRef } from 'react';
import { useHistoryStore, Match } from '../../stores/historyStore';
import { useTranslation } from '../../contexts/LanguageContext';
import { downloadJSON, parseJSONFile } from '../../services/io';
import { 
  Trophy, Search, Clock, Trash2, ChevronDown, ChevronUp, 
  Download, Upload, Filter, AlertCircle, BarChart2, Crown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { MatchDetail } from './MatchDetail';

// --- SUB-COMPONENTS ---

const HistoryCard: React.FC<{ 
    match: Match; 
    onDelete: (id: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
    onAnalyze: () => void;
}> = ({ match, onDelete, isExpanded, onToggle, onAnalyze }) => {
    const { t } = useTranslation();
    const date = new Date(match.timestamp).toLocaleDateString();
    
    // Format duration
    const h = Math.floor(match.durationSeconds / 3600);
    const m = Math.floor((match.durationSeconds % 3600) / 60);
    const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

    const borderColor = match.winner === 'A' ? 'border-indigo-500/20' : 'border-rose-500/20';
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                rounded-2xl border bg-white/50 dark:bg-white/5 backdrop-blur-md overflow-hidden
                ${borderColor} shadow-sm transition-all hover:bg-white/70 dark:hover:bg-white/10
            `}
        >
            {/* Header */}
            <div 
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={onToggle}
            >
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
                    {/* Team A */}
                    <div className={`flex items-center justify-end gap-1.5 min-w-0 ${match.winner === 'A' ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                        <div className="truncate text-right">{match.teamAName}</div>
                        {match.winner === 'A' && <Crown size={14} className="text-indigo-500 flex-shrink-0" fill="currentColor" />}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-black/30 rounded-lg border border-black/5 dark:border-white/5 font-mono font-bold text-lg">
                        <span className={match.winner === 'A' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{match.setsA}</span>
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                        <span className={match.winner === 'B' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>{match.setsB}</span>
                    </div>

                    {/* Team B */}
                    <div className={`flex items-center justify-start gap-1.5 min-w-0 ${match.winner === 'B' ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                        {match.winner === 'B' && <Crown size={14} className="text-rose-500 flex-shrink-0" fill="currentColor" />}
                        <div className="truncate text-left">{match.teamBName}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-4 border-l border-black/10 dark:border-white/10 ml-4">
                     <div className="flex flex-col items-end text-[10px] text-slate-400 font-medium uppercase tracking-wider min-w-[50px]">
                         <span>{date}</span>
                         <span className="flex items-center gap-1"><Clock size={10} /> {durationStr}</span>
                     </div>
                     {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Details (Expanded) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20"
                    >
                        <div className="p-4 space-y-4">
                            {/* Sets History */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-center">
                                {match.sets.map((set, idx) => (
                                    <div key={idx} className="flex flex-col items-center min-w-[3rem]">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">{t('history.setLabel', {setNumber: set.setNumber})}</span>
                                        <div className={`
                                            px-2 py-1 rounded text-xs font-bold border
                                            ${set.winner === 'A' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/20' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/20'}
                                        `}>
                                            {set.scoreA}-{set.scoreB}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3 pt-2">
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-500"
                                    size="sm"
                                >
                                    <BarChart2 size={14} /> Analysis & Replay
                                </Button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(match.id); }}
                                    className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-colors"
                                    title={t('historyList.delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

export const HistoryList: React.FC = () => {
    const { matches, deleteMatch, importJSON, exportJSON } = useHistoryStore();
    const { t } = useTranslation();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [winnerFilter, setWinnerFilter] = useState<'all' | 'A' | 'B'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null); // Navigation state
    const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter Logic
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const matchesSearch = 
                m.teamAName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                m.teamBName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesWinner = 
                winnerFilter === 'all' || 
                m.winner === winnerFilter;

            return matchesSearch && matchesWinner;
        });
    }, [matches, searchTerm, winnerFilter]);

    // Handlers
    const handleExport = () => {
        const json = JSON.parse(exportJSON());
        const dateStr = new Date().toISOString().split('T')[0];
        downloadJSON(`volleyscore_history_${dateStr}`, json);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await parseJSONFile(file);
            // Convert array to string as expected by store
            const result = importJSON(JSON.stringify(content), { merge: true });
            
            if (result.success) {
                setImportMsg({ type: 'success', text: t('historyList.importSuccess') });
            } else {
                setImportMsg({ type: 'error', text: result.errors?.[0] || t('historyList.importError') });
            }
        } catch (err) {
            setImportMsg({ type: 'error', text: t('historyList.importError') });
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Clear message after 3s
        setTimeout(() => setImportMsg(null), 3000);
    };

    // --- NAVIGATION VIEW SWITCH ---

    if (selectedMatch) {
        return <MatchDetail match={selectedMatch} onBack={() => setSelectedMatch(null)} />;
    }

    return (
        <div className="flex flex-col h-full min-h-[50vh]">
            
            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
            />

            {/* Controls Bar */}
            <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-slate-100/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md z-20 py-2 border-b border-black/5 dark:border-white/5">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('historyList.searchPlaceholder')}
                            className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={winnerFilter}
                            onChange={(e) => setWinnerFilter(e.target.value as any)}
                            className="appearance-none bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-full"
                        >
                            <option value="all">{t('historyList.filterAll')}</option>
                            <option value="A">{t('historyList.filterWinnerA')}</option>
                            <option value="B">{t('historyList.filterWinnerB')}</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleExport} size="sm" variant="secondary" className="flex-1 text-xs">
                        <Download size={14} /> {t('historyList.export')}
                    </Button>
                    <Button onClick={handleImportClick} size="sm" variant="secondary" className="flex-1 text-xs">
                        <Upload size={14} /> {t('historyList.import')}
                    </Button>
                </div>

                {importMsg && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-2 ${importMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}
                    >
                        <AlertCircle size={14} /> {importMsg.text}
                    </motion.div>
                )}
            </div>

            {/* List */}
            <div className="space-y-3 flex-1 overflow-y-auto pb-8 min-h-0">
                {filteredMatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="p-4 bg-slate-200 dark:bg-white/5 rounded-full mb-3">
                            <Trophy size={32} strokeWidth={1.5} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">{t('historyList.empty')}</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {filteredMatches.map(match => (
                            <HistoryCard 
                                key={match.id} 
                                match={match} 
                                onDelete={deleteMatch}
                                isExpanded={expandedId === match.id}
                                onToggle={() => setExpandedId(expandedId === match.id ? null : match.id)}
                                onAnalyze={() => setSelectedMatch(match)}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};