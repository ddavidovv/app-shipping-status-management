import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from "react";

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
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

  const close = () => {
    setNeedRefresh(false)
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">¡Actualización disponible!</p>
            <p className="mt-1 text-sm text-gray-500">Hay una nueva versión de la aplicación. Recarga para ver los cambios.</p>
          </div>
          <div className="mt-4 flex flex-shrink-0 sm:mt-0 sm:ml-4">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => updateServiceWorker(true)}
            >
              Actualizar
            </button>
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={close}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null
}

export default UpdatePrompt
