import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from './AuthContext';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

interface PWAUpdateContextType {
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  countdown: number;
  currentVersion: string;
}

const PWAUpdateContext = createContext<PWAUpdateContextType | undefined>(undefined);

export const PWAUpdateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [countdown, setCountdown] = useState(CHECK_INTERVAL / 1000);
  const { roles } = useAuth();
  const isAdmin = roles.includes('Admin');
  const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered() {
      console.log(`[PWA] Service Worker registered. Current version: ${currentVersion}`);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log(`[PWA] Update available. Current version: ${currentVersion}`);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdmin) {
        console.log('[PWA] Verificando actualizaciones críticas...');
      }
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
    if (needRefresh && isAdmin) {
      console.log(`[PWA] Actualización crítica detectada para versión ${currentVersion}. Mostrando notificación obligatoria...`);
    }
  }, [needRefresh, isAdmin]);

  const value = { needRefresh, updateServiceWorker, countdown, currentVersion };

  return <PWAUpdateContext.Provider value={value}>{children}</PWAUpdateContext.Provider>;
};

export const usePWAUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (context === undefined) {
    throw new Error('usePWAUpdate must be used within a PWAUpdateProvider');
  }
  return context;
};
