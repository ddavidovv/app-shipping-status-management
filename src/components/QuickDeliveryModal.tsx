import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Package, MapPin, Code, Copy, Check, Clock, AlertCircle, Info, Box } from 'lucide-react';
import { deliveryService } from '../services/deliveryService';
import { StatusCode, ShippingData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeliver: () => void;
  shippingCode: string;
  isPudoAllowed: boolean;
  pudoInfo?: {
    providerCode: string;
    organicPointCode: string;
  } | null;
  currentStatus: StatusCode;
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

const ALLOWED_STATUS_CODES = {
  '1500': 'En reparto',
  '1600': 'Reparto fallido',
  '1200': 'Delegación destino',
  '0900': 'En tránsito'
} as const;

export default function QuickDeliveryModal({
  isOpen,
  onClose,
  onDeliver,
  shippingCode,
  isPudoAllowed,
  pudoInfo,
  currentStatus,
  shipmentData
}: Props) {
  // Use ref to avoid state resets during rerenders
  const isInitialized = useRef(false);
  const [deliveryType, setDeliveryType] = useState<'regular' | 'pudo'>(isPudoAllowed ? 'pudo' : 'regular');
  const [signeeName, setSigneeName] = useState('');
  const [signeeId, setSigneeId] = useState('');
  const [deliveryDatetime, setDeliveryDatetime] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // Obtener el routeCode del último estado "En reparto"
  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      isInitialized.current = true;
      
      // Reset state when modal opens
      setDeliverySuccess(false);
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

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔄 Delivery Modal State:', { 
      isOpen, 
      deliverySuccess, 
      isSubmitting,
      error: error ? 'has error' : 'no error',
      initialized: isInitialized.current
    });
  }, [isOpen, deliverySuccess, isSubmitting, error]);

  // Check if any package is in a valid state for delivery
  const hasDeliverablePackage = shipmentData.items_history.some(item => {
    const lastStatus = item.events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    return lastStatus && lastStatus.code in ALLOWED_STATUS_CODES;
  });

  // Get last status for each package
  const packageStatuses = shipmentData.items_history.map(item => {
    const lastStatus = item.events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    return {
      itemCode: item.item_code,
      status: lastStatus?.description || 'Sin estado',
      statusCode: lastStatus?.code || '',
      allowsDelivery: lastStatus?.code in ALLOWED_STATUS_CODES
    };
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!signeeName.trim() && deliveryType === 'regular') || !deliveryDatetime || !routeCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setDeliverySuccess(false);

    try {
      const signeeInfo = {
        name: deliveryType === 'regular' ? signeeName.trim() : '',
        identifier: deliveryType === 'regular' ? signeeId.trim() : '',
        image_id: ''
      };

      // Convert local datetime to UTC ISO string
      const utcDate = new Date(deliveryDatetime).toISOString();

      console.log('📤 Sending delivery request:', {
        shippingCode,
        deliveryType,
        utcDate,
        routeCode
      });

      const result = await deliveryService.deliverShipment(
        shippingCode,
        deliveryType === 'pudo',
        signeeInfo,
        utcDate,
        routeCode.trim()
      );

      if (isOpen) { // Only update state if modal is still open
        if (result.success) {
          console.log('✅ Delivery successful');
          setDeliverySuccess(true);
          onDeliver(); // Notify parent to refresh data but don't close modal
        } else {
          console.error('❌ Delivery failed:', result.error);
          setError(result.error || 'Error al realizar la entrega');
        }
      }
    } catch (err) {
      console.error('💥 Error during delivery:', err);
      if (isOpen) {
        setError(err instanceof Error ? err.message : 'Error al realizar la entrega');
      }
    } finally {
      console.log('🏁 Delivery process completed');
      if (isOpen) {
        setIsSubmitting(false);
      }
    }
  };

  const getCurlCommand = () => {
    const signeeInfo = {
      name: deliveryType === 'regular' ? signeeName.trim() : '',
      identifier: deliveryType === 'regular' ? signeeId.trim() : '',
      image_id: ''
    };
    
    // Ensure UTC ISO string for curl command
    const utcDate = deliveryDatetime ? new Date(deliveryDatetime).toISOString() : new Date().toISOString();
    
    return deliveryService.generateCurlCommand(
      shippingCode,
      deliveryType === 'pudo',
      signeeInfo,
      utcDate,
      routeCode.trim()
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
    setDeliveryDatetime(formattedDate);
  };

  // Safely close the modal
  const handleCloseModal = () => {
    console.log('🚪 Closing delivery modal manually');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Entrega manual</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información de bultos */}
        <div className="mb-4 space-y-2">
          {/* Resumen de estados de bultos */}
          {packageStatuses.length > 0 && (
            <div className="p-3 rounded-lg bg-gray-50 text-sm space-y-2">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <Box className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Estado de los bultos</span>
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
                      <p className="font-medium mb-1">Estados que permiten entrega:</p>
                      <ul className="space-y-0.5">
                        {Object.entries(ALLOWED_STATUS_CODES).map(([code, name]) => (
                          <li key={code}>{name} ({code})</li>
                        ))}
                      </ul>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {packageStatuses.map((pkg, index) => (
                  <div key={pkg.itemCode} className="flex items-center gap-2">
                    <span className={`font-medium ${pkg.allowsDelivery ? 'text-green-600' : 'text-gray-600'}`}>
                      Bulto {index + 1}:
                    </span>
                    <span className={pkg.allowsDelivery ? 'text-green-600' : 'text-gray-600'}>
                      {pkg.status}
                    </span>
                    <span className="text-xs text-gray-400">({pkg.statusCode})</span>
                    {pkg.allowsDelivery && (
                      <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Entregable
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de éxito */}
        {deliverySuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">¡Entrega registrada correctamente!</p>
              <p className="text-sm">El envío ha sido marcado como entregado.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isPudoAllowed && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de entrega
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pudo')}
                    disabled={isSubmitting || deliverySuccess}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors
                      ${deliveryType === 'pudo'
                        ? 'bg-corporate-primary text-white border-corporate-primary'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Entrega en PUDO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('regular')}
                    disabled={isSubmitting || deliverySuccess}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors
                      ${deliveryType === 'regular'
                        ? 'bg-corporate-primary text-white border-corporate-primary'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Entrega a particular</span>
                  </button>
                </div>
              </div>

              {deliveryType === 'pudo' && pudoInfo && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                  <h3 className="text-sm font-medium text-blue-800">Información del punto PUDO</h3>
                  <p className="text-sm text-blue-600">
                    Proveedor: <span className="font-medium">{pudoInfo.providerCode}</span>
                  </p>
                  <p className="text-sm text-blue-600">
                    Código del punto: <span className="font-medium">{pudoInfo.organicPointCode}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {deliveryType === 'regular' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del receptor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signeeName}
                  onChange={(e) => setSigneeName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nombre de quien recibe el envío"
                  required
                  disabled={isSubmitting || deliverySuccess}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identificador (DNI, etc.)
                </label>
                <input
                  type="text"
                  value={signeeId}
                  onChange={(e) => setSigneeId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Opcional"
                  disabled={isSubmitting || deliverySuccess}
                />
              </div>
            </>
          )}

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
              disabled={isSubmitting || deliverySuccess}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha y hora de entrega <span className="text-red-500">*</span>
            </label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickTimeSelect(option.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting || deliverySuccess}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>

            <input
              type="datetime-local"
              value={deliveryDatetime}
              onChange={(e) => setDeliveryDatetime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={isSubmitting || deliverySuccess}
              step="1"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!hasDeliverablePackage && (
            <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Ningún bulto tiene un estado que permita la entrega</span>
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
            {!deliverySuccess && (
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  (!signeeName.trim() && deliveryType === 'regular') || 
                  !deliveryDatetime ||
                  !routeCode.trim() ||
                  !hasDeliverablePackage
                }
                className="px-4 py-2 text-sm font-medium text-white bg-red-900 rounded-md hover:bg-red-800 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Confirmar Entrega</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}