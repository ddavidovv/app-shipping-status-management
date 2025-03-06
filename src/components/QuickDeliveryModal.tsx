import React, { useState } from 'react';
import { X, Loader2, Package, MapPin, Code, Copy, Check, Clock } from 'lucide-react';
import { deliveryService } from '../services/deliveryService';

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
];

export default function QuickDeliveryModal({
  isOpen,
  onClose,
  onDeliver,
  shippingCode,
  isPudoAllowed,
  pudoInfo
}: Props) {
  const [deliveryType, setDeliveryType] = useState<'regular' | 'pudo'>(isPudoAllowed ? 'pudo' : 'regular');
  const [signeeName, setSigneeName] = useState('');
  const [signeeId, setSigneeId] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!signeeName.trim() && deliveryType === 'regular') || !deliveryDateTime || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const signeeInfo = {
        name: deliveryType === 'regular' ? signeeName.trim() : '',
        identifier: deliveryType === 'regular' ? signeeId.trim() : '',
        image_id: ''
      };

      const result = await deliveryService.deliverShipment(
        shippingCode,
        deliveryType === 'pudo',
        signeeInfo,
        new Date(deliveryDateTime).toISOString()
      );

      if (result.success) {
        onDeliver();
        onClose();
      } else {
        setError(result.error || 'Error al realizar la entrega');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al realizar la entrega');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurlCommand = () => {
    const signeeInfo = {
      name: deliveryType === 'regular' ? signeeName.trim() : '',
      identifier: deliveryType === 'regular' ? signeeId.trim() : '',
      image_id: ''
    };
    const datetime = deliveryDateTime || new Date().toISOString();
    
    return deliveryService.generateCurlCommand(
      shippingCode,
      deliveryType === 'pudo',
      signeeInfo,
      datetime
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
    setDeliveryDateTime(date.toISOString().slice(0, 16)); // Format: "YYYY-MM-DDThh:mm"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Entrega Rápida</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  Nombre del receptor
                </label>
                <input
                  type="text"
                  value={signeeName}
                  onChange={(e) => setSigneeName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nombre de quien recibe el envío"
                  required
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha y hora de entrega
            </label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickTimeSelect(option.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>

            <input
              type="datetime-local"
              value={deliveryDateTime}
              onChange={(e) => setDeliveryDateTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
              {error}
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
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!signeeName.trim() && deliveryType === 'regular') || !deliveryDateTime}
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
          </div>
        </form>
      </div>
    </div>
  );
}