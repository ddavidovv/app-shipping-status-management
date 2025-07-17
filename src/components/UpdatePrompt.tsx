import { useRegisterSW } from 'virtual:pwa-register/react'

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
  })

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
            </div>
            <div className="mt-4 flex gap-3">
                <button
                    type="button"
                    className="w-full rounded-md border border-transparent bg-corporate-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-corporate-dark focus:outline-none"
                    onClick={() => updateServiceWorker(true)}
                >
                    Actualizar
                </button>
                <button
                    type="button"
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                    onClick={() => close()}
                >
                    Ahora no
                </button>
            </div>
        </div>
    )
  }

  return null
}

export default UpdatePrompt
