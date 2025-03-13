import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Package, Code, Copy, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCancelEvent: () => void;
  eventDescription: string;
  eventCode: string;
  eventDate: string;
  packageCode?: string;
  packageNumber?: number;
  packages?: Array<{
    itemCode: string;
    packageNumber: number;
    events: any[];
  }>;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  onCancelEvent,
  eventDescription,
  eventCode,
  eventDate,
  packageCode,
  packageNumber,
  packages = []
}: Props) {
  const didMount = useRef(false);
  const { userEmail } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    packageNumber?: number;
  } | null>(null);
  const [successfulCancellations, setSuccessfulCancellations] = useState<string[]>([]);
  
  // Importante: Esto evita reset indeseados del estado interno durante rerenders
  const initialized = useRef(false);
  
  // Reset state only when modal is initially opened (not on every render)
  useEffect(() => {
    if (isOpen && !initialized.current) {
      console.log('🔓 Modal opened, initializing state...', { isOpen });
      setReason('');
      setIsSubmitting(false);
      setShowCurl(false);
      setCopied(false);
      setSelectedPackage(null);
      setCurrentStatus(null);
      setResult(null);
      setSuccessfulCancellations([]);
      initialized.current = true;
    } else if (!isOpen) {
      // Solo reseteamos la bandera cuando el modal está cerrado
      initialized.current = false;
    }
  }, [isOpen]);

  // Debug: Log state changes
  useEffect(() => {
    if (didMount.current) {
      console.log('🔄 Modal State Changed:', {
        isOpen, 
        isSubmitting, 
        selectedPackage, 
        successfulCancellations: Array.isArray(successfulCancellations) ? successfulCancellations.length : 0, 
        result: result?.success,
        initialized: initialized.current
      });
    } else {
      didMount.current = true;
    }
  }, [isOpen, isSubmitting, selectedPackage, successfulCancellations, result]);

  // Función segura para cerrar el modal
  const handleCloseModal = () => {
    console.log('🚪 Closing modal manually...');
    onClose();
  };

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  // Get cancellable packages
  const cancellablePackages = packages.map(pkg => {
    const lastStatus = pkg.events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

    return {
      ...pkg,
      lastStatus,
      isCancellable: lastStatus && isStatusCancellable(lastStatus.code)
    };
  }).filter(pkg => pkg.isCancellable);

  const handlePackageSelect = (itemCode: string) => {
    console.log('📦 Package selected:', itemCode);
    const pkg = cancellablePackages.find(p => p.itemCode === itemCode);
    if (pkg) {
      setSelectedPackage(itemCode);
      setCurrentStatus({
        status_id: pkg.lastStatus.description,
        status_code: pkg.lastStatus.code,
        status_datetime: pkg.lastStatus.event_date
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Submit started...');

    if (!reason.trim() || isSubmitting || !currentStatus || !selectedPackage) {
      console.log('❌ Submit validation failed:', {
        hasReason: Boolean(reason.trim()),
        isSubmitting,
        hasCurrentStatus: Boolean(currentStatus),
        hasSelectedPackage: Boolean(selectedPackage)
      });
      return;
    }
    
    // Double check if status is cancellable
    if (!isStatusCancellable(currentStatus.status_code)) {
      console.log('⚠️ Status not cancellable:', currentStatus.status_code);
      setResult({
        success: false,
        message: 'Este estado no puede ser anulado'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('📤 Sending cancellation request:', {
        selectedPackage,
        currentStatus,
        reason
      });
      
      const response = await eventService.cancelStatus(
        selectedPackage,
        currentStatus.status_datetime,
        reason,
        currentStatus.status_id
      );
      
      console.log('📥 Cancellation response received:', response);
      
      if (response.success) {
        console.log('✅ Cancellation successful');
        const packageInfo = packages.find(p => p.itemCode === selectedPackage);
        
        // Importante: Actualizamos el array con una nueva referencia para evitar problemas de renderizado
        const newSuccessfulCancellations = [...successfulCancellations, selectedPackage];
        setSuccessfulCancellations(newSuccessfulCancellations);
        
        setResult({
          success: true,
          message: 'Estado anulado correctamente',
          packageNumber: packageInfo?.packageNumber
        });
        
        // Clear form for next cancellation
        setReason('');
        setSelectedPackage(null);
        setCurrentStatus(null);
        
        // Importante: Notificar al padre pero prevenir que cierre el modal
        console.log('📣 Notifying parent of cancellation success');
        onCancelEvent();
      } else {
        console.log('❌ Cancellation failed:', response.error);
        setResult({
          success: false,
          message: response.error || 'Error al anular el estado'
        });
      }
    } catch (error) {
      console.error('💥 Error during cancellation:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al anular el estado'
      });
    } finally {
      console.log('🏁 Cancellation process completed, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleCopyClick = () => {
    if (!currentStatus || !selectedPackage) return;

    const curlCommand = eventService.generateCurlCommand(
      selectedPackage,
      currentStatus.status_datetime,
      currentStatus.status_id
    );

    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Anular Estado</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mostrar resultados exitosos */}
        {successfulCancellations.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4" />
              <span className="font-medium">Estados anulados correctamente:</span>
            </div>
            <ul className="space-y-1">
              {successfulCancellations.map(itemCode => {
                const pkg = packages.find(p => p.itemCode === itemCode);
                return (
                  <li key={itemCode} className="text-sm">
                    Bulto {pkg?.packageNumber} ({itemCode})
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Selector de bulto */}
        {cancellablePackages.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el bulto a anular
            </label>
            <div className="space-y-2">
              {cancellablePackages.map((pkg) => {
                const isSelected = selectedPackage === pkg.itemCode;
                const isAlreadyCancelled = successfulCancellations.includes(pkg.itemCode);
                
                if (isAlreadyCancelled) return null;

                return (
                  <button
                    key={pkg.itemCode}
                    type="button"
                    onClick={() => handlePackageSelect(pkg.itemCode)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                      ${isSelected 
                        ? 'bg-red-50 border-red-200 text-red-900' 
                        : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`}
                  >
                    <Package className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Bulto {pkg.packageNumber}</div>
                      <div className="text-sm text-gray-500">{pkg.lastStatus.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedPackage && currentStatus && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-red-50 rounded-lg space-y-1">
              <div className="text-sm text-red-800">
                <span className="font-medium">Estado a anular:</span>{' '}
                {currentStatus.status_id} ({currentStatus.status_code})
              </div>
              <div className="text-sm text-red-800">
                <span className="font-medium">Fecha:</span>{' '}
                {new Date(currentStatus.status_datetime).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la anulación
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                required
                disabled={isSubmitting}
                placeholder="Explica el motivo de la anulación..."
              />
            </div>

            {userEmail && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  La anulación se registrará a nombre de:{' '}
                  <span className="font-medium">{userEmail}</span>
                </p>
              </div>
            )}

            {result && (
              <div className={`p-3 rounded-lg ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{result.message}</span>
                </div>
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
                    <pre className="whitespace-pre-wrap">
                      {eventService.generateCurlCommand(
                        selectedPackage,
                        currentStatus.status_datetime,
                        currentStatus.status_id
                      )}
                    </pre>
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Anular Estado</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}