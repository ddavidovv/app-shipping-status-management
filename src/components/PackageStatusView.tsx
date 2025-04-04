import { useState, useEffect, useRef } from 'react';
import { ItemStatusResponse, Package } from '../types';
import { eventService } from '../services/eventService';
import { getStatusDescription } from '../config/shippingStatusConfig';
import { Loader2, Box, AlertCircle, RefreshCw, Info, ChevronDown, ChevronRight, AlertTriangle, Clock, User, Calendar } from 'lucide-react';

interface Props {
  packages: Package[];
}

export default function PackageStatusView({ packages }: Props) {
  const [packageStatuses, setPackageStatuses] = useState<Record<string, ItemStatusResponse | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});
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

  // Función para obtener el estado de un bulto específico
  const fetchPackageStatus = async (itemCode: string) => {
    setLoading(prev => ({ ...prev, [itemCode]: true }));
    setError(prev => ({ ...prev, [itemCode]: null }));
    
    try {
      const status = await eventService.getItemStatus(itemCode);
      setPackageStatuses(prev => ({ ...prev, [itemCode]: status }));
      
      // Inicializar las secciones expandidas para este paquete
      setExpandedSections(prev => {
        const packageSections = prev[itemCode] || {};
        return {
          ...prev,
          [itemCode]: {
            ...packageSections,
            statusTracking: packageSections.statusTracking !== undefined ? packageSections.statusTracking : true,
            transitionErrors: packageSections.transitionErrors !== undefined ? packageSections.transitionErrors : true
          }
        };
      });
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        [itemCode]: err instanceof Error ? err.message : 'Error desconocido al obtener el estado' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [itemCode]: false }));
    }
  };

  // Cargar estados al montar el componente
  useEffect(() => {
    packages.forEach(pkg => {
      fetchPackageStatus(pkg.item_code);
    });
  }, [packages]);

  const handleRefresh = (itemCode: string) => {
    setRefreshing(prev => ({ ...prev, [itemCode]: true }));
    
    fetchPackageStatus(itemCode).finally(() => {
      setRefreshing(prev => ({ ...prev, [itemCode]: false }));
    });
  };

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case '2100': // Entregado
        return 'bg-green-100 text-green-800 border-green-200';
      case '1500': // En reparto
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '1600': // Reparto fallido
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '3000': // Anulado
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleSection = (itemCode: string, section: string) => {
    setExpandedSections(prev => {
      const packageSections = prev[itemCode] || {};
      return {
        ...prev,
        [itemCode]: {
          ...packageSections,
          [section]: !packageSections[section]
        }
      };
    });
  };

  const isSectionExpanded = (itemCode: string, section: string) => {
    return expandedSections[itemCode]?.[section] || false;
  };

  const hasCancellationInfo = (trackingStatus: any) => {
    return trackingStatus?.cancellation_info !== null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado actual de los bultos</h2>
      
      {packages.length === 0 ? (
        <div className="text-center py-8">
          <Box className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">No hay bultos para mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.item_code} className="border rounded-lg shadow-sm overflow-hidden">
              {/* Cabecera del bulto */}
              <div className={`px-4 py-3 flex justify-between items-center border-b ${getStatusColor(packageStatuses[pkg.item_code]?.current_status?.status_code || '')}`}>
                <div>
                  <h3 className="font-medium">{pkg.item_code}</h3>
                  <p className="text-sm">
                    {packageStatuses[pkg.item_code]?.current_status?.status_code 
                      ? `${packageStatuses[pkg.item_code]?.current_status?.status_code} - ${getStatusDescription(packageStatuses[pkg.item_code]?.current_status?.status_code || '')}`
                      : 'Estado desconocido'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Ícono de información */}
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowTooltip(pkg.item_code)}
                      onMouseLeave={() => setShowTooltip(null)}
                      className="p-1.5 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Información sobre el estado"
                      title="Información sobre actualización de estados"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    
                    {showTooltip === pkg.item_code && (
                      <div 
                        ref={tooltipRef}
                        className="absolute right-0 top-8 z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm"
                      >
                        <div className="flex gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <p className="font-medium text-gray-900">Información sobre los estados</p>
                        </div>
                        <p className="text-gray-600 mb-2">
                          Este es el estado más actualizado del bulto según nuestros sistemas.
                        </p>
                        <p className="text-gray-600">
                          Para ver el historial completo, consulte la opción "Bitácora".
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRefresh(pkg.item_code)}
                    disabled={loading[pkg.item_code]}
                    className="p-2 rounded-full hover:bg-gray-200/50 transition-colors"
                    title="Refrescar estado"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing[pkg.item_code] ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Contenido del bulto */}
              <div className="p-4">
                {loading[pkg.item_code] ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    <span className="ml-2 text-gray-500">Cargando estado...</span>
                  </div>
                ) : error[pkg.item_code] ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error[pkg.item_code]}</p>
                  </div>
                ) : packageStatuses[pkg.item_code] ? (
                  <div className="space-y-4">
                    {/* Información principal del estado */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Fecha de estado</p>
                            <p className="text-sm font-medium">{formatDate(packageStatuses[pkg.item_code]?.current_status?.status_datetime || '')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Fecha de procesamiento</p>
                            <p className="text-sm font-medium">{formatDate(packageStatuses[pkg.item_code]?.current_status?.processed_datetime || '')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Historial de estado (status_tracking) */}
                    <div className="mt-4 border-t pt-3 border-gray-100">
                      <button 
                        onClick={() => toggleSection(pkg.item_code, 'statusTracking')}
                        className="flex items-center justify-between w-full py-2 text-left"
                      >
                        <span className="font-medium text-gray-700 flex items-center">
                          {isSectionExpanded(pkg.item_code, 'statusTracking') ? 
                            <ChevronDown className="w-4 h-4 mr-1" /> : 
                            <ChevronRight className="w-4 h-4 mr-1" />
                          }
                          Historial de estados
                        </span>
                        <span className="text-sm text-gray-500">
                          {packageStatuses[pkg.item_code]?.status_tracking?.length || 0} estados
                        </span>
                      </button>
                      
                      {isSectionExpanded(pkg.item_code, 'statusTracking') && (
                        <div className="mt-2 space-y-3">
                          {packageStatuses[pkg.item_code]?.status_tracking?.map((tracking, index) => (
                            <div 
                              key={`${tracking.id}-${index}`} 
                              className={`p-3 rounded-md border ${hasCancellationInfo(tracking) ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {tracking.id} ({tracking.code}) - {getStatusDescription(tracking.code)}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <p>Fecha del evento: {formatDate(tracking.event.datetime)}</p>
                                    <p>Procesado: {formatDate(tracking.added_datetime)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Información de cancelación */}
                              {tracking.cancellation_info && (
                                <div className="mt-2 pt-2 border-t border-amber-200">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-amber-800">Estado cancelado</p>
                                      <p className="text-xs text-amber-700">
                                        Cancelado el {formatDate(tracking.cancellation_info.datetime)} por {tracking.cancellation_info.user}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Errores de transición (status_transition_errors) */}
                    {packageStatuses[pkg.item_code]?.status_transition_errors && 
                     packageStatuses[pkg.item_code]?.status_transition_errors.length > 0 && (
                      <div className="mt-4 border-t pt-3 border-gray-100">
                        <button 
                          onClick={() => toggleSection(pkg.item_code, 'transitionErrors')}
                          className="flex items-center justify-between w-full py-2 text-left"
                        >
                          <span className="font-medium text-gray-700 flex items-center">
                            {isSectionExpanded(pkg.item_code, 'transitionErrors') ? 
                              <ChevronDown className="w-4 h-4 mr-1" /> : 
                              <ChevronRight className="w-4 h-4 mr-1" />
                            }
                            Errores de transición
                          </span>
                          <span className="text-sm text-gray-500">
                            {packageStatuses[pkg.item_code]?.status_transition_errors?.length || 0} errores
                          </span>
                        </button>
                        
                        {isSectionExpanded(pkg.item_code, 'transitionErrors') && (
                          <div className="mt-2 space-y-3">
                            {packageStatuses[pkg.item_code]?.status_transition_errors?.map((error, index) => (
                              <div 
                                key={index} 
                                className="p-3 rounded-md border border-red-200 bg-red-50"
                              >
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-red-800">{error.error_code || 'Error de transición'}</p>
                                    <p className="text-xs text-red-700">{error.error_message}</p>
                                    {error.datetime && <p className="text-xs text-red-700 mt-1">Fecha: {formatDate(error.datetime)}</p>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Información de auditoría */}
                    <div className="mt-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <p>Creado: {formatDate(packageStatuses[pkg.item_code]?.audit?.created_datetime || '')} por {packageStatuses[pkg.item_code]?.audit?.created_by}</p>
                      <p>Modificado: {formatDate(packageStatuses[pkg.item_code]?.audit?.modified_datetime || '')} por {packageStatuses[pkg.item_code]?.audit?.modified_by}</p>
                      <p>Versión: {packageStatuses[pkg.item_code]?.version}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay información disponible</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
