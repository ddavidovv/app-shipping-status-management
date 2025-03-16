import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Code, 
  AlertCircle, 
  Loader2, 
  Check,
  X
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCancelEvent: (eventId: string, reason: string) => void;
  packageCode?: string;
  packageNumber?: number;
  packages?: Array<{
    itemCode: string;
    packageNumber: number;
    events: any[];
  }>;
  lastResult?: {
    success: boolean;
    message: string;
    packageNumber?: number;
  } | null;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  onCancelEvent,
  packageCode,
  packageNumber: pkgNumber,
  packages = [],
  lastResult
}: Props) {
  const [reason, setReason] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localResult, setLocalResult] = useState<{
    success: boolean;
    message: string;
    packageNumber?: number;
  } | null>(null);
  const [successfulCancellations, setSuccessfulCancellations] = useState<string[]>([]);
  
  // Estado local para el resultado (solo se usa si no hay lastResult)
  
  // Resultado efectivo a mostrar (prioriza lastResult sobre localResult)
  const resultToShow = lastResult || localResult;

  // Usar el número de paquete para mostrar información contextual
  const packageNumberToShow = pkgNumber || 1;
  
  // Efecto para inicializar el estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      console.log('Modal abierto, inicializando estado...');
      
      // Si hay un código de paquete específico, seleccionarlo
      if (packageCode) {
        setSelectedPackage(packageCode);
        fetchCurrentStatus(packageCode);
      } else {
        setSelectedPackage(null);
        setCurrentStatus(null);
      }
    } else {
      // Resetear el estado cuando se cierra el modal
      resetState();
    }
  }, [isOpen, packageCode]);
  
  // Efecto para actualizar el estado cuando cambia lastResult
  useEffect(() => {
    console.log('CancelEventModal - lastResult prop changed:', lastResult);
    
    // Si hay un resultado externo, actualizar el estado local
    if (lastResult && isOpen) {
      // Actualizar la lista de cancelaciones exitosas si es un éxito
      if (lastResult.success && selectedPackage) {
        setSuccessfulCancellations(prev => 
          prev.includes(selectedPackage) ? prev : [...prev, selectedPackage]
        );
      }
    }
  }, [lastResult, isOpen, selectedPackage]);

  // Función para obtener el estado actual del paquete
  const fetchCurrentStatus = async (itemCode: string) => {
    try {
      console.log('Fetching current status for package:', itemCode);
      
      // Intentar obtener el estado actual
      const response = await eventService.getItemStatus(itemCode);
      console.log('Status response received:', response);
      
      if (response && response.current_status) {
        const status = response.current_status;
        console.log('Current status extracted:', status);
        setCurrentStatus(status);
      } else {
        console.error('No current status found in response');
        setCurrentStatus(null);
        // Mostrar un mensaje de error al usuario
        setLocalResult({
          success: false,
          message: 'No se pudo obtener el estado actual del bulto. Intente nuevamente más tarde.'
        });
      }
    } catch (error) {
      console.error('Error fetching current status:', error);
      setCurrentStatus(null);
      
      // Mostrar un mensaje de error más descriptivo al usuario
      let errorMessage = 'Error al obtener el estado actual del bulto';
      
      // Si es un error HTTP, añadir más detalles
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        
        // Si es un error de red o del servidor, dar un mensaje más específico
        if (error.message.includes('500')) {
          errorMessage = 'Error del servidor al obtener el estado. El servidor puede estar temporalmente no disponible.';
        } else if (error.message.includes('404')) {
          errorMessage = 'No se encontró información para este bulto. Verifique el código e intente nuevamente.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'No tiene permisos para acceder a la información de este bulto.';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
        }
      }
      
      // Establecer el resultado de error
      setLocalResult({
        success: false,
        message: errorMessage,
        packageNumber: packageNumberToShow
      });
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOpen) return;
    
    // Validar que se haya seleccionado un paquete y proporcionado una razón
    if (!selectedPackage) {
      setLocalResult({
        success: false,
        message: 'Debes seleccionar un bulto para anular su estado'
      });
      return;
    }
    
    if (!reason.trim()) {
      setLocalResult({
        success: false,
        message: 'Debes proporcionar un motivo para la anulación'
      });
      return;
    }
    
    setIsSubmitting(true);
    setLocalResult(null);
    
    try {
      // Obtener el estado actual del paquete si no lo tenemos
      if (!currentStatus) {
        await fetchCurrentStatus(selectedPackage);
      }
      
      // Verificar si el estado es anulable
      if (currentStatus) {
        // Extraer el código de estado correcto para la verificación
        // El API devuelve status_id que es el nombre completo, pero necesitamos el código
        const statusCode = currentStatus.status_code || currentStatus.status_id;
        console.log('Verificando si el estado es anulable:', { 
          statusId: currentStatus.status_id,
          statusCode,
          isCancellable: isStatusCancellable(statusCode)
        });
        
        if (!isStatusCancellable(statusCode)) {
          setLocalResult({
            success: false,
            message: `El estado "${currentStatus.status_id}" no es anulable`
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('Sending cancellation request:', {
        selectedPackage,
        currentStatus,
        reason,
        packageNumber: packageNumberToShow
      });
      
      // Llamar a la función de anulación
      if (currentStatus) {
        onCancelEvent(currentStatus.status_id, reason);
      }
      
      // No establecemos el resultado aquí, esperamos a que llegue por props
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setLocalResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        packageNumber: packageNumberToShow
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para resetear el estado
  const resetState = () => {
    setReason('');
    setSelectedPackage(null);
    setCurrentStatus(null);
    setIsSubmitting(false);
    setLocalResult(null);
    setSuccessfulCancellations([]);
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Anular estado</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className="p-6">
          {/* Mostrar el resultado si existe */}
          {resultToShow && (
            <div className={`mb-4 p-3 rounded-md ${resultToShow.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-start">
                {resultToShow.success ? (
                  <Check size={20} className="mr-2 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle size={20} className="mr-2 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {resultToShow.success ? 'Operación exitosa' : 'Error'}
                  </p>
                  <p className="text-sm mt-1">
                    {resultToShow.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Formulario de anulación */}
          <form onSubmit={handleSubmit}>
            {/* Selector de paquete */}
            {packages.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center mb-2">
                  <Package size={18} className="mr-2 text-gray-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    Estado de los bultos
                  </label>
                  <div className="ml-1 text-gray-400">
                    <AlertCircle size={16} />
                  </div>
                </div>
                <select
                  value={selectedPackage || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedPackage(value);
                    if (value) {
                      fetchCurrentStatus(value);
                    } else {
                      setCurrentStatus(null);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona un bulto</option>
                  {packages.map((pkg) => (
                    <option 
                      key={pkg.itemCode} 
                      value={pkg.itemCode}
                      disabled={successfulCancellations.includes(pkg.itemCode)}
                    >
                      Bulto {pkg.packageNumber}: {pkg.itemCode}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Mostrar el estado actual si está disponible */}
            {currentStatus && (
              <div className="mb-5 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center mb-1">
                  <div className={`mr-2 ${isStatusCancellable(currentStatus.status_code) ? 'text-amber-500' : 'text-red-500'}`}>
                    {isStatusCancellable(currentStatus.status_code) ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Anulable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        No anulable
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="font-medium">Estado actual: </span>
                  <span className="ml-1">{currentStatus.status_id}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 mt-1">
                  <span className="font-medium">Código: </span>
                  <span className="ml-1">{currentStatus.status_code}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 mt-1">
                  <span className="font-medium">Fecha Estado: </span>
                  <span className="ml-1">{new Date(currentStatus.status_datetime).toLocaleString()}</span>
                </div>
              </div>
            )}
            
            {/* Campo de motivo */}
            <div className="mb-5">
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Motivo de la anulación <span className="text-red-500">*</span>
                </label>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="Indica el motivo de la anulación..."
                disabled={isSubmitting || (currentStatus && !isStatusCancellable(currentStatus.status_code))}
              />
            </div>
            
            {/* Botón para mostrar comando curl (debug) */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => console.log('Debug info')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <Code size={16} className="mr-1" />
                Mostrar comando curl (debug)
              </button>
            </div>
            
            {/* Botones de acción */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 rounded-md text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || !selectedPackage || !reason.trim() || (currentStatus && !isStatusCancellable(currentStatus.status_code))}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Procesando...
                  </span>
                ) : (
                  'Confirmar Anulación'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}