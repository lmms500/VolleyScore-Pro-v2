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

export const TEAM_COLORS: Record<string, ColorTheme> = {
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

export const COLOR_KEYS = Object.keys(TEAM_COLORS);

/**
 * Resolves a color string (preset key or hex code) into a full theme object.
 * Supports Tailwind Arbitrary Values for Hex codes.
 */
export const resolveTheme = (color: TeamColor | undefined): ColorTheme => {
    if (!color) return TEAM_COLORS['slate'];
    
    // 1. Check if it is a preset
    if (TEAM_COLORS[color]) {
        return TEAM_COLORS[color];
    }

    // 2. Assume it is a Hex Code (or any valid CSS color string)
    // We attempt to generate valid arbitrary values. 
    // Note: This relies on the JIT engine picking up these classes or the browser handling them if injected via style.
    // For production builds without safe-listing, inline styles are safer, but we stick to the class interface here.
    const safeColor = color.trim();
    
    return {
        text: `text-[${safeColor}]`,
        textDark: `dark:text-[${safeColor}]`,
        bg: `bg-[${safeColor}]/10`,
        bgDark: `dark:bg-[${safeColor}]/20`,
        border: `border-[${safeColor}]/30`,
        halo: `bg-[${safeColor}]`,
        glow: `shadow-[0_0_15px_${safeColor}80]`, // Hex alpha approximation
        crown: `text-[${safeColor}]`,
        ring: `ring-[${safeColor}]`,
        gradient: `from-[${safeColor}]/10 to-transparent`
    };
};