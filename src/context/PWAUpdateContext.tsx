import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos

interface PWAUpdateContextType {
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  countdown: number;
}

const PWAUpdateContext = createContext<PWAUpdateContextType | undefined>(undefined);

export const PWAUpdateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [countdown, setCountdown] = useState(CHECK_INTERVAL / 1000);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered() {
      console.log('[PWA] Service Worker registered.');
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[PWA] Checking for new version...');
      updateServiceWorker(true);
    }, CHECK_INTERVAL);

    const countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : CHECK_INTERVAL / 1000));
    }, 1000);

    return () => {
        clearInterval(interval);
        clearInterval(countdownInterval);
    }
  }, [updateServiceWorker]);

  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] New version detected. Updating automatically...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  const value = { needRefresh, updateServiceWorker, countdown };

  return <PWAUpdateContext.Provider value={value}>{children}</PWAUpdateContext.Provider>;
};

export const usePWAUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (context === undefined) {
    throw new Error('usePWAUpdate must be used within a PWAUpdateProvider');
  }
  return context;
};
