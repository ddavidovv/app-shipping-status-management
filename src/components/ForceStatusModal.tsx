import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Package, Code, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forceStatusService, getEventTypes } from '../services/forceStatusService';
import { ShippingData, StatusCode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onForceStatus: () => void;
  shippingCode: string;
  shipmentData: ShippingData;
}

interface PackageItem {
  id: string; // Código del bulto (25 dígitos)
  selected: boolean;
  statusCode: string; // Código del estado actual
  statusDescription: string; // Descripción del estado actual
}

interface QuickTimeOption {
  label: string;
  value: number; // minutes after
}

const QUICK_TIME_OPTIONS: QuickTimeOption[] = [
  { label: '+ 15 min', value: 15 },
  { label: '+ 30 min', value: 30 },
  { label: '+ 1 hora', value: 60 },
  { label: '+ 2 horas', value: 120 },
  { label: '+ 4 horas', value: 240 },
];

export default function ForceStatusModal({
  isOpen,
  onClose,
  onForceStatus,
  shippingCode,
  shipmentData
}: Props) {
  // Use ref to avoid state resets during rerenders
  const isInitialized = useRef(false);
  const [targetStatus, setTargetStatus] = useState<StatusCode>('1500');  
  const [actionDatetime, setActionDatetime] = useState('');
  const [hubCode, setHubCode] = useState('HQ001');
  // Estado para rastrear los bultos seleccionados
  const [selectedPackages, setSelectedPackages] = useState<PackageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurl, setShowCurl] = useState(false);

  const [copied, setCopied] = useState(false);
  const [forceSuccess, setForceSuccess] = useState(false);
  
  // Obtener la autenticación para acceder al email del usuario
  const { userEmail } = useAuth();
  // Usar el email del usuario o un valor por defecto
  const userEmailOrDefault = userEmail || 'sistema@ctt.es';
  
  // Obtener la lista de tipos de eventos disponibles
  const eventTypes = getEventTypes();

  // Función para obtener el último estado del envío
  const getLastStatusInfo = () => {
    if (!shipmentData) return { date: new Date(), code: '', description: 'Sin estados previos' };
    
    // Obtener el último estado de cualquier tipo
    const allStatusEvents = shipmentData.shipping_history.events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
      
    if (allStatusEvents.length > 0) {
      const lastEvent = allStatusEvents[0];
      const statusDescription = eventTypes.find(et => et.code === lastEvent.code)?.description || lastEvent.code;
      return { 
        date: new Date(lastEvent.event_date),
        code: lastEvent.code,
        description: statusDescription
      };
    }
    
    return { date: new Date(), code: '', description: 'Sin estados previos' };
  };
  
  // Función auxiliar para obtener solo la fecha
  const getLastStatusDate = () => {
    return getLastStatusInfo().date;
  };
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      isInitialized.current = true;
      
      setForceSuccess(false);
      setError(null);
      setIsSubmitting(false);
      
      // Ya no necesitamos buscar el código de ruta
    } else if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen, shipmentData]);

  // Set default datetime to last status time + 15 minutes when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Obtener la fecha del último estado y añadir 15 minutos
      const lastStatusDate = getLastStatusDate();
      const defaultDate = new Date(lastStatusDate.getTime() + 15 * 60000); // +15 minutos
      
      const localDatetime = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setActionDatetime(localDatetime);
      
      // Valores predeterminados para otros campos
      setHubCode('HQ001');
      
      // Inicializar la lista de bultos seleccionados con su estado actual
      if (shipmentData && shipmentData.items_history) {
        const packages = shipmentData.items_history.map(item => {
          // Obtener el último estado del bulto
          const lastStatusEvent = item.events
            .filter(event => event.type === 'STATUS')
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
          
          const statusCode = lastStatusEvent?.code || '';
          // Obtener la descripción del estado desde la lista de eventTypes
          const statusDescription = eventTypes.find(et => et.code === statusCode)?.description || lastStatusEvent?.description || 'Sin estado';
          
          return {
            id: item.item_code, // código del bulto (25 dígitos)
            selected: true, // Por defecto, todos los bultos están seleccionados
            statusCode,
            statusDescription
          };
        });
        setSelectedPackages(packages);
      }
    }
  }, [isOpen, shipmentData]);

  // Cambiar la selección de un bulto
  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(packages => packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, selected: !pkg.selected } : pkg
    ));
  };

  // Seleccionar o deseleccionar todos los bultos
  const toggleAllPackages = (selected: boolean) => {
    setSelectedPackages(packages => packages.map(pkg => ({ ...pkg, selected })));
  };
  
  // Obtener los bultos seleccionados
  const getSelectedPackages = () => {
    return selectedPackages.filter(pkg => pkg.selected).map(pkg => pkg.id);
  };
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus || !actionDatetime || isSubmitting) return;
    
    // Verificar que hay al menos un bulto seleccionado
    const selectedPackageCodes = getSelectedPackages();
    if (selectedPackageCodes.length === 0) {
      setError('Debe seleccionar al menos un bulto');
      return;
    }
    
    // Verificar que la fecha seleccionada es posterior al último estado
    // Esta verificación es redundante con el atributo min del input, pero la mantenemos como seguridad adicional
    const selectedDate = new Date(actionDatetime);
    const lastStatusDate = getLastStatusDate();
    
    if (selectedDate <= lastStatusDate) {
      setError('La fecha seleccionada debe ser posterior a la fecha del último estado del envío');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setForceSuccess(false);

    try {
      // Convert local datetime to UTC ISO string
      const utcDate = new Date(actionDatetime).toISOString();

      console.log(`Enviando forzado de estado para ${selectedPackages.filter(p => p.selected).length} bultos seleccionados:`, {
        packageCodes: getSelectedPackages(),
        targetStatus,
        utcDate
      });

      // Resultados de las operaciones de forzado para cada bulto
      const results: Array<{packageCode: string, success: boolean, error?: string}> = [];
      let hasErrors = false;
      
      // Para cada bulto seleccionado, enviar una petición para forzar su estado
      for (const packageCode of getSelectedPackages()) {
        try {
          const response = await forceStatusService.forceShipmentStatus(
            packageCode, // Usamos el código del bulto (25 dígitos) en lugar del código de envío
            targetStatus,
            utcDate,
            { hubCode, userEmail: userEmailOrDefault }
          );
          
          results.push({
            packageCode,
            success: response.success,
            error: response.error
          });
          
          if (!response.success) hasErrors = true;
          
        } catch (error) {
          results.push({
            packageCode,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          hasErrors = true;
        }
      }
      
      // Determinar si la operación global fue exitosa
      const allSuccess = !hasErrors;
      
      // Crear una respuesta general
      const response = {
        success: allSuccess,
        error: hasErrors ? `Se produjeron errores en ${results.filter(r => !r.success).length} de ${results.length} bultos` : undefined,
        results
      };

      if (isOpen) { // Only update state if modal is still open
        if (response.success) {
          console.log('✅ Forzado de estado exitoso');
          setForceSuccess(true);
          onForceStatus(); // Notify parent to refresh data but don't close modal
        } else {
          console.error('❌ Forzado de estado fallido:', response.error);
          setError(response.error || 'Error al forzar el estado del envío');
        }
      }
    } catch (err) {
      console.error('💥 Error durante el forzado de estado:', err);
      if (isOpen) {
        setError(err instanceof Error ? err.message : 'Error al forzar el estado del envío');
      }
    } finally {
      console.log('🏁 Proceso de forzado de estado completado');
      if (isOpen) {
        setIsSubmitting(false);
      }
    }
  };

  const getCurlCommand = () => {
    // Obtener el primer bulto seleccionado para generar un ejemplo de comando curl
    const selectedPackageCodes = getSelectedPackages();
    // Si no hay bultos seleccionados, usar el código del envío
    const examplePackageCode = selectedPackageCodes.length > 0 ? selectedPackageCodes[0] : shippingCode;
    
    const curlCommand = forceStatusService.generateCurlCommand(
      examplePackageCode, // Usamos el código del primer bulto seleccionado
      targetStatus,
      actionDatetime ? new Date(actionDatetime).toISOString() : new Date().toISOString(),
      { hubCode, userEmail: userEmailOrDefault }
    );
    return curlCommand;
  };

  const handleCopyClick = () => {
    const curlCommand = getCurlCommand();
    if (curlCommand) {
      navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickTimeSelect = (minutes: number) => {
    // Siempre partir de la fecha del último estado
    const lastStatusDate = getLastStatusDate();
    
    // Añadir los minutos seleccionados directamente a la fecha del último estado
    const targetDate = new Date(lastStatusDate.getTime() + minutes * 60000);
    
    const localDatetime = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setActionDatetime(localDatetime);
  };


  
  // Mostrar campos adicionales para todos los estados
  const renderAdditionalFields = () => {
    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Hub
          </label>
          <input
            type="text"
            value={hubCode}
            onChange={(e) => setHubCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: HQ001, MAD01"
          />
        </div>
        

      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-corporate-primary flex items-center gap-2">
            <Package className="w-5 h-5" />
            Forzar Estado del Envío
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Sección de selección de bultos - Ahora al principio del formulario */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Seleccionar bultos a forzar
              </label>
              <div className="space-x-2">
                <button 
                  type="button" 
                  onClick={() => toggleAllPackages(true)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                >
                  Seleccionar todos
                </button>
                <button 
                  type="button" 
                  onClick={() => toggleAllPackages(false)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  Deseleccionar todos
                </button>
              </div>
            </div>
            
            <div className="divide-y border rounded-md max-h-48 overflow-y-auto p-1 bg-white">
              {selectedPackages.length === 0 ? (
                <div className="py-2 px-3 text-sm text-gray-500 italic">No hay bultos disponibles</div>
              ) : (
                selectedPackages.map((pkg) => (
                  <div key={pkg.id} className="py-2 px-3 flex items-center hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`package-${pkg.id}`}
                      checked={pkg.selected}
                      onChange={() => togglePackageSelection(pkg.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-2 flex flex-col flex-1">
                      <label htmlFor={`package-${pkg.id}`} className="text-sm text-gray-700 cursor-pointer">
                        {pkg.id}
                      </label>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{pkg.statusDescription} ({pkg.statusCode})</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-1 text-xs text-gray-500">
              Seleccionados: {selectedPackages.filter(p => p.selected).length} de {selectedPackages.length} bultos
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado a Forzar
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as StatusCode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {/* Usar la nueva lista de tipos de eventos */}
              {eventTypes.map((eventType) => (
                <option key={eventType.code} value={eventType.code}>
                  {eventType.code} - {eventType.description} ({eventType.force_status_id})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora de la Acción
            </label>
            <div className="mb-1 text-xs text-amber-700">
              {(() => {
                const lastStatus = getLastStatusInfo();
                return (
                  <span>La fecha debe ser posterior al último estado registrado: <strong>{lastStatus.description} ({lastStatus.date.toLocaleString()})</strong></span>
                );
              })()}
            </div>
            <input
              type="datetime-local"
              value={actionDatetime}
              onChange={(e) => setActionDatetime(e.target.value)}
              min={(() => {
                // Convertir la fecha del último estado a formato para el atributo min
                const lastDate = getLastStatusDate();
                // Añadir 1 minuto para asegurar que sea posterior
                const minDate = new Date(lastDate.getTime() + 60000);
                return new Date(minDate.getTime() - minDate.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16);
              })()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="mt-2 flex flex-wrap gap-1">
              {QUICK_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickTimeSelect(option.value)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>



          {renderAdditionalFields()}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {forceSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">Estado forzado correctamente</div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => setShowCurl(!showCurl)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
            >
              <Code className="w-4 h-4" />
              {showCurl ? 'Ocultar cURL' : 'Mostrar cURL'}
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-corporate-primary text-white rounded-md hover:bg-corporate-primary-dark focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Forzar Estado
                  </>
                )}
              </button>
            </div>
          </div>

          {showCurl && (
            <div className="mt-4 p-3 bg-gray-800 text-white rounded-md relative">
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                {getCurlCommand()}
              </pre>
              <button
                type="button"
                onClick={handleCopyClick}
                className="absolute top-3 right-3 p-1 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
