/**
 * VolleyScore Pro - Native Preferences Service
 * 
 * Unified preferences API supporting:
 * - Capacitor Preferences (native Android/iOS - encrypted by OS)
 * - localStorage fallback (web browser)
 * 
 * USAGE:
 * const prefs = getPreferencesService();
 * await prefs.set('language', 'pt');
 * const lang = await prefs.get('language') // 'pt'
 * await prefs.remove('language');
 * 
 * FEATURES:
 * - Async API compatible with Capacitor plugins
 * - Automatic JSON serialization
 * - Type-safe generic interface
 * - Error resilience with console warnings
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Service Interface - Platform agnostic
 */
export interface IPreferencesService {
  isNative: boolean;
  set<T>(key: string, value: T): Promise<void>;
  get<T>(key: string, defaultValue?: T): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Native Preferences Service - Capacitor implementation
 * Uses encrypted storage on Android/iOS
 */
class NativePreferencesService implements IPreferencesService {
  isNative = true;

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await Preferences.set({
        key,
        value: serialized,
      });
    } catch (error) {
      console.error(`[NativePreferences] Failed to set key "${key}":`, error);
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null || value === undefined) return defaultValue ?? null;

      try {
        return JSON.parse(value) as T;
      } catch {
        // If not JSON, return as string (or cast to T if string is expected)
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`[NativePreferences] Failed to get key "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[NativePreferences] Failed to remove key "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('[NativePreferences] Failed to clear all preferences:', error);
    }
  }
}

/**
 * Web Preferences Service - localStorage fallback
 * Used on browser/web environment
 */
class WebPreferencesService implements IPreferencesService {
  isNative = false;
  private PREFIX = 'volleyscore_pref_';

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error(`[WebPreferences] Failed to set key "${key}":`, error);
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return defaultValue ?? null;

      try {
        return JSON.parse(stored) as T;
      } catch {
        // If not JSON, return as string
        return stored as unknown as T;
      }
    } catch (error) {
      console.error(`[WebPreferences] Failed to get key "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error(`[WebPreferences] Failed to remove key "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[WebPreferences] Failed to clear all preferences:', error);
    }
  }
}

/**
 * Service Factory - Singleton pattern
 * Returns best available implementation for the platform
 */
class PreferencesServiceFactory {
  private static instance: IPreferencesService | null = null;

  static getInstance(): IPreferencesService {
    if (!this.instance) {
      // Use native Preferences if Capacitor is available on a native platform
      if (Capacitor.isNativePlatform()) {
        this.instance = new NativePreferencesService();
      } else {
        this.instance = new WebPreferencesService();
      }
    }
    return this.instance;
  }

  static reset(): void {
    if (this.instance) {
      this.instance = null;
    }
  }
}

/**
 * Public Factory Function
 */
export const getPreferencesService = (): IPreferencesService => {
  return PreferencesServiceFactory.getInstance();
};

export const resetPreferencesService = (): void => {
  PreferencesServiceFactory.reset();
};

export default {
  getPreferencesService,
  resetPreferencesService,
};
