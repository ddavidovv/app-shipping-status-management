import { ShippingEvent } from '../types';
import { Package, ChevronDown, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { EVENT_TYPE_ICONS, EVENT_TYPE_COLORS } from '../config/eventConfig';

interface Props {
  events: ShippingEvent[];
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
  const Icon = EVENT_TYPE_ICONS[type as keyof typeof EVENT_TYPE_ICONS] || Package;
  return <Icon className={`w-5 h-5 ${EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || 'text-gray-500'}`} />;
};

interface GroupedEvents {
  status: ShippingEvent;
  events: ShippingEvent[];
  dayKey: string;
}

const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function TrackingTimeline({ events, showNotifications = true }: Props) {
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [expandedManagements, setExpandedManagements] = useState<Record<string, boolean>>({});
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(true);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleState = (statusDate: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [statusDate]: !prev[statusDate]
    }));
  };

  const toggleManagement = (managementDate: string) => {
    setExpandedManagements(prev => ({
      ...prev,
      [managementDate]: !prev[managementDate]
    }));
  };

  // Separar notificaciones y estados
  const notifications = events
    .filter(event => event.type === 'NOTIFICATION_V1')
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Filtrar y ordenar los estados y gestiones
  const statusAndManagementEvents = events
    .filter(event => event.type === 'STATUS' || event.type === 'MANAGEMENTS')
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Obtener días únicos ordenados
  const uniqueDays = [...new Set(events.map(event => formatDateKey(new Date(event.event_date))))]
    .sort((a, b) => b.localeCompare(a));

  // Filtrar solo los eventos de tipo STATUS (no gestiones)
  const statusEvents = statusAndManagementEvents
    .filter(event => event.type === 'STATUS')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()); // Ordenar de más antiguo a más reciente
  
  // Filtrar eventos que no son ni estados ni gestiones ni notificaciones
  const packageEventsUnsorted = events.filter(event => 
    (event.type === 'EVENT' || event.type === 'SHIPPING_ITEM_EVENT_V1')
  );
  
  // Ordenar los eventos por fecha
  const packageEventsSorted = [...packageEventsUnsorted].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  // Crear un mapa para agrupar eventos por estado
  const eventGroupsByStatus: Record<string, ShippingEvent[]> = {};
  
  // Inicializar el mapa con arrays vacíos para cada estado
  statusEvents.forEach(status => {
    eventGroupsByStatus[status.event_date] = [];
  });
  
  // Asignar cada evento al estado correspondiente
  packageEventsSorted.forEach(event => {
    const eventTime = new Date(event.event_date).getTime();
    
    // Encontrar el estado más reciente que precede o coincide con este evento
    let assignedStatus = null;
    
    // Iterar por los estados (que ya están ordenados de más antiguo a más reciente)
    for (let i = 0; i < statusEvents.length; i++) {
      const statusTime = new Date(statusEvents[i].event_date).getTime();
      
      // Si el estado es anterior o igual al evento, es candidato
      if (statusTime <= eventTime) {
        assignedStatus = statusEvents[i];
      } 
      // Si el estado es posterior al evento, dejamos de buscar
      else {
        break;
      }
    }
    
    // Si se encontró un estado al que asignar el evento
    if (assignedStatus) {
      eventGroupsByStatus[assignedStatus.event_date].push(event);
    }
  });
  
  // Crear el array de eventos agrupados
  const groupedEvents: GroupedEvents[] = [];
  
  // Añadir los estados con sus eventos
  statusEvents.forEach(statusEvent => {
    const events = eventGroupsByStatus[statusEvent.event_date];
    
    groupedEvents.push({
      status: statusEvent,
      // Ordenar eventos de más reciente a más antiguo para mostrar
      events: events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()),
      dayKey: formatDateKey(new Date(statusEvent.event_date))
    });
  });
  
  // Añadir las gestiones al grupo de eventos
  statusAndManagementEvents
    .filter(event => event.type === 'MANAGEMENTS')
    .forEach(managementEvent => {
      groupedEvents.push({
        status: managementEvent,
        events: [], // Las gestiones no tienen eventos asociados
        dayKey: formatDateKey(new Date(managementEvent.event_date))
      });
    });
  
  // Ordenar todos los eventos agrupados por fecha (más reciente primero)
  groupedEvents.sort((a, b) => 
    new Date(b.status.event_date).getTime() - new Date(a.status.event_date).getTime()
  );

  useEffect(() => {
    const initialExpandedStates: Record<string, boolean> = {};
    
    // Inicializar todos los estados como no expandidos
    groupedEvents.forEach(({ status }) => {
      initialExpandedStates[status.event_date] = false;
    });
    
    setExpandedStates(initialExpandedStates);
  }, [events]);

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

  // Determinar si un estado es el último (más reciente)
  const isLatestStatus = (event: ShippingEvent): boolean => {
    return event.type === 'STATUS' && event.event_date === statusAndManagementEvents.filter(e => e.type === 'STATUS')[0]?.event_date;
  };

  return (
    <div className="space-y-4">
      {/* Estados, gestiones y sus eventos */}
      {groupedEvents.map(({ status, events: packageEvents, dayKey }) => {
        const isLatest = isLatestStatus(status);
        const isManagement = status.type === 'MANAGEMENTS';
        
        return (
          <div key={status.event_date} className="space-y-1">
            <div 
              onClick={() => {
                if (isManagement) {
                  toggleManagement(status.event_date);
                } else if (packageEvents.length > 0) {
                  toggleState(status.event_date);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded border ${isManagement ? 'border-indigo-200' : 'border-gray-200'} shadow-sm
                ${(packageEvents.length > 0 || isManagement) ? 'cursor-pointer' : ''} 
                ${getBackgroundColor(dayKey, packageEvents.length > 0 || isManagement)} 
                ${isLatest ? 'border-green-300' : ''}
                ${isManagement ? 'border-l-4 border-l-indigo-400' : ''}
                transition-colors duration-150`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getEventIcon(status.type)}
                <span className="text-sm text-gray-600 font-medium w-36 flex-shrink-0">
                  {formatDateTime(status.event_date)}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm ${isManagement ? 'text-indigo-700' : 'text-corporate-text'} font-semibold truncate`}>
                    {status.description}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({status.code})
                  </span>
                  {isLatest && !isManagement && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Último estado
                    </span>
                  )}
                  {isManagement && status.detail?.case_action_type_name && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {status.detail.case_action_type_name}
                    </span>
                  )}
                </div>
              </div>
              {packageEvents.length > 0 && !isManagement && (
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
              {isManagement && (
                <div className="flex items-center">
                  {expandedManagements[status.event_date] ? (
                    <ChevronDown className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              )}
              {/* Ícono de información solo en el último estado */}
              {isLatest && (
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(dayKey)}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="p-1.5 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Información sobre el estado"
                    title="Información sobre actualización de estados"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  
                  {showTooltip === dayKey && (
                    <div 
                      ref={tooltipRef}
                      className="absolute right-0 top-8 z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm"
                    >
                      <div className="flex gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="font-medium text-gray-900">Información sobre los estados</p>
                      </div>
                      <p className="text-gray-600 mb-2">
                        La información de esta bitácora podría no reflejar el estado más reciente de los bultos.
                      </p>
                      <p className="text-gray-600">
                        Para consultar el estado actual en tiempo real, utilice la opción "Estado de Bultos".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Eventos del estado */}
            {expandedStates[status.event_date] && packageEvents.length > 0 && !isManagement && (
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
                          {event.code === 'SORTER_READ_EVENT' && event.detail && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {event.detail.hub_code} · {event.detail.sorter_code}
                            </span>
                          )}
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

            {/* Detalles de la gestión */}
            {isManagement && expandedManagements[status.event_date] && status.detail && (
              <div className="ml-8 space-y-1">
                <div className="bg-indigo-50/50 rounded border border-indigo-100 p-3 text-sm">
                  <h4 className="font-medium text-indigo-800 mb-2">Detalles de la gestión</h4>
                  
                  {status.detail.contact_name && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Punto de recogida:</span> {status.detail.contact_name}
                    </div>
                  )}
                  
                  {status.detail.recipient_address && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Dirección:</span> {status.detail.recipient_address}
                      {status.detail.recipient_address_2 && (
                        <span>, {status.detail.recipient_address_2}</span>
                      )}
                    </div>
                  )}
                  
                  {status.detail.recipient_postal_code && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Código postal:</span> {status.detail.recipient_postal_code}
                    </div>
                  )}
                  
                  {status.detail.recipient_name && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Destinatario:</span> {status.detail.recipient_name}
                    </div>
                  )}
                  
                  {status.detail.recipient_phones && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Teléfono:</span> {status.detail.recipient_phones}
                    </div>
                  )}
                  
                  {status.detail.user_type && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Tipo de usuario:</span> {status.detail.user_type}
                    </div>
                  )}
                  
                  {status.detail.case_action_datetime && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Fecha de acción:</span> {formatDateTime(status.detail.case_action_datetime)}
                    </div>
                  )}
                  
                  {status.detail.collection_point_code && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Código de punto:</span> {status.detail.collection_point_code}
                    </div>
                  )}
                  
                  {status.detail.collection_point_provider_code && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Proveedor:</span> {status.detail.collection_point_provider_code}
                    </div>
                  )}
                  
                  {status.detail.incident_type_code && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Código de incidencia:</span> {status.detail.incident_type_code}
                    </div>
                  )}
                  
                  {status.detail.collection_point_latitude_gps && status.detail.collection_point_longitude_gps && (
                    <div>
                      <span className="font-medium text-gray-700">Ubicación GPS:</span> {status.detail.collection_point_latitude_gps}, {status.detail.collection_point_longitude_gps}
                    </div>
                  )}
                </div>
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