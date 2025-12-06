
import { useState, useEffect, useCallback } from 'react';
import { usePWAInstallPrompt } from './usePWAInstallPrompt';

export const useServiceWorker = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const { isInstallable, promptInstall, isIOS, isStandalone } = usePWAInstallPrompt();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const updateSW = async () => {
          try {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                  setRegistration(reg);
                  if (reg.waiting) setNeedRefresh(true);
              }
          } catch (error) {
              console.warn('Service Worker registration check failed:', error);
          }
      };
      
      updateSW();

      // Listen for controller change (reload page when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    setIsChecking(true);
    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
            await reg.update();
            if (reg.waiting || reg.installing) {
                setNeedRefresh(true);
            }
            setRegistration(reg);
        }
    } catch (e) {
        console.error("Failed to check for updates:", e);
    } finally {
        // Minimum spinner time for UX
        setTimeout(() => setIsChecking(false), 500);
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const closePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    checkForUpdates,
    closePrompt,
    isChecking,
    // Pass-through install logic
    isInstallable,
    promptInstall,
    isIOS,
    isStandalone
  };
};
