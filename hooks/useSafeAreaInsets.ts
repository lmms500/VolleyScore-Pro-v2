/**
 * useSafeAreaInsets Hook
 * 
 * Fornece valores seguros de safe area para iOS (notch, dynamic island, home bar)
 * e Android (navigation bar, status bar).
 * 
 * Garante que o conteúdo da UI não seja obstruído por elementos do sistema.
 * 
 * @module hooks/useSafeAreaInsets
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Obtém valores de safe area insets usando CSS environment variables.
 * Essas variáveis são automaticamente definidas pelo sistema operacional.
 */
const getSafeAreaInsets = (): SafeAreaInsets => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const getInsetValue = (variable: string): number => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
    
    return value ? parseInt(value, 10) : 0;
  };

  return {
    top: getInsetValue('env(safe-area-inset-top)') || getInsetValue('constant(safe-area-inset-top)'),
    right: getInsetValue('env(safe-area-inset-right)') || getInsetValue('constant(safe-area-inset-right)'),
    bottom: getInsetValue('env(safe-area-inset-bottom)') || getInsetValue('constant(safe-area-inset-bottom)'),
    left: getInsetValue('env(safe-area-inset-left)') || getInsetValue('constant(safe-area-inset-left)'),
  };
};

/**
 * Hook para acessar Safe Area Insets em tempo real.
 * 
 * Retorna valores em pixels para cada lado da tela.
 * 
 * @returns SafeAreaInsets com top, right, bottom, left em pixels
 * 
 * @example
 * ```tsx
 * const { top, bottom } = useSafeAreaInsets();
 * 
 * return (
 *   <div style={{ paddingTop: top, paddingBottom: bottom }}>
 *     Conteúdo seguro
 *   </div>
 * );
 * ```
 * 
 * @example
 * // Com Tailwind/NativeWind (usar variáveis CSS)
 * ```tsx
 * <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
 *   Conteúdo
 * </div>
 * ```
 */
export const useSafeAreaInsets = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>(getSafeAreaInsets);

  useEffect(() => {
    // Atualiza insets quando a viewport muda (rotação, teclado, etc.)
    const updateInsets = () => {
      setInsets(getSafeAreaInsets());
    };

    // Escuta mudanças na viewport
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    // Força atualização inicial após montagem (importante para iOS)
    const timeoutId = setTimeout(updateInsets, 100);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
      clearTimeout(timeoutId);
    };
  }, []);

  // Em plataformas nativas, retorna valores detectados
  // Em web/desktop, retorna zeros (sem safe areas)
  return Capacitor.isNativePlatform() ? insets : { top: 0, right: 0, bottom: 0, left: 0 };
};

/**
 * Utilitário para gerar classes CSS inline com safe area.
 * 
 * @param additionalPadding Padding adicional em px além da safe area
 * @returns Objeto de estilos inline compatível com React
 * 
 * @example
 * ```tsx
 * const styles = getSafeAreaStyles({ top: 16, bottom: 16 });
 * <div style={styles}>...</div>
 * ```
 */
export const getSafeAreaStyles = (additionalPadding: Partial<SafeAreaInsets> = {}) => {
  const { top = 0, right = 0, bottom = 0, left = 0 } = additionalPadding;

  return {
    paddingTop: `calc(env(safe-area-inset-top) + ${top}px)`,
    paddingRight: `calc(env(safe-area-inset-right) + ${right}px)`,
    paddingBottom: `calc(env(safe-area-inset-bottom) + ${bottom}px)`,
    paddingLeft: `calc(env(safe-area-inset-left) + ${left}px)`,
  };
};
