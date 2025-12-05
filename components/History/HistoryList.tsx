
import React, { useState, useMemo, useRef } from 'react';
import { useHistoryStore, Match } from '../../stores/historyStore';
import { useTranslation } from '../../contexts/LanguageContext';
import { downloadJSON, parseJSONFile } from '../../services/io';
import { 
  Search, Clock, Trash2, ChevronDown, ChevronUp, 
  Download, Upload, Filter, AlertCircle, BarChart2, Crown, Calendar
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
    const date = new Date(match.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const time = new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Format duration
    const h = Math.floor(match.durationSeconds / 3600);
    const m = Math.floor((match.durationSeconds % 3600) / 60);
    const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

    const isWinnerA = match.winner === 'A';
    const isWinnerB = match.winner === 'B';

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative rounded-3xl bg-white dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
            {/* Subtle Gradient Wash for Winner */}
            <div className={`
                absolute inset-0 opacity-[0.03] dark:opacity-[0.08] pointer-events-none transition-colors duration-500
                ${isWinnerA ? 'bg-gradient-to-r from-indigo-500 via-transparent to-transparent' : ''}
                ${isWinnerB ? 'bg-gradient-to-l from-rose-500 via-transparent to-transparent' : ''}
            `} />

            {/* Main Content Area */}
            <div 
                className="relative z-10 p-4 sm:p-5 cursor-pointer flex flex-col gap-4"
                onClick={onToggle}
            >
                {/* Top Row: Meta Data */}
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                     <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span>{time}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <Clock size={12} /> {durationStr}
                     </div>
                </div>

                {/* Matchup Row - Highly Responsive */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                    
                    {/* Team A - Flexible Width, Right Align */}
                    <div className={`flex-1 min-w-0 flex items-center justify-end gap-2 text-right ${isWinnerA ? 'opacity-100' : 'opacity-60 grayscale-[0.5]'}`}>
                        <span className={`text-sm sm:text-base leading-tight break-words line-clamp-2 ${isWinnerA ? 'font-black text-indigo-600 dark:text-indigo-400' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                            {match.teamAName}
                        </span>
                        {isWinnerA && <Crown size={14} className="text-indigo-500 flex-shrink-0" fill="currentColor" />}
                    </div>

                    {/* Score Box - Fixed Center */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-1 bg-slate-100/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 min-w-[60px] sm:min-w-[80px]">
                        <div className="flex items-center gap-1 font-inter text-lg sm:text-xl font-black tabular-nums leading-none">
                            <span className={isWinnerA ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{match.setsA}</span>
                            <span className="text-slate-300 dark:text-slate-600 text-sm">:</span>
                            <span className={isWinnerB ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>{match.setsB}</span>
                        </div>
                    </div>

                    {/* Team B - Flexible Width, Left Align */}
                    <div className={`flex-1 min-w-0 flex items-center justify-start gap-2 text-left ${isWinnerB ? 'opacity-100' : 'opacity-60 grayscale-[0.5]'}`}>
                        {isWinnerB && <Crown size={14} className="text-rose-500 flex-shrink-0" fill="currentColor" />}
                        <span className={`text-sm sm:text-base leading-tight break-words line-clamp-2 ${isWinnerB ? 'font-black text-rose-600 dark:text-rose-400' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                            {match.teamBName}
                        </span>
                    </div>

                </div>

                {/* Bottom Row: Expand Indicator (Center) */}
                <div className="flex justify-center text-slate-300 dark:text-slate-700 -mt-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-10 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-black/10"
                    >
                        <div className="p-4 sm:p-5 flex flex-col items-center space-y-5">
                            
                            {/* Sets History Strip */}
                            <div className="w-full overflow-x-auto pb-1 no-scrollbar flex justify-center">
                                <div className="flex gap-2">
                                    {match.sets.map((set, idx) => (
                                        <div key={idx} className="flex flex-col items-center flex-shrink-0">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">{t('history.setLabel', {setNumber: set.setNumber})}</span>
                                            <div className={`
                                                min-w-[3rem] text-center px-2 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm
                                                ${set.winner === 'A' 
                                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20' 
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20'}
                                            `}>
                                                {set.scoreA}-{set.scoreB}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                                    className="flex-1 sm:flex-none bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                    size="sm"
                                >
                                    <BarChart2 size={14} /> Analysis
                                </Button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(match.id); }}
                                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
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
            <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-slate-100/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl z-20 py-2 border-b border-black/5 dark:border-white/5">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('historyList.searchPlaceholder')}
                            className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={winnerFilter}
                            onChange={(e) => setWinnerFilter(e.target.value as any)}
                            className="appearance-none bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-full transition-all"
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
            <div className="space-y-4 flex-1 overflow-y-auto pb-8 min-h-0 px-1 custom-scrollbar">
                {filteredMatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                        <div className="p-4 bg-slate-200 dark:bg-white/5 rounded-full mb-3">
                            <Clock size={32} strokeWidth={1.5} className="opacity-50" />
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
