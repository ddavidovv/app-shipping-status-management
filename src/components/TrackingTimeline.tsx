import { ShippingEvent } from '../types';
import { Mail, Package, Truck, CheckCircle2, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { useState } from 'react';
import { isStatusCancellable, EVENT_TYPE_ICONS, EVENT_TYPE_DESCRIPTIONS, EVENT_TYPE_COLORS } from '../config/eventConfig';

interface Props {
  events: ShippingEvent[];
  onCancelStatus?: (status: ShippingEvent) => void;
  showNotifications?: boolean;
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
  const Icon = EVENT_TYPE_ICONS[type] || Package;
  return <Icon className={`w-5 h-5 ${EVENT_TYPE_COLORS[type] || 'text-gray-500'}`} />;
};

interface GroupedEvents {
  status: ShippingEvent;
  events: ShippingEvent[];
  dayKey: string;
}

const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function TrackingTimeline({ events, onCancelStatus, showNotifications = true }: Props) {
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(true);

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
    .filter(event => event.type === 'STATUS')
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
        (event.type === 'EVENT' || event.type === 'SHIPPING_ITEM_EVENT_V1') &&
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
    <div className="w-full space-y-1">
      {/* Estados y sus eventos */}
      {groupedEvents.map(({ status, events: packageEvents, dayKey }) => {
        const isCancellable = isStatusCancellable(status.code);
        return (
          <div key={status.event_date} className="space-y-1">
            <div 
              onClick={() => packageEvents.length > 0 && toggleState(status.event_date)}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded border border-gray-200 shadow-sm
                ${packageEvents.length > 0 ? 'cursor-pointer' : ''} 
                ${getBackgroundColor(dayKey, packageEvents.length > 0)} 
                transition-colors duration-150`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getEventIcon(status.type)}
                <span className="text-sm text-gray-600 font-medium w-36 flex-shrink-0">
                  {formatDateTime(status.event_date)}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-corporate-text font-semibold truncate">
                    {status.description}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({status.code})
                  </span>
                  {onCancelStatus && isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelStatus(status);
                      }}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Anular estado"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {packageEvents.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500 font-medium">
                    {packageEvents.length}
                  </span>
                  {expandedStates[status.event_date] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* Eventos del estado */}
            {expandedStates[status.event_date] && packageEvents.length > 0 && (
              <div className="ml-8 space-y-1">
                {packageEvents.map((event, index) => (
                  <div 
                    key={`${status.event_date}-${index}`} 
                    className={`flex items-center gap-3 px-3 py-1.5 rounded border border-gray-200 shadow-sm
                      ${getEventBackgroundColor(dayKey)}`}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      {getEventIcon(event.type)}
                      <span className="text-sm text-gray-600 font-medium w-36 flex-shrink-0">
                        {formatDateTime(event.event_date)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 truncate">
                            {event.description}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-600'} bg-opacity-10`}>
                            {EVENT_TYPE_DESCRIPTIONS[event.type] || 'Evento'}
                          </span>
                        </div>
                        {event.detail?.event_text && (
                          <span className="text-sm text-gray-600 block truncate">
                            ({event.detail.event_text})
                          </span>
                        )}
                        {event.detail?.signee_name && event.detail.signee_name !== 'null' && (
                          <span className="text-sm text-gray-600 block truncate">
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
      {showNotifications && notifications.length > 0 && (
        <>
          <button 
            onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
            className="w-full flex items-center gap-3 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex items-center gap-3 flex-1">
              {getEventIcon('NOTIFICATION_V1')}
              <span className="text-sm text-corporate-text font-semibold">
                Notificaciones
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500 font-medium">
                {notifications.length}
              </span>
              {showNotificationsPanel ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>

          {/* Lista de notificaciones */}
          {showNotificationsPanel && (
            <div className="ml-8 space-y-1">
              {notifications.map((notification, index) => {
                const dayKey = formatDateKey(new Date(notification.event_date));
                return (
                  <div 
                    key={`notification-${index}`}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded border border-gray-200 shadow-sm
                      ${getEventBackgroundColor(dayKey)}`}
                  >
                    {getEventIcon(notification.type)}
                    <span className="text-sm text-gray-600 font-medium w-36 flex-shrink-0">
                      {formatDateTime(notification.event_date)}
                    </span>
                    <span className="text-sm text-gray-900 truncate">
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