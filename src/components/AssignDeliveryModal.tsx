import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Code, Copy, Check, Clock, AlertCircle, Info, Box, Truck } from 'lucide-react';
import { assignDeliveryService } from '../services/assignDeliveryService';
import { ShippingData } from '../types';
import { STATUS_ACTIONS, STATUS_CODES } from '../config/shippingStatusConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAssign: () => void;
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

export default function AssignDeliveryModal({
  isOpen,
  onClose,
  onAssign,
  shippingCode,
  shipmentData
}: Props) {
  // Use ref to avoid state resets during rerenders
  const isInitialized = useRef(false);
  const [assignDatetime, setAssignDatetime] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      isInitialized.current = true;
      
      // Reset state when modal opens
      setAssignSuccess(false);
      setError(null);
      setIsSubmitting(false);
      
      // Try to get a route code from a previous "En reparto" status if available
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

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔄 Assign Delivery Modal State:', { 
      isOpen, 
      assignSuccess, 
      isSubmitting,
      error: error ? 'has error' : 'no error',
      initialized: isInitialized.current
    });
  }, [isOpen, assignSuccess, isSubmitting, error]);

  // Check if the shipment is in a valid state for assignment
  const isAssignmentAllowed = assignDeliveryService.isAssignmentAllowed(shipmentData);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDatetime || !routeCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setAssignSuccess(false);

    try {
      // Convert local datetime to UTC ISO string
      const utcDate = new Date(assignDatetime).toISOString();

      console.log('📤 Sending assign to delivery request:', {
        shippingCode,
        utcDate,
        routeCode
      });

      const result = await assignDeliveryService.assignToDelivery(
        shippingCode,
        routeCode.trim(),
        utcDate
      );

      if (isOpen) { // Only update state if modal is still open
        if (result.success) {
          console.log('✅ Assignment successful');
          setAssignSuccess(true);
          onAssign(); // Notify parent to refresh data but don't close modal
        } else {
          console.error('❌ Assignment failed:', result.error);
          setError(result.error || 'Error al asignar a reparto');
        }
      }
    } catch (err) {
      console.error('💥 Error during assignment:', err);
      if (isOpen) {
        setError(err instanceof Error ? err.message : 'Error al asignar a reparto');
      }
    } finally {
      console.log('🏁 Assignment process completed');
      if (isOpen) {
        setIsSubmitting(false);
      }
    }
  };

  const getCurlCommand = () => {
    // Ensure UTC ISO string for curl command
    const utcDate = assignDatetime ? new Date(assignDatetime).toISOString() : new Date().toISOString();
    
    return assignDeliveryService.generateCurlCommand(
      shippingCode,
      routeCode.trim(),
      utcDate
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
    
    // Format the date in local time with seconds precision
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    
    // Format as YYYY-MM-DDThh:mm:ss
    const formattedDate = `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
    setAssignDatetime(formattedDate);
  };

  // Safely close the modal
  const handleCloseModal = () => {
    console.log('🚪 Closing assign delivery modal manually');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Asignar a Reparto</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información del estado actual */}
        <div className="mb-4 space-y-2">
          <div className="p-3 rounded-lg bg-gray-50 text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-700 mb-1">
              <Box className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Estado actual del envío</span>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowStatusTooltip(true)}
                  onMouseLeave={() => setShowStatusTooltip(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showStatusTooltip && (
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                    <p className="font-medium mb-1">Estados que permiten asignar a reparto:</p>
                    <ul className="space-y-0.5">
                      {STATUS_ACTIONS.ASSIGNABLE_STATUS_CODES.map((code) => (
                        <li key={code}>{STATUS_CODES[code as keyof typeof STATUS_CODES] || code} ({code})</li>
                      ))}
                    </ul>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              <span className={isAssignmentAllowed ? 'text-green-600' : 'text-gray-600'}>
                {STATUS_CODES[shipmentData.shipping_status_code as keyof typeof STATUS_CODES] || 'Estado desconocido'}
              </span>
              <span className="text-xs text-gray-400">({shipmentData.shipping_status_code})</span>
              {isAssignmentAllowed ? (
                <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Asignable
                </span>
              ) : (
                <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No asignable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {assignSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">¡Asignación registrada correctamente!</p>
              <p className="text-sm">El envío ha sido asignado a reparto.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de ruta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={routeCode}
              onChange={(e) => setRouteCode(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Código de ruta del repartidor"
              required
              disabled={isSubmitting || assignSuccess}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha y hora de asignación <span className="text-red-500">*</span>
            </label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickTimeSelect(option.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting || assignSuccess}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>

            <input
              type="datetime-local"
              value={assignDatetime}
              onChange={(e) => setAssignDatetime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={isSubmitting || assignSuccess}
              step="1"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isAssignmentAllowed && (
            <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>El envío no tiene un estado que permita asignarlo a reparto</span>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowCurl(!showCurl)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              disabled={isSubmitting}
            >
              <Code className="w-4 h-4" />
              {showCurl ? 'Ocultar comando curl (debug)' : 'Mostrar comando curl (debug)'}
            </button>
            
            {showCurl && (
              <div className="mt-2 relative">
                <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{getCurlCommand()}</pre>
                </div>
                <button
                  type="button"
                  onClick={handleCopyClick}
                  className="absolute top-2 right-2 p-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                  title="Copiar al portapapeles"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cerrar
            </button>
            {!assignSuccess && (
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !assignDatetime ||
                  !routeCode.trim() ||
                  !isAssignmentAllowed
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Asignar a Reparto</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
