import { useState, useEffect } from 'react';
import { usePWAUpdate } from '../context/PWAUpdateContext';
import { CloudCog, RefreshCw, Clock, Shield, Zap, Bug, Star, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

// Configuración del mensaje de actualización
const UPDATE_CONFIG = {
  title: "Actualización requerida",
  subtitle: "Mejoras críticas disponibles",
  description: "Esta actualización incluye mejoras de seguridad importantes y debe aplicarse para continuar usando la aplicación.",
  successTitle: "¡Actualización completada!",
  successMessage: "La aplicación se ha actualizado correctamente",
  versionPrefix: "Versión", // Se mostrará como "Versión 1.0.8"
  benefits: [
    {
      icon: Shield,
      title: "Seguridad",
      description: "Parches críticos de seguridad",
      color: "text-red-600"
    },
    {
      icon: Zap,
      title: "Rendimiento",
      description: "Mejoras en velocidad y estabilidad",
      color: "text-blue-600"
    },
    {
      icon: Bug,
      title: "Correcciones",
      description: "Solución de errores reportados",
      color: "text-green-600"
    },
    {
      icon: Star,
      title: "Funcionalidades",
      description: "Nuevas herramientas disponibles",
      color: "text-purple-600"
    }
  ],
  updateButtonText: "Actualizar ahora",
  footerText: "La actualización es obligatoria por motivos de seguridad"
};
function UpdatePrompt() {
// Componente para el mensaje de éxito efímero
function UpdateSuccessToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Se oculta después de 4 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm">
      <div className="bg-green-50 border-2 border-green-200 rounded-xl shadow-lg p-4 toast-in">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800">
              {UPDATE_CONFIG.successTitle}
            </h3>
            <p className="text-xs text-green-700 mt-1">
              {UPDATE_CONFIG.successMessage}
            </p>
            <p className="text-xs text-green-600 mt-1 font-mono">
              {UPDATE_CONFIG.versionPrefix} {import.meta.env.VITE_APP_VERSION}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
  const { needRefresh, updateServiceWorker } = usePWAUpdate();
  const [updateState, setUpdateState] = useState<'grace-period' | 'final-warning' | 'updating'>('grace-period');
  const [countdown, setCountdown] = useState(60); // 60 segundos de gracia
  const [finalCountdown, setFinalCountdown] = useState(10); // 10 segundos finales
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Mostrar mensaje de éxito cuando la página se recarga después de una actualización
  useEffect(() => {
    // Verificar si venimos de una actualización
    const wasUpdating = sessionStorage.getItem('app-updating');
    if (wasUpdating) {
      sessionStorage.removeItem('app-updating');
      // Pequeño delay para que la página termine de cargar
      setTimeout(() => {
        setShowSuccessToast(true);
      }, 500);
    }
  }, []);
  // Countdown principal (60 segundos de gracia)
  useEffect(() => {
    if (needRefresh && updateState === 'grace-period') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setUpdateState('final-warning');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [needRefresh, updateState]);

  // Countdown final (10 segundos)
  useEffect(() => {
    if (updateState === 'final-warning') {
      const timer = setInterval(() => {
        setFinalCountdown(prev => {
          if (prev <= 1) {
            handleUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [updateState]);

  const handleUpdate = async () => {
    setUpdateState('updating');
    // Marcar que estamos actualizando para mostrar el mensaje de éxito después
    sessionStorage.setItem('app-updating', 'true');
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Error updating app:', error);
      // En caso de error, reintentamos después de 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const handleUpdateNow = () => {
    handleUpdate();
  };

  // Mostrar toast de éxito si corresponde
  if (showSuccessToast) {
    return <UpdateSuccessToast onClose={() => setShowSuccessToast(false)} />;
  }

  if (!needRefresh) {
    return null;
  }

  // Estado de actualización en progreso
  if (updateState === 'updating') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div className="mb-6">
            <div className="relative">
              <CloudCog className="h-20 w-20 mx-auto text-corporate-primary animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-corporate-primary animate-spin" />
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Actualizando aplicación
          </h2>
          <p className="text-gray-600 mb-6">
            Aplicando mejoras de seguridad y nuevas funcionalidades. 
            <br />La página se recargará automáticamente.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="font-medium">No cierres esta ventana</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Advertencia final (10 segundos)
  if (updateState === 'final-warning') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border-4 border-amber-400">
          <div className="mb-6">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{finalCountdown}</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Actualización obligatoria
          </h2>
          <p className="text-gray-700 mb-6">
            La aplicación se actualizará automáticamente en <strong>{finalCountdown} segundos</strong> por razones de seguridad y compatibilidad.
          </p>
          <button
            onClick={handleUpdateNow}
            className="w-full bg-corporate-primary text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors text-lg font-semibold flex items-center justify-center space-x-2 mb-4"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar ahora</span>
          </button>
          <p className="text-xs text-gray-500">
            Esta actualización incluye mejoras críticas de seguridad
          </p>
        </div>
      </div>
    );
  }

  // Período de gracia inicial (60 segundos)
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-corporate-primary/20 overflow-hidden toast-in">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-corporate-primary to-red-700 px-5 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{UPDATE_CONFIG.title}</h3>
              <p className="text-white/90 text-sm">{UPDATE_CONFIG.subtitle}</p>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isCollapsed ? "Expandir notificación" : "Colapsar notificación"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Content - Solo se muestra si no está colapsado */}
        {!isCollapsed && (
          <div className="p-5">
            <p className="text-gray-700 text-sm mb-4">
              {UPDATE_CONFIG.description}
            </p>

            {/* Countdown prominente - Una sola línea */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Clock className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold whitespace-nowrap">Actualización automática en:</span>
                </div>
                <div className="text-2xl font-bold text-amber-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Beneficios de la actualización */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-corporate-primary hover:text-red-800 mb-4 flex items-center space-x-1 font-medium"
            >
              <span>{showDetails ? 'Ocultar' : 'Ver'} qué incluye esta actualización</span>
            </button>

            {showDetails && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <div className="space-y-3">
                  {UPDATE_CONFIG.benefits.map((benefit, index) => {
                    const IconComponent = benefit.icon;
                    return (
                      <div key={index} className="flex items-start space-x-2">
                        <IconComponent className={`h-4 w-4 ${benefit.color} mt-0.5 flex-shrink-0`} />
                        <span className="text-gray-700">
                          <strong>{benefit.title}:</strong> {benefit.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleUpdateNow}
              className="w-full bg-corporate-primary text-white px-6 py-3 rounded-xl hover:bg-red-800 transition-all duration-200 text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{UPDATE_CONFIG.updateButtonText}</span>
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              {UPDATE_CONFIG.footerText}
            </p>
          </div>
        )}

        {/* Versión colapsada - Solo muestra countdown */}
        {isCollapsed && (
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Actualización en:</span>
              <div className="text-lg font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdatePrompt;