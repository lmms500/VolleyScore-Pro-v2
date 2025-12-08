/**
 * NativeHaptics Service
 * 
 * Wrapper nativo para feedback tátil usando Capacitor Haptics API.
 * Fornece abstração segura com fallback gracioso para plataformas não suportadas.
 * 
 * @module services/NativeHaptics
 * @requires @capacitor/haptics (deve ser instalado via npm)
 */

import { Capacitor } from '@capacitor/core';

// Tipos para Haptics (compatível com @capacitor/haptics v6+)
export enum ImpactStyle {
  Light = 'LIGHT',
  Medium = 'MEDIUM',
  Heavy = 'HEAVY'
}

export enum NotificationType {
  Success = 'SUCCESS',
  Warning = 'WARNING',
  Error = 'ERROR'
}

interface HapticsImpactOptions {
  style: ImpactStyle;
}

interface HapticsNotificationOptions {
  type: NotificationType;
}

/**
 * Verifica se a plataforma suporta Haptics nativos.
 */
const isHapticsAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Lazy-load do plugin Haptics para evitar erros em plataformas não suportadas.
 */
const getHapticsPlugin = async () => {
  if (!isHapticsAvailable()) {
    return null;
  }
  
  try {
    // Dynamic import para não quebrar o build em ambientes sem o plugin
    const { Haptics } = await import('@capacitor/haptics');
    return Haptics;
  } catch (error) {
    console.warn('NativeHaptics: Plugin não disponível. Feedback tátil desabilitado.');
    return null;
  }
};

/**
 * Fallback para navegadores usando Vibration API (menos sofisticado).
 */
const vibrateFallback = (pattern: number | number[]): void => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    // Silenciosamente ignora se vibração não é suportada
  }
};

/**
 * NativeHaptics - Serviço de Feedback Tátil Nativo
 */
export const NativeHaptics = {
  /**
   * Gera feedback tátil de impacto (ideal para toques, ações, confirmações).
   * 
   * @param style Estilo do impacto: Light, Medium ou Heavy
   * @example
   * ```ts
   * await NativeHaptics.impact(ImpactStyle.Light); // Toque suave
   * await NativeHaptics.impact(ImpactStyle.Heavy); // Impacto forte
   * ```
   */
  async impact(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
    const Haptics = await getHapticsPlugin();
    
    if (Haptics) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('NativeHaptics.impact falhou:', error);
      }
    } else {
      // Fallback para vibrate API
      const durationMap = {
        [ImpactStyle.Light]: 10,
        [ImpactStyle.Medium]: 20,
        [ImpactStyle.Heavy]: 40,
      };
      vibrateFallback(durationMap[style]);
    }
  },

  /**
   * Gera feedback tátil de notificação (ideal para alertas, conclusões, erros).
   * 
   * @param type Tipo de notificação: Success, Warning ou Error
   * @example
   * ```ts
   * await NativeHaptics.notification(NotificationType.Success); // Ação bem-sucedida
   * await NativeHaptics.notification(NotificationType.Error);   // Erro crítico
   * ```
   */
  async notification(type: NotificationType): Promise<void> {
    const Haptics = await getHapticsPlugin();
    
    if (Haptics) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.warn('NativeHaptics.notification falhou:', error);
      }
    } else {
      // Fallback para vibrate API com padrões distintos
      const patternMap = {
        [NotificationType.Success]: [10, 50, 20],
        [NotificationType.Warning]: [30, 50, 30],
        [NotificationType.Error]: [50, 100, 50, 100, 50],
      };
      vibrateFallback(patternMap[type]);
    }
  },

  /**
   * Gera vibração com padrão customizado (útil para feedback complexo).
   * 
   * @param pattern Duração em ms (número) ou padrão [vibra, pausa, vibra, ...]
   * @example
   * ```ts
   * await NativeHaptics.vibrate(50);              // Vibração simples de 50ms
   * await NativeHaptics.vibrate([100, 50, 100]);  // Padrão: vibra-pausa-vibra
   * ```
   */
  async vibrate(pattern: number | number[]): Promise<void> {
    const Haptics = await getHapticsPlugin();
    
    if (Haptics) {
      try {
        // Capacitor Haptics não suporta padrões customizados diretamente.
        // Usamos impact como aproximação ou fallback para vibrate API.
        if (typeof pattern === 'number') {
          // Aproximação baseada na duração
          const style = pattern < 15 ? ImpactStyle.Light 
                      : pattern < 30 ? ImpactStyle.Medium 
                      : ImpactStyle.Heavy;
          await Haptics.impact({ style });
        } else {
          // Para padrões, usamos o fallback
          vibrateFallback(pattern);
        }
      } catch (error) {
        console.warn('NativeHaptics.vibrate falhou:', error);
      }
    } else {
      vibrateFallback(pattern);
    }
  },

  /**
   * Verifica se o dispositivo suporta feedback tátil nativo.
   */
  isAvailable(): boolean {
    return isHapticsAvailable();
  },
};
