import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EVENT_TEMPLATES } from '../config/eventTemplates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (event: any) => void;
  packageCode: string;
  defaultUserCode?: string;
  defaultPlatformCode?: string;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onCreateEvent,
  packageCode,
  defaultUserCode = "urn:com:cttexpress:interchange:source:hub-actions",
  defaultPlatformCode = "008290"
}: Props) {
  const [selectedEventType, setSelectedEventType] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const template = EVENT_TEMPLATES.find(t => t.event_type_code === selectedEventType);
    if (!template) return;

    const now = new Date().toISOString();
    const event = {
      metadata: {
        correlation_id: crypto.randomUUID(),
        ...template.template.metadata,
        interchange_id: crypto.randomUUID(),
        timestamp: now
      },
      package_event: {
        ...template.template.package_event,
        audit: {
          ...template.template.package_event.audit,
          action_datetime: now,
          user_code: defaultUserCode
        },
        event_datetime: new Date(eventDateTime).toISOString(),
        event_info: template.template.package_event.event_info.map(info => ({
          ...info,
          reading_id: packageCode,
          platform_code: defaultPlatformCode
        })),
        package_code: packageCode,
        gps_location: null
      }
    };

    onCreateEvent(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Crear Evento Manual</h2>
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
              Tipo de Evento
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Selecciona un tipo de evento</option>
              {EVENT_TEMPLATES.map(template => (
                <option key={template.event_type_code} value={template.event_type_code}>
                  {template.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora del Evento
            </label>
            <input
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Código de Usuario:</span>
              <span className="text-gray-900">{defaultUserCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Código de Plataforma:</span>
              <span className="text-gray-900">{defaultPlatformCode}</span>
            </div>
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
              Crear Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}