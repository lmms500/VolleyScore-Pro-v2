import React from 'react';
import { HudPlacement } from '../hooks/useHudMeasure';

interface MeasuredFullscreenHUDProps {
  placement: HudPlacement;
  setsLeft: number;
  setsRight: number;
  colorLeft: 'indigo' | 'rose';
  colorRight: 'indigo' | 'rose';
}

export const MeasuredFullscreenHUD: React.FC<MeasuredFullscreenHUDProps> = ({
  placement,
  setsLeft, setsRight, 
  colorLeft, colorRight
}) => {
  
  if (!placement.visible) return null;

  const getTheme = (color: 'indigo' | 'rose') => ({
      text: color === 'indigo' ? 'text-indigo-400' : 'text-rose-400',
      glow: color === 'indigo' ? 'drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]' : 'drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]',
  });

  const themeLeft = getTheme(colorLeft);
  const themeRight = getTheme(colorRight);

  return (
    <div 
        style={{
            position: 'fixed',
            left: placement.left,
            top: placement.top,
            transform: `translate(-50%, -50%) scale(${placement.scale})`,
            width: 200, // Base width for layout context
            pointerEvents: 'none',
            zIndex: 40,
        }} 
        className="flex items-center justify-center gap-8 transition-transform duration-100 ease-linear"
    >
        {/* Sets Display */}
        <div className="flex items-center justify-center gap-6 bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/5 shadow-2xl">
            <span className={`font-black text-6xl leading-none ${themeLeft.text} ${themeLeft.glow}`}>
                {setsLeft}
            </span>

            <div className="h-10 w-px bg-white/10"></div>

            <span className={`font-black text-6xl leading-none ${themeRight.text} ${themeRight.glow}`}>
                {setsRight}
            </span>
        </div>
    </div>
  );
};