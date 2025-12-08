/**
 * useHaptics Hook
 * 
 * Hook para feedback tátil usando o serviço nativo NativeHaptics.
 * Fornece abstração de alto nível com controle de enable/disable.
 * 
 * @module hooks/useHaptics
 */

import { useCallback } from 'react';
import { NativeHaptics, ImpactStyle, NotificationType } from '../services/NativeHaptics';

type ImpactStyleAlias = 'light' | 'medium' | 'heavy';
type NotificationTypeAlias = 'success' | 'warning' | 'error';

/**
 * Hook de feedback tátil com suporte a Capacitor Haptics nativo.
 * 
 * @param enabled Se false, desabilita todo feedback tátil
 * @returns Objeto com métodos impact, notification e trigger
 * 
 * @example
 * ```tsx
 * const haptics = useHaptics(config.enableSound);
 * 
 * // Feedback de toque leve
 * haptics.impact('light');
 * 
 * // Feedback de sucesso
 * haptics.notification('success');
 * 
 * // Vibração customizada
 * haptics.trigger(50);
 * ```
 */
export const useHaptics = (enabled: boolean = true) => {
  /**
   * Gera vibração customizada usando padrão simples ou complexo.
   * 
   * @param pattern Duração em ms ou array [vibra, pausa, vibra, ...]
   */
  const trigger = useCallback((pattern: number | number[]) => {
    if (!enabled) return;
    NativeHaptics.vibrate(pattern);
  }, [enabled]);

  /**
   * Gera feedback tátil de impacto (ideal para toques em botões).
   * 
   * @param style Intensidade: 'light', 'medium' ou 'heavy'
   */
  const impact = useCallback((style: ImpactStyleAlias) => {
    if (!enabled) return;
    
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    
    NativeHaptics.impact(styleMap[style]);
  }, [enabled]);

  /**
   * Gera feedback tátil de notificação (ideal para alertas e conclusões).
   * 
   * @param type Tipo: 'success', 'warning' ou 'error'
   */
  const notification = useCallback((type: NotificationTypeAlias) => {
    if (!enabled) return;
    
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    
    NativeHaptics.notification(typeMap[type]);
  }, [enabled]);

  return { impact, notification, trigger };
};