import React, { useState, useEffect } from 'react';
import { X, Code, Copy, Check, Loader2, AlertCircle, Box } from 'lucide-react';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCancelEvent: (eventId: string, reason: string) => void;
  eventDescription: string;
  eventCode?: string;
  eventDate?: string;
  packageCode?: string;
  packageNumber?: number;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  onCancelEvent,
  eventDescription,
  eventCode = '',
  eventDate = '',
  packageCode = '',
  packageNumber = 0
}: Props) {
  const { userEmail } = useAuth();
  const [reason, setReason] = useState('');
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setReason('');
      setShowCurl(false);
      setCopied(false);
      setIsSubmitting(false);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await eventService.cancelStatus(
        packageCode || '', // Código del bulto para la URL
        eventDate, 
        reason,
        eventDescription // Descripción del estado para el payload
      );
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Estado anulado correctamente'
        });
        // Wait a moment before closing to show success message
        setTimeout(() => {
          onCancelEvent(eventDescription, reason.trim());
        }, 1500);
      } else {
        setResult({
          success: false,
          message: response.error || 'Error al anular el estado'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al anular el estado'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const curlCommand = eventService.generateCurlCommand(
    packageCode || '', // Código del bulto para la URL
    eventDate,
    eventDescription // Descripción del estado para el payload
  );

  const handleCopyClick = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Anular Evento</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento a anular
            </label>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {eventDescription} <span className="text-xs text-gray-400">({eventCode})</span>
            </p>
          </div>

          {packageCode && (
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
              <Box className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-blue-800">
                <span className="font-medium">Bulto {packageNumber || ''}:</span> {packageCode}
              </div>
            </div>
          )}

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
              placeholder="Explica el motivo de la anulación..."
              disabled={isSubmitting}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p>La anulación se registrará a nombre de: <strong>{userEmail || 'Usuario no identificado'}</strong></p>
          </div>

          {result && (
            <div className={`p-3 rounded-md text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <p>{result.message}</p>
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
                  <pre className="whitespace-pre-wrap">{curlCommand}</pre>
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
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-900 rounded-md hover:bg-red-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Anular Evento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}