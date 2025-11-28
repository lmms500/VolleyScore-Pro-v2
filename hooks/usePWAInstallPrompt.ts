import { useState, useEffect, useCallback } from 'react';

// Interface do evento nativo
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt: () => Promise<void>;
}

export const usePWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está instalado (Modo Standalone)
    const checkInstalled = () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsAppInstalled(!!isStandalone);
    };
    checkInstalled();
    
    // Listener para mudanças no modo de exibição
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

    // 2. Captura o evento 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o banner automático do Chrome (queremos acionar via botão)
      e.preventDefault();
      // Guarda o evento para usar depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Habilita a UI
      setIsInstallable(true);
      console.log("PWA: Evento 'beforeinstallprompt' capturado.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listener para quando o app é instalado com sucesso
    const handleAppInstalled = () => {
        setIsAppInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        console.log("PWA: App instalado com sucesso.");
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
        console.log("PWA: Nenhuma instalação pendente.");
        return;
    }

    // Mostra o prompt nativo
    deferredPrompt.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Usuário escolheu: ${outcome}`);
    
    // Limpa o evento, pois ele só pode ser usado uma vez
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt]);

  return { 
    isInstallable, // Verdadeiro se o navegador permitir instalação
    isAppInstalled, 
    promptInstall 
  };
};