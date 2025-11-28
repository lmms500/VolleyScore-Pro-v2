import { useState, useLayoutEffect, useCallback } from 'react';

/**
 * =================================================================================
 * useHudMeasure Hook
 * =================================================================================
 * Este hook é o cérebro por trás do layout dinâmico do HUD em tela cheia.
 * Ele mede a posição real dos dígitos na tela e calcula o espaço disponível
 * entre eles para posicionar e dimensionar o HUD de forma inteligente.
 * 
 * Saídas (HudPlacement):
 *   - mode: 'portrait', 'landscape', ou 'fallback' se não houver espaço.
 *   - left, top, width, height: As coordenadas e dimensões calculadas para o HUD.
 *   - compact: Um booleano que indica se o HUD deve usar um layout mais denso.
 *   - internalScale: Um fator de escala (0.0 a 1.0) para ajustar o tamanho dos
 *     elementos internos do HUD (ícones, texto) sem alterar o tamanho do contêiner.
 * 
 * Parâmetros (UseHudMeasureOptions):
 *   - enabled: Ativa ou desativa os cálculos (essencial para performance).
 *   - debug: Se true, desenha caixas visuais na tela para depuração do layout.
 *   - debounceMs: Tempo de espera em milissegundos para recalcular o layout após um evento.
 * =================================================================================
 */

// --- Tipos e Interfaces ---

export interface HudPlacement {
  mode: "landscape" | "portrait" | "fallback";
  left: number;
  top: number;
  width: number;
  height: number;
  compact: boolean;
  internalScale: number;
}

interface UseHudMeasureProps {
  leftScoreEl: HTMLElement | null;
  rightScoreEl: HTMLElement | null;
  bottomAnchorEl: HTMLElement | null; // Usado em modo retrato (ex: nome do time B)
  enabled?: boolean;
  debug?: boolean;
  debounceMs?: number;
}

// --- Constantes de Design ---

const MIN_HUD_WIDTH = 220;
const PREFERRED_HUD_WIDTH = 420;
const MAX_HUD_WIDTH = 650;
const MIN_HUD_HEIGHT = 140; 
const MAX_HUD_HEIGHT = 240; 
const COMPACT_THRESHOLD_LANDSCAPE = 300;
const COMPACT_THRESHOLD_PORTRAIT = 150;
const GAP_PADDING = 20; // Espaçamento mínimo entre o HUD e os dígitos

const INITIAL_PLACEMENT: HudPlacement = {
  mode: 'portrait', left: -9999, top: -9999, width: 0, height: 0, compact: false, internalScale: 1
};

// --- O Hook ---

export function useHudMeasure({
  leftScoreEl,
  rightScoreEl,
  bottomAnchorEl,
  enabled = true,
  debug = false,
  debounceMs = 100
}: UseHudMeasureProps): HudPlacement {
  
  const [placement, setPlacement] = useState<HudPlacement>(INITIAL_PLACEMENT);

  const calculateLayout = useCallback(() => {
    if (!enabled || !leftScoreEl || !rightScoreEl) {
        if (placement.left > -1) setPlacement(INITIAL_PLACEMENT);
        return;
    }

    const rectA = leftScoreEl.getBoundingClientRect();
    const rectB = rightScoreEl.getBoundingClientRect();
    const rectBottom = bottomAnchorEl?.getBoundingClientRect();

    const isPortrait = window.innerHeight > window.innerWidth;
    let newPlacement: HudPlacement;

    if (isPortrait) {
        const bottomAnchorTop = rectBottom?.top ?? (rectB.top + rectB.height + 20);
        const availableHeight = bottomAnchorTop - rectA.bottom;

        if (availableHeight < MIN_HUD_HEIGHT / 2) {
            newPlacement = { ...INITIAL_PLACEMENT, mode: 'fallback' };
        } else {
            const height = Math.max(MIN_HUD_HEIGHT, Math.min(availableHeight - GAP_PADDING * 2, MAX_HUD_HEIGHT));
            const width = Math.min(window.innerWidth - GAP_PADDING * 2, MAX_HUD_WIDTH);
            const top = rectA.bottom + (availableHeight - height) / 2;
            const left = (window.innerWidth - width) / 2;
            const compact = availableHeight < COMPACT_THRESHOLD_PORTRAIT;
            const internalScale = Math.min(1, height / MAX_HUD_HEIGHT);

            newPlacement = { mode: 'portrait', left, top, width, height, compact, internalScale };
        }
    } else { // Landscape
        const availableWidth = rectB.left - rectA.right;
        
        if (availableWidth < MIN_HUD_WIDTH / 2) {
            newPlacement = { ...INITIAL_PLACEMENT, mode: 'fallback' };
        } else {
            const width = Math.max(MIN_HUD_WIDTH, Math.min(availableWidth - GAP_PADDING * 2, PREFERRED_HUD_WIDTH));
            const height = Math.min(window.innerHeight * 0.8, MAX_HUD_HEIGHT); // Allow up to 80% of screen height or MAX
            const left = rectA.right + (availableWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
            const compact = availableWidth < COMPACT_THRESHOLD_LANDSCAPE;
            const internalScale = Math.min(1, width / PREFERRED_HUD_WIDTH);
            
            newPlacement = { mode: 'landscape', left, top, width, height, compact, internalScale };
        }
    }
    setPlacement(newPlacement);

  }, [enabled, leftScoreEl, rightScoreEl, bottomAnchorEl, placement.left]);

  useLayoutEffect(() => {
    if (!enabled) return;

    const debouncedCalculation = () => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(calculateLayout, debounceMs);
        };
    };
    const triggerCalc = debouncedCalculation();
    
    // Dispara o cálculo inicial
    triggerCalc();
    
    // BUG FIX: Fullscreen transition animation causes elements to move.
    // We trigger calculation again after common transition durations to catch the final position.
    setTimeout(calculateLayout, 350); 
    setTimeout(calculateLayout, 600); 

    // --- Observadores ---
    const observers: (ResizeObserver | MutationObserver)[] = [];
    
    // 1. ResizeObserver para mudanças de tamanho da janela e dos elementos
    const resizeObserver = new ResizeObserver(triggerCalc);
    if(leftScoreEl) resizeObserver.observe(leftScoreEl);
    if(rightScoreEl) resizeObserver.observe(rightScoreEl);
    window.addEventListener('resize', triggerCalc);
    window.addEventListener('orientationchange', triggerCalc);
    observers.push(resizeObserver);
    
    // 2. MutationObserver para mudanças no conteúdo (pontuação)
    const mutationObserver = new MutationObserver(triggerCalc);
    if (leftScoreEl) mutationObserver.observe(leftScoreEl, { childList: true, subtree: true, characterData: true });
    if (rightScoreEl) mutationObserver.observe(rightScoreEl, { childList: true, subtree: true, characterData: true });
    observers.push(mutationObserver);
    
    // --- Lógica de Debug ---
    if (debug) {
      const debugElements: HTMLElement[] = [];
      const createDebugBox = (rect: DOMRect, color: string, label: string) => {
        const box = document.createElement('div');
        box.style.position = 'fixed';
        box.style.left = `${rect.left}px`;
        box.style.top = `${rect.top}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
        box.style.border = `2px dashed ${color}`;
        box.style.zIndex = '9998';
        box.style.pointerEvents = 'none';
        box.textContent = label;
        box.style.color = 'white';
        box.style.fontSize = '10px';
        document.body.appendChild(box);
        debugElements.push(box);
      };

      if (leftScoreEl) createDebugBox(leftScoreEl.getBoundingClientRect(), 'cyan', 'Left Score');
      if (rightScoreEl) createDebugBox(rightScoreEl.getBoundingClientRect(), 'magenta', 'Right Score');
      if (bottomAnchorEl) createDebugBox(bottomAnchorEl.getBoundingClientRect(), 'yellow', 'Bottom Anchor');
      
      const gapBox = document.createElement('div');
      gapBox.style.position = 'fixed';
      gapBox.style.left = `${placement.left}px`;
      gapBox.style.top = `${placement.top}px`;
      gapBox.style.width = `${placement.width}px`;
      gapBox.style.height = `${placement.height}px`;
      gapBox.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
      gapBox.style.border = `2px solid green`;
      gapBox.style.zIndex = '9999';
      gapBox.style.pointerEvents = 'none';
      document.body.appendChild(gapBox);
      debugElements.push(gapBox);

      return () => {
        debugElements.forEach(el => el.remove());
      };
    }
    
    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', triggerCalc);
      window.removeEventListener('orientationchange', triggerCalc);
      observers.forEach(obs => obs.disconnect());
    };
  }, [calculateLayout, enabled, debounceMs, debug, placement.mode]); // Added placement.mode to dep array to help re-trigger if mode changes

  return placement;
}
