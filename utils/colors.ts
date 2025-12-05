
import { TeamColor } from '../types';

interface ColorTheme {
    text: string;           // Base text color
    textDark: string;       // Dark mode text color
    bg: string;             // Light background (pills, badges)
    bgDark: string;         // Dark mode background
    border: string;         // Border color
    halo: string;           // The blurred circle behind numbers
    glow: string;           // Text/Box shadow glow
    crown: string;          // Icon color (Winner crown)
    ring: string;           // Focus rings
    gradient: string;       // Subtle gradient for cards
}

export const TEAM_COLORS: Record<TeamColor, ColorTheme> = {
    indigo: {
        text: 'text-indigo-600',
        textDark: 'dark:text-indigo-300',
        bg: 'bg-indigo-500/10',
        bgDark: 'dark:bg-indigo-500/20',
        border: 'border-indigo-500/30',
        halo: 'bg-indigo-500',
        glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]',
        crown: 'text-indigo-500',
        ring: 'ring-indigo-500',
        gradient: 'from-indigo-500/10 to-transparent'
    },
    rose: {
        text: 'text-rose-600',
        textDark: 'dark:text-rose-300',
        bg: 'bg-rose-500/10',
        bgDark: 'dark:bg-rose-500/20',
        border: 'border-rose-500/30',
        halo: 'bg-rose-500',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]',
        crown: 'text-rose-500',
        ring: 'ring-rose-500',
        gradient: 'from-rose-500/10 to-transparent'
    },
    emerald: {
        text: 'text-emerald-600',
        textDark: 'dark:text-emerald-300',
        bg: 'bg-emerald-500/10',
        bgDark: 'dark:bg-emerald-500/20',
        border: 'border-emerald-500/30',
        halo: 'bg-emerald-500',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
        crown: 'text-emerald-500',
        ring: 'ring-emerald-500',
        gradient: 'from-emerald-500/10 to-transparent'
    },
    amber: {
        text: 'text-amber-600',
        textDark: 'dark:text-amber-300',
        bg: 'bg-amber-500/10',
        bgDark: 'dark:bg-amber-500/20',
        border: 'border-amber-500/30',
        halo: 'bg-amber-500',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
        crown: 'text-amber-500',
        ring: 'ring-amber-500',
        gradient: 'from-amber-500/10 to-transparent'
    },
    sky: {
        text: 'text-sky-600',
        textDark: 'dark:text-sky-300',
        bg: 'bg-sky-500/10',
        bgDark: 'dark:bg-sky-500/20',
        border: 'border-sky-500/30',
        halo: 'bg-sky-500',
        glow: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]',
        crown: 'text-sky-500',
        ring: 'ring-sky-500',
        gradient: 'from-sky-500/10 to-transparent'
    },
    violet: {
        text: 'text-violet-600',
        textDark: 'dark:text-violet-300',
        bg: 'bg-violet-500/10',
        bgDark: 'dark:bg-violet-500/20',
        border: 'border-violet-500/30',
        halo: 'bg-violet-500',
        glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]',
        crown: 'text-violet-500',
        ring: 'ring-violet-500',
        gradient: 'from-violet-500/10 to-transparent'
    },
    slate: {
        text: 'text-slate-600',
        textDark: 'dark:text-slate-300',
        bg: 'bg-slate-500/10',
        bgDark: 'dark:bg-slate-500/20',
        border: 'border-slate-500/30',
        halo: 'bg-slate-500',
        glow: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]',
        crown: 'text-slate-500',
        ring: 'ring-slate-500',
        gradient: 'from-slate-500/10 to-transparent'
    },
    fuchsia: {
        text: 'text-fuchsia-600',
        textDark: 'dark:text-fuchsia-300',
        bg: 'bg-fuchsia-500/10',
        bgDark: 'dark:bg-fuchsia-500/20',
        border: 'border-fuchsia-500/30',
        halo: 'bg-fuchsia-500',
        glow: 'shadow-[0_0_15px_rgba(217,70,239,0.5)]',
        crown: 'text-fuchsia-500',
        ring: 'ring-fuchsia-500',
        gradient: 'from-fuchsia-500/10 to-transparent'
    }
};

export const COLOR_KEYS = Object.keys(TEAM_COLORS) as TeamColor[];
