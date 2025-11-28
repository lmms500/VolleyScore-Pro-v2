import React from 'react';
import { Hand } from 'lucide-react';
import { HudPlacement } from '../hooks/useHudMeasure';

interface MeasuredFullscreenHUDProps {
  placement: HudPlacement;
  setsLeft: number;
  setsRight: number;
  timeoutsLeft: number;
  timeoutsRight: number;
  onTimeoutLeft: () => void;
  onTimeoutRight: () => void;
  colorLeft: 'indigo' | 'rose';
  colorRight: 'indigo' | 'rose';
}

export const MeasuredFullscreenHUD: React.FC<MeasuredFullscreenHUDProps> = ({
  placement,
  setsLeft, setsRight, 
  timeoutsLeft, timeoutsRight, onTimeoutLeft, onTimeoutRight,
  colorLeft, colorRight
}) => {
  // If fallback or invalid measurement, default to centered fixed
  const isMeasured = placement.mode !== 'fallback' && placement.left > -9000;

  // Theme logic
  const getTheme = (color: 'indigo' | 'rose') => ({
      text: color === 'indigo' ? 'text-indigo-400' : 'text-rose-400',
      glow: color === 'indigo' ? 'drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]',
      dot: color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_currentColor]' : 'bg-rose-500 shadow-[0_0_8px_currentColor]',
      icon: color === 'indigo' ? 'text-indigo-400' : 'text-rose-400'
  });

  const themeLeft = getTheme(colorLeft);
  const themeRight = getTheme(colorRight);

  const containerStyle: React.CSSProperties = isMeasured ? {
      position: 'absolute',
      left: placement.left,
      top: placement.top,
      width: placement.width,
      height: placement.height,
      transform: `scale(${placement.internalScale})`, // Scale down if gap is small
      pointerEvents: 'none' // Allow click-through to background if needed, but buttons need events
  } : {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
  };

  const contentClass = isMeasured 
    ? "w-full h-full flex items-center justify-center gap-8 md:gap-16 pointer-events-auto"
    : "flex items-center justify-center gap-12 sm:gap-24 md:gap-32 pointer-events-auto";

  return (
    <div style={containerStyle} className="z-40 transition-all duration-300 ease-out">
        {/* Sets & Timeouts Center Display */}
        <div className={contentClass}>
              {/* Left Side Info */}
              <div className="flex items-center gap-4 text-center">
                <button onClick={onTimeoutLeft} disabled={timeoutsLeft >= 2} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent group active:scale-95">
                  <Hand className={`size-6 sm:size-7 ${themeLeft.icon} group-hover:scale-110 transition-transform`} />
                  <div className="flex gap-1.5">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 rounded-full ${t <= timeoutsLeft ? 'bg-slate-700' : themeLeft.dot}`} />)}
                  </div>
                </button>
                <span className={`font-black ${themeLeft.text} ${themeLeft.glow} text-7xl sm:text-9xl leading-none`}>
                    {setsLeft}
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

              {/* Right Side Info */}
              <div className="flex items-center gap-4 text-center">
                <span className={`font-black ${themeRight.text} ${themeRight.glow} text-7xl sm:text-9xl leading-none`}>
                    {setsRight}
                </span>
                <button onClick={onTimeoutRight} disabled={timeoutsRight >= 2} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent group active:scale-95">
                  <Hand className={`size-6 sm:size-7 ${themeRight.icon} group-hover:scale-110 transition-transform`} />
                  <div className="flex gap-1.5">
                    {[1, 2].map(t => <div key={t} className={`w-2.5 h-2.5 rounded-full ${t <= timeoutsRight ? 'bg-slate-700' : themeRight.dot}`} />)}
                  </div>
                </button>
              </div>
        </div>
    </div>
  );
};