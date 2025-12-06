import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { GameConfig, SetHistory, TeamId, ActionLog, Team } from '../types';

// --- TYPES (Derived/Extended from Core Types) ---

export type MatchSettings = GameConfig;
export type ScoreEvent = ActionLog;

export interface Match {
  id: string;
  date: string;
  timestamp: number;
  durationSeconds: number;
  teamAName: string;
  teamBName: string;
  teamARoster?: Team;
  teamBRoster?: Team;
  setsA: number;
  setsB: number;
  winner: TeamId | null;
  sets: SetHistory[];
  actionLog?: ActionLog[];
  config: MatchSettings;
}

interface HistoryStoreState {
  matches: Match[];
}

interface HistoryStoreActions {
  addMatch: (match: Match) => void;
  deleteMatch: (matchId: string) => void;
  clearHistory: () => void;
  exportJSON: () => string;
  importJSON: (jsonStr: string, options?: { merge: boolean }) => { success: boolean; errors?: string[] };
}

// 1. CAPACITOR-BASED STORAGE ADAPTER
const capacitorFileStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { data } = await Filesystem.readFile({
        path: name,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return data as string;
    } catch (error) {
      console.warn(`[Capacitor Storage] Could not read file ${name}. It may not exist yet.`);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await Filesystem.writeFile({
        path: name,
        data: value,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error(`[Capacitor Storage] Error writing file ${name}:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await Filesystem.deleteFile({
        path: name,
        directory: Directory.Data,
      });
    } catch (error) { 
      console.warn(`[Capacitor Storage] Could not remove file ${name}. It may already be deleted.`);
    }
  },
};

// --- STORE IMPLEMENTATION ---

export const useHistoryStore = create<HistoryStoreState & HistoryStoreActions>()(
  persist(
    (set, get) => ({
      matches: [],

      addMatch: (match) => {
        set((state) => ({
          matches: [match, ...state.matches]
        }));
      },

      deleteMatch: (matchId) => {
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== matchId)
        }));
      },

      clearHistory: () => {
        set({ matches: [] });
      },

      exportJSON: () => {
        const { matches } = get();
        return JSON.stringify(matches, null, 2);
      },

      importJSON: (jsonStr, options = { merge: true }) => {
        try {
          const parsed = JSON.parse(jsonStr);

          if (!Array.isArray(parsed)) {
            return { success: false, errors: ['Invalid format: Root must be an array.'] };
          }

          const validMatches: Match[] = [];
          const errors: string[] = [];

          parsed.forEach((item, index) => {
            if (
              typeof item.id === 'string' &&
              typeof item.timestamp === 'number' &&
              typeof item.teamAName === 'string' &&
              typeof item.teamBName === 'string' &&
              Array.isArray(item.sets)
            ) {
              validMatches.push(item as Match);
            } else {
              errors.push(`Item at index ${index} is missing required Match fields.`);
            }
          });

          if (validMatches.length === 0 && parsed.length > 0) {
            return { success: false, errors: ['No valid match records found in input.', ...errors] };
          }

          set((state) => {
            if (options.merge) {
              const existingIds = new Set(state.matches.map(m => m.id));
              const newUniqueMatches = validMatches.filter(m => !existingIds.has(m.id));
              
              const merged = [...newUniqueMatches, ...state.matches].sort((a, b) => b.timestamp - a.timestamp);
              return { matches: merged };
            } else {
              return { matches: validMatches.sort((a, b) => b.timestamp - a.timestamp) };
            }
          });

          return { 
            success: true, 
            errors: errors.length > 0 ? errors : undefined 
          };

        } catch (e) {
          return { success: false, errors: [(e as Error).message] };
        }
      }
    }),
    {
      name: 'vsp_matches_v2.json', // NOME DO ARQUIVO DE DADOS
      storage: createJSONStorage(() => capacitorFileStorage), // USA O ADAPTADOR NATIVO
      version: 2, // Versionamento do schema de dados
    }
  )
);
