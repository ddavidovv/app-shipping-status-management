import React, { useState } from 'react';
import { X, Code, Copy, Check } from 'lucide-react';
import { eventService } from '../services/eventService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCancelEvent: (eventId: string, reason: string) => void;
  eventDescription: string;
  eventCode?: string;
  eventDate?: string;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  onCancelEvent,
  eventDescription,
  eventCode = '',
  eventDate = ''
}: Props) {
  const [reason, setReason] = useState('');
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    onCancelEvent(eventDescription, reason.trim());
    onClose();
  };

  const curlCommand = eventService.generateCurlCommand(eventCode, eventDate);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Anular Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
              {eventDescription}
            </p>
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
              placeholder="Explica el motivo de la anulación..."
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCurl(!showCurl)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Code className="w-4 h-4" />
              {showCurl ? 'Ocultar comando curl' : 'Mostrar comando curl (debug)'}
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
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-900 rounded-md hover:bg-red-800"
            >
              Anular Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}