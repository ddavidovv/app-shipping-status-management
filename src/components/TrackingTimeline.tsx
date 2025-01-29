import { ShippingEvent } from '../types';
import { Mail, Package, Truck, CheckCircle2, ChevronDown, ChevronRight, Eraser } from 'lucide-react';
import { useState } from 'react';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  events: ShippingEvent[];
  onCancelStatus?: (status: ShippingEvent) => void;
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'NOTIFICATION_V1':
      return <Mail className="w-5 h-5 text-corporate-primary" />;
    case 'SHIPPING_ITEM_EVENT_V1':
      return <Truck className="w-5 h-5 text-corporate-primary" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-corporate-primary" />;
  }
};

interface GroupedEvents {
  status: ShippingEvent;
  events: ShippingEvent[];
  dayKey: string;
}

const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function TrackingTimeline({ events, onCancelStatus }: Props) {
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [showNotifications, setShowNotifications] = useState(true);

  const toggleState = (statusDate: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [statusDate]: !prev[statusDate]
    }));
  };

  // Separar notificaciones y estados
  const notifications = events
    .filter(event => event.type === 'NOTIFICATION_V1')
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Filtrar y ordenar los estados
  const statusEvents = events
    .filter(event => event.type === 'ITEM_STATUS_V2')
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Obtener días únicos ordenados
  const uniqueDays = [...new Set(events.map(event => formatDateKey(new Date(event.event_date))))]
    .sort((a, b) => b.localeCompare(a));

  // Agrupar eventos de envío por estado
  const groupedEvents: GroupedEvents[] = statusEvents.map((status, index) => {
    const nextStatus = statusEvents[index + 1];
    const currentStatusDate = new Date(status.event_date).getTime();
    const nextStatusDate = nextStatus 
      ? new Date(nextStatus.event_date).getTime() 
      : 0;

    // Filtrar eventos de envío entre estados
    const packageEvents = events.filter(event => {
      const eventDate = new Date(event.event_date).getTime();
      return (
        event.type === 'SHIPPING_ITEM_EVENT_V1' &&
        eventDate <= currentStatusDate &&
        (nextStatusDate === 0 || eventDate > nextStatusDate)
      );
    }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return {
      status,
      events: packageEvents,
      dayKey: formatDateKey(new Date(status.event_date))
    };
  });

  const getBackgroundColor = (dayKey: string, isHoverable: boolean) => {
    const dayIndex = uniqueDays.indexOf(dayKey) % 2;
    const baseColors = {
      0: 'bg-white hover:bg-gray-50',
      1: 'bg-blue-50/40 hover:bg-blue-50/60'
    };
    const staticColors = {
      0: 'bg-white',
      1: 'bg-blue-50/40'
    };
    return isHoverable ? baseColors[dayIndex as keyof typeof baseColors] : staticColors[dayIndex as keyof typeof staticColors];
  };

  const getEventBackgroundColor = (dayKey: string) => {
    const dayIndex = uniqueDays.indexOf(dayKey) % 2;
    return dayIndex === 0 ? 'bg-gray-50/80' : 'bg-blue-50/30';
  };

  return (
    <div className="w-full space-y-2">
      {/* Estados y sus eventos */}
      {groupedEvents.map(({ status, events: packageEvents, dayKey }) => {
        const isCancellable = isStatusCancellable(status.code);
        return (
          <div key={status.event_date} className="space-y-1">
            <div 
              onClick={() => packageEvents.length > 0 && toggleState(status.event_date)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded border border-gray-200 shadow-sm
                ${packageEvents.length > 0 ? 'cursor-pointer' : ''} 
                ${getBackgroundColor(dayKey, packageEvents.length > 0)} 
                transition-colors duration-150`}
            >
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle2 className="w-5 h-5 text-corporate-primary flex-shrink-0" />
                <span className="text-sm text-gray-600 font-medium min-w-44">
                  {formatDateTime(status.event_date)}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm text-corporate-text font-semibold">
                    {status.description}
                  </span>
                  <span className="text-xs text-gray-500">
                    Estado: {status.code}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onCancelStatus && isCancellable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelStatus(status);
                    }}
                    className="p-1 text-gray-400 hover:text-corporate-text transition-colors"
                    title="Anular estado"
                  >
                    <Eraser className="w-5 h-5" />
                  </button>
                )}
                {packageEvents.length > 0 && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="text-xs">
                      {packageEvents.length} {packageEvents.length === 1 ? 'evento' : 'eventos'}
                    </span>
                    {expandedStates[status.event_date] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Eventos del estado */}
            {expandedStates[status.event_date] && packageEvents.length > 0 && (
              <div className="ml-8 space-y-1">
                {packageEvents.map((event, index) => (
                  <div 
                    key={`${status.event_date}-${index}`} 
                    className={`flex items-center gap-3 px-3 py-2 rounded border border-gray-200 shadow-sm
                      ${getEventBackgroundColor(dayKey)}`}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <Truck className="w-5 h-5 text-corporate-primary" />
                      <span className="text-sm text-gray-600 font-medium min-w-44">
                        {formatDateTime(event.event_date)}
                      </span>
                      <div>
                        <span className="text-sm text-gray-900">
                          {event.description}
                        </span>
                        {event.detail?.event_text && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({event.detail.event_text})
                          </span>
                        )}
                        {event.detail?.signee_name && event.detail.signee_name !== 'null' && (
                          <span className="text-sm text-gray-600 ml-2">
                            (Firmado por: {event.detail.signee_name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Sección de notificaciones */}
      {notifications.length > 0 && (
        <>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center gap-3 bg-white px-3 py-2 rounded border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex items-center gap-3 flex-1">
              <Mail className="w-5 h-5 text-corporate-primary flex-shrink-0" />
              <span className="text-sm text-corporate-text font-semibold">
                Notificaciones
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-xs">
                {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
              </span>
              {showNotifications ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Lista de notificaciones */}
          {showNotifications && (
            <div className="ml-8 space-y-1">
              {notifications.map((notification, index) => {
                const dayKey = formatDateKey(new Date(notification.event_date));
                return (
                  <div 
                    key={`notification-${index}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded border border-gray-200 shadow-sm
                      ${getEventBackgroundColor(dayKey)}`}
                  >
                    <Mail className="w-5 h-5 text-corporate-primary" />
                    <span className="text-sm text-gray-600 font-medium min-w-44">
                      {formatDateTime(notification.event_date)}
                    </span>
                    <span className="text-sm text-gray-900">
                      {notification.description}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}