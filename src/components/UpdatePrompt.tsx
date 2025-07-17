import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from "react";

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log(`SW Registered: ${r}`)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[PWA] Checking for new version...');
      updateServiceWorker(true); // El 'true' fuerza la comprobación
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [updateServiceWorker]);

  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] New version detected. Updating automatically...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Nueva versión encontrada</p>
            <p className="mt-1 text-sm text-gray-500">La aplicación se actualizará ahora...</p>
          </div>
        </div>
      </div>
    );
  }

  return null
}

export default UpdatePrompt
