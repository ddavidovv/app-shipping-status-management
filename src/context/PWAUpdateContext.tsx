import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from './AuthContext';

// Intervalos más frecuentes para mejor detección
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
const IMMEDIATE_CHECK_INTERVAL = 10 * 1000; // 10 segundos para checks inmediatos

interface PWAUpdateContextType {
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  countdown: number;
  currentVersion: string;
  forceCheck: () => Promise<void>;
}

const PWAUpdateContext = createContext<PWAUpdateContextType | undefined>(undefined);

export const PWAUpdateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [countdown, setCountdown] = useState(CHECK_INTERVAL / 1000);
  const [lastVersion, setLastVersion] = useState<string>('');
  const { roles } = useAuth();
  const isAdmin = roles.includes('Admin');
  const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered() {
      console.log(`[PWA] Service Worker registered. Current version: ${currentVersion}`);
      setLastVersion(currentVersion);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log(`[PWA] Update available. Current version: ${currentVersion}`);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
  });

  // Función para verificar cambios de versión manualmente
  const checkVersionChange = async (): Promise<boolean> => {
    try {
      // Verificar si hay una nueva versión disponible
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const versionData = await response.json();
        const serverVersion = versionData.version;
        
        if (isAdmin) {
          console.log(`[PWA] Version check - Current: ${currentVersion}, Server: ${serverVersion}`);
        }
        
        if (serverVersion !== currentVersion && serverVersion !== lastVersion) {
          setLastVersion(serverVersion);
          return true;
        }
      }
    } catch (error) {
      if (isAdmin) {
        console.warn('[PWA] Error checking version:', error);
      }
    }
    return false;
  };

  const forceCheck = async () => {
    if (isAdmin) {
      console.log('[PWA] Forzando verificación de actualizaciones...');
    }
    
    // Verificar cambios de versión
    const versionChanged = await checkVersionChange();
    if (versionChanged) {
      if (isAdmin) {
        console.log('[PWA] Cambio de versión detectado, actualizando Service Worker...');
      }
    }
    
    // Actualizar Service Worker
    await updateServiceWorker(true);
  };

  useEffect(() => {
    // Check inicial inmediato
    const initialCheck = setTimeout(() => {
      forceCheck();
    }, 1000);

    // Verificaciones regulares
    const interval = setInterval(() => {
      if (isAdmin) {
        console.log('[PWA] Verificación automática de actualizaciones...');
      }
      forceCheck();
    }, CHECK_INTERVAL);

    // Verificaciones más frecuentes si hay una actualización pendiente
    const immediateInterval = needRefresh ? setInterval(() => {
      if (isAdmin) {
        console.log('[PWA] Verificación inmediata (actualización pendiente)...');
      }
      forceCheck();
    }, IMMEDIATE_CHECK_INTERVAL) : null;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : CHECK_INTERVAL / 1000));
    }, 1000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      if (immediateInterval) clearInterval(immediateInterval);
      clearInterval(countdownInterval);
    };
  }, [updateServiceWorker, needRefresh]);

  // Listener para cambios de visibilidad (cuando el usuario vuelve a la pestaña)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAdmin) {
        console.log('[PWA] Pestaña visible, verificando actualizaciones...');
        forceCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (needRefresh && isAdmin) {
      console.log(`[PWA] Actualización crítica detectada para versión ${currentVersion}. Mostrando notificación obligatoria...`);
    }
  }, [needRefresh, isAdmin]);

  const value = { needRefresh, updateServiceWorker, countdown, currentVersion, forceCheck };

  return <PWAUpdateContext.Provider value={value}>{children}</PWAUpdateContext.Provider>;
};

export const usePWAUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (context === undefined) {
    throw new Error('usePWAUpdate must be used within a PWAUpdateProvider');
  }
  return context;
};
