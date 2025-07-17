import { useState, useEffect } from 'react';
import { usePWAUpdate } from '../context/PWAUpdateContext';
import { CloudCog, X, RefreshCw, Clock, CheckCircle } from 'lucide-react';

function UpdatePrompt() {
  const { needRefresh, updateServiceWorker } = usePWAUpdate();
  const [updateState, setUpdateState] = useState<'available' | 'updating' | 'dismissed'>('available');
  const [countdown, setCountdown] = useState(30); // 30 segundos para decidir
  const [showDetails, setShowDetails] = useState(false);

  // Countdown para actualización automática
  useEffect(() => {
    if (needRefresh && updateState === 'available') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [needRefresh, updateState]);

  const handleUpdate = async () => {
    setUpdateState('updating');
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Error updating app:', error);
      setUpdateState('available');
    }
  };

  const handleDismiss = () => {
    setUpdateState('dismissed');
  };

  const handlePostpone = () => {
    setUpdateState('dismissed');
    // Volver a mostrar en 5 minutos
    setTimeout(() => {
      if (needRefresh) {
        setUpdateState('available');
        setCountdown(30);
      }
    }, 5 * 60 * 1000);
  };

  if (!needRefresh || updateState === 'dismissed') {
    return null;
  }

  if (updateState === 'updating') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div className="mb-6">
            <CloudCog className="h-16 w-16 mx-auto text-corporate-primary animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Actualizando aplicación
          </h2>
          <p className="text-gray-600 mb-4">
            Aplicando la nueva versión. La página se recargará automáticamente.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">●</div>
            <span>No cierres esta ventana</span>
            <div className="animate-pulse">●</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden toast-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-primary to-red-700 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span className="font-semibold">Nueva versión disponible</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 text-sm mb-4">
            Hay mejoras y correcciones disponibles para la aplicación.
          </p>

          {/* Countdown */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Actualización automática en {countdown}s
              </span>
            </div>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-corporate-primary hover:text-red-800 mb-3 flex items-center space-x-1"
          >
            <span>{showDetails ? 'Ocultar' : 'Ver'} detalles</span>
          </button>

          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
              <ul className="space-y-1">
                <li>• Mejoras en el rendimiento</li>
                <li>• Corrección de errores menores</li>
                <li>• Nuevas funcionalidades</li>
                <li>• Actualizaciones de seguridad</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-corporate-primary text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar ahora</span>
            </button>
            <button
              onClick={handlePostpone}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdatePrompt;