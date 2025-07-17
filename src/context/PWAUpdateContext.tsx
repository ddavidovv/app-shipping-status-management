import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from './AuthContext';

// Intervalos optimizados para balance rendimiento/detección
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos (reducido de 2)
const VISIBILITY_CHECK_DELAY = 30 * 1000; // 30 segundos después de volver a la pestaña
const INITIAL_CHECK_DELAY = 5 * 1000; // 5 segundos inicial (reducido de 1)
const RETRY_DELAY = 2 * 60 * 1000; // 2 minutos para reintentos

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
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [checkAttempts, setCheckAttempts] = useState(0);
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
      setCheckAttempts(0); // Reset attempts cuando se detecta actualización
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
  });

  // Función optimizada para verificar cambios de versión
  const checkVersionChange = async (): Promise<boolean> => {
    // Evitar checks concurrentes
    if (isChecking) {
      if (isAdmin) console.log('[PWA] Check ya en progreso, saltando...');
      return false;
    }

    // Throttling: no más de un check cada 30 segundos
    const now = Date.now();
    if (now - lastCheckTime < 30000) {
      if (isAdmin) console.log('[PWA] Check muy reciente, saltando...');
      return false;
    }

    setIsChecking(true);
    setLastCheckTime(now);

    try {
      // Usar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch('/version.json?' + now, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const versionData = await response.json();
        const serverVersion = versionData.version;
        
        if (isAdmin) {
          console.log(`[PWA] Version check - Current: ${currentVersion}, Server: ${serverVersion}`);
        }
        
        if (serverVersion !== currentVersion && serverVersion !== lastVersion) {
          setLastVersion(serverVersion);
          setCheckAttempts(0);
          return true;
        }
      }
      
      setCheckAttempts(0); // Reset en caso de éxito
    } catch (error) {
      setCheckAttempts(prev => prev + 1);
      if (isAdmin) {
        console.warn(`[PWA] Error checking version (attempt ${checkAttempts + 1}):`, error.name);
      }
    } finally {
      setIsChecking(false);
    }
    return false;
  };

  const forceCheck = async () => {
    // Limitar reintentos para evitar spam
    if (checkAttempts >= 3) {
      if (isAdmin) {
        console.log('[PWA] Máximo de reintentos alcanzado, esperando...');
      }
      return;
    }

    if (isAdmin) {
      console.log('[PWA] Forzando verificación de actualizaciones...');
    }
    
    // Verificar cambios de versión primero (más rápido)
    const versionChanged = await checkVersionChange();
    if (versionChanged) {
      if (isAdmin) {
        console.log('[PWA] Cambio de versión detectado, actualizando Service Worker...');
      }
      // Solo actualizar SW si hay cambio de versión
      await updateServiceWorker(true);
    } else {
      // Si no hay cambio de versión, check SW menos frecuentemente
      if (checkAttempts === 0) {
        await updateServiceWorker(true);
      }
    }
  };

  useEffect(() => {
    // Check inicial con delay
    const initialCheck = setTimeout(() => {
      forceCheck();
    }, INITIAL_CHECK_DELAY);

    // Verificaciones regulares
    const interval = setInterval(() => {
      if (isAdmin) {
        console.log('[PWA] Verificación automática de actualizaciones...');
      }
      forceCheck();
    }, CHECK_INTERVAL);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : CHECK_INTERVAL / 1000));
    }, 1000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [updateServiceWorker]);

  // Listener optimizado para cambios de visibilidad
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Delay para evitar checks innecesarios en cambios rápidos de pestaña
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (isAdmin) {
            console.log('[PWA] Pestaña visible, verificando actualizaciones...');
          }
          forceCheck();
        }, VISIBILITY_CHECK_DELAY);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(visibilityTimeout);
    };
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
