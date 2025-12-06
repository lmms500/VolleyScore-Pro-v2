
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar SW manualmente para ter controle total dos eventos
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);

          // Se já existe um worker esperando (atualização baixada em background)
          if (reg.waiting) {
              setNeedRefresh(true);
          }

          // Monitorar novas atualizações
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Nova versão disponível (já havia um SW ativo antes)
                    setNeedRefresh(true);
                  } else {
                    // Conteúdo cacheado para offline (primeira vez)
                    setOfflineReady(true);
                  }
                }
              });
            }
          });
        })
        .catch(err => {
            // Silence specific origin errors common in preview environments
            if (err.message && (err.message.includes('origin') || err.message.includes('scriptURL'))) {
                console.warn('Service Worker registration skipped: Origin mismatch in preview environment.');
            } else {
                console.error('SW Register Error:', err);
            }
        });

      // Recarregar a página quando o novo SW assumir o controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      // Envia mensagem para o SW pular a espera e ativar a nova versão
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Auto-fechar o aviso de "Offline Ready" após 4 segundos
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => setOfflineReady(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {(offlineReady || needRefresh) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto bg-slate-900/90 dark:bg-white/10 backdrop-blur-xl border border-white/10 text-white p-4 rounded-2xl shadow-2xl shadow-black/50 max-w-xs flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${needRefresh ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                 {needRefresh ? <Download size={18} /> : <WifiOff size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-1">
                  {needRefresh ? "Update Available" : "Offline Ready"}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {needRefresh 
                    ? "New version available. Click reload to update."
                    : "App is ready to work offline."}
                </p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {needRefresh && (
              <button 
                onClick={updateServiceWorker}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Reload
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
