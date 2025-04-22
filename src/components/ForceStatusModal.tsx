import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Package, Code, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { forceStatusService } from '../services/forceStatusService';
import { ShippingData, StatusCode } from '../types';
import { STATUS_CODES } from '../config/shippingStatusConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onForceStatus: () => void;
  shippingCode: string;
  shipmentData: ShippingData;
}

interface QuickTimeOption {
  label: string;
  value: number; // minutes ago
}

const QUICK_TIME_OPTIONS: QuickTimeOption[] = [
  { label: 'Hace 15 min', value: 15 },
  { label: 'Hace 30 min', value: 30 },
  { label: 'Hace 1 hora', value: 60 },
  { label: 'Hace 2 horas', value: 120 },
  { label: 'Hace 4 horas', value: 240 },
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
  const [routeCode, setRouteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forceSuccess, setForceSuccess] = useState(false);
  // Almacena la información adicional basada en el estado seleccionado
  const [additionalInfo] = useState<{[key: string]: string}>({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      isInitialized.current = true;
      
      setForceSuccess(false);
      setError(null);
      setIsSubmitting(false);
      
      if (shipmentData) {
        const lastDeliveryStatus = shipmentData.shipping_history.events
          .filter(event => event.type === 'STATUS' && event.code === '1500')
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

        if (lastDeliveryStatus?.detail?.event_courier_code) {
          setRouteCode(lastDeliveryStatus.detail.event_courier_code);
        }
      }
    } else if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen, shipmentData]);

  // Set default datetime to current time when the modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setActionDatetime(localDatetime);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus || !actionDatetime || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setForceSuccess(false);

    try {
      // Prepare additional information based on the target status
      const additionalData: {[key: string]: string | number | boolean} = {...additionalInfo};
      
      // Add route code if present (only for certain statuses)
      if (routeCode && (targetStatus === '1500' || targetStatus === '1600')) {
        additionalData.routeCode = routeCode.trim();
      }

      // Convert local datetime to UTC ISO string
      const utcDate = new Date(actionDatetime).toISOString();

      console.log('📤 Enviando solicitud de forzado de estado:', {
        shippingCode,
        targetStatus,
        utcDate,
        additionalData
      });

      const result = await forceStatusService.forceShipmentStatus(
        shippingCode,
        targetStatus,
        utcDate,
        additionalData
      );

      if (isOpen) { // Only update state if modal is still open
        if (result.success) {
          console.log('✅ Forzado de estado exitoso');
          setForceSuccess(true);
          onForceStatus(); // Notify parent to refresh data but don't close modal
        } else {
          console.error('❌ Forzado de estado fallido:', result.error);
          setError(result.error || 'Error al forzar el estado del envío');
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
    const additionalData: {[key: string]: string | number | boolean} = {...additionalInfo};
    
    if (routeCode && (targetStatus === '1500' || targetStatus === '1600')) {
      additionalData.routeCode = routeCode.trim();
    }
    
    // Ensure UTC ISO string for curl command
    const utcDate = actionDatetime ? new Date(actionDatetime).toISOString() : new Date().toISOString();
    
    return forceStatusService.generateCurlCommand(
      shippingCode,
      targetStatus,
      utcDate,
      additionalData
    );
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
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setActionDatetime(localDatetime);
  };

  // Show additional fields based on the selected status
  const renderAdditionalFields = () => {
    switch (targetStatus) {
      case '1500': // En reparto
      case '1600': // Reparto fallido
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Ruta
            </label>
            <input
              type="text"
              value={routeCode}
              onChange={(e) => setRouteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: R123, RUTA456"
            />
          </div>
        );
      // Aquí se pueden añadir más casos para otros estados que requieran información adicional
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Forzar Estado de Envío</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem-4rem)]">
          {/* Shipping code display */}
          <div className="flex items-center justify-center mb-4 text-lg font-semibold bg-gray-50 p-2 rounded">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            <span>{shippingCode}</span>
          </div>

          {forceSuccess ? (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center text-green-700">
                <Check className="h-5 w-5 mr-2" />
                <span>Estado forzado correctamente</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                El envío ha sido actualizado al nuevo estado.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Status selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Estado
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as StatusCode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(STATUS_CODES).map(([code, description]) => (
                    <option key={code} value={code}>
                      {code} - {description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional fields based on status */}
              {renderAdditionalFields()}

              {/* Date and time */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha y hora de la acción
                  </label>
                  <div className="flex space-x-1">
                    {QUICK_TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleQuickTimeSelect(option.value)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={actionDatetime}
                  onChange={(e) => setActionDatetime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Error</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setShowCurl(!showCurl)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Code className="h-4 w-4 mr-2" />
                  {showCurl ? 'Ocultar cURL' : 'Mostrar cURL'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Forzar Estado'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* CURL command */}
          {showCurl && (
            <div className="mt-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Comando cURL
                  </h4>
                  <button
                    onClick={handleCopyClick}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                  {getCurlCommand()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
