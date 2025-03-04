import React, { useState } from 'react';
import { Search, Loader2, Upload, XCircle, AlertCircle } from 'lucide-react';
import { ShippingData, ShippingEvent, ViewMode, Package, ItemHistory } from './types';
import TrackingTimeline from './components/TrackingTimeline';
import ShipmentDetails from './components/ShipmentDetails';
import Header from './components/Header';
import CreateEventModal from './components/CreateEventModal';
import CancelEventModal from './components/CancelEventModal';
import ViewModeSelector from './components/ViewModeSelector';
import PackagesList from './components/PackagesList';
import PackagesComparison from './components/PackagesComparison';
import BulkSearchResults from './components/BulkSearchResults';
import { eventService } from './services/eventService';
import { useAuth } from './context/AuthContext';

interface BulkSearchResult {
  trackingNumber: string;
  data: ShippingData | null;
  error?: string;
  loading: boolean;
}

function App() {
  const { isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('shipping');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [cancelEventData, setCancelEventData] = useState<{
    event: ShippingEvent;
    isOpen: boolean;
    packageCode?: string;
    packageNumber?: number;
  }>({ event: null, isOpen: false });
  const [bulkResults, setBulkResults] = useState<BulkSearchResult[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [bulkSearchError, setBulkSearchError] = useState<string | null>(null);

  // Manejo del cierre de la ventana
  const handleClose = () => {
    try {
      // Intentar cerrar usando window.close()
      window.close();
      
      // Si window.close() no funcionó (la ventana sigue abierta), intentar redirigir
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = 'about:blank';
          window.close();
        }
      }, 100);
    } catch (e) {
      console.error('Error al cerrar la ventana:', e);
      // Como último recurso, redirigir a about:blank
      window.location.href = 'about:blank';
    }
  };

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-corporate-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si hay error de autenticación, mostrar error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de autenticación</h2>
            <p className="text-gray-600 mb-6">{authError}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar ventana
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 text-corporate-primary bg-white border border-corporate-primary rounded-lg hover:bg-red-50 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No autenticado</h2>
          <p className="text-gray-600 mb-6">
            Esta aplicación debe abrirse desde la aplicación principal.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar ventana
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 text-corporate-primary bg-white border border-corporate-primary rounded-lg hover:bg-red-50 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const transformToPackages = (data: ShippingData): Package[] => {
    if (!data.items_history || data.items_history.length === 0) {
      return [];
    }
    return data.items_history.map((item, index) => ({
      item_code: item.item_code,
      events: item.events,
      package_number: index + 1
    }));
  };

  const fetchShipment = async (tracking: string): Promise<ShippingData> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${import.meta.env.VITE_API_ENDPOINT}/${tracking}?view=OPERATIONS&showItems=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': import.meta.env.VITE_JWT_TOKEN,
        'client_secret': import.meta.env.VITE_CLIENT_SECRET,
        'client_id': import.meta.env.VITE_CLIENT_ID
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.item_history_info?.data) {
      throw new Error('No se encontró historial para este envío');
    }

    const historyData = result.item_history_info.data;

    if (!historyData.items_history) {
      historyData.items_history = [];
    }

    return {
      ...historyData,
      redis_info: result.redis_info || {}
    };
  };

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setBulkSearchError(null);

    const trackingNumbers = trackingNumber
      .split(/[\n,\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Verificar el límite de 1000 envíos
    if (trackingNumbers.length > 1000) {
      setBulkSearchError(`Has excedido el límite de 1000 envíos para búsqueda masiva. Actualmente tienes ${trackingNumbers.length} envíos.`);
      return;
    }

    if (trackingNumbers.length > 1) {
      setBulkResults(trackingNumbers.map(t => ({
        trackingNumber: t,
        data: null,
        loading: true
      })));
      setShipmentData(null);
      setError('');

      const searches = trackingNumbers.map(async (t) => {
        try {
          const data = await fetchShipment(t);
          setBulkResults(prev => prev.map(r => 
            r.trackingNumber === t 
              ? { trackingNumber: t, data, loading: false }
              : r
          ));
          return { trackingNumber: t, data, loading: false };
        } catch (err) {
          setBulkResults(prev => prev.map(r => 
            r.trackingNumber === t 
              ? { trackingNumber: t, data: null, error: err.message, loading: false }
              : r
          ));
          return { trackingNumber: t, data: null, error: err.message, loading: false };
        }
      });

      await Promise.all(searches);
    } else {
      setBulkResults([]);
      setSelectedTracking(null);
      setLoading(true);
      setError('');
      
      try {
        const data = await fetchShipment(trackingNumber);
        setShipmentData(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error al buscar el envío');
        setShipmentData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleBulkSelect = (tracking: string) => {
    setSelectedTracking(tracking);
    const result = bulkResults.find(r => r.trackingNumber === tracking);
    if (result?.data) {
      setShipmentData(result.data);
      setError('');
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await eventService.createEvent(eventData);
      if (result.success) {
        await handleSearch();
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Error al crear el evento');
    }
  };

  const handleCancelStatus = async (status: ShippingEvent, packageCode?: string, packageNumber?: number) => {
    setCancelEventData({ 
      event: status, 
      isOpen: true,
      packageCode,
      packageNumber
    });
  };

  const submitCancelEvent = async (eventId: string, reason: string) => {
    try {
      if (!shipmentData || !cancelEventData.event) return;

      // Usamos el packageCode que viene directamente del evento de cancelación
      const itemCode = cancelEventData.packageCode || '';
      
      // Extraer el nombre del estado de la descripción
      // Por ejemplo, de "En reparto" extraemos "DELIVERY"
      const getStatusName = (description: string): string => {
        // Mapeo de descripciones a nombres de estado
        const statusMap: Record<string, string> = {
          'En reparto': 'DELIVERY',
          'Reparto fallido': 'DELIVERY_FAILED',
          'Entregado': 'DELIVERED',
          'Depositado en PUDO': 'DELIVERED_PUDO',
          'Delegación destino': 'DESTINATION_BRANCH',
          'En tránsito': 'IN_TRANSIT'
        };
        
        // Buscar coincidencia exacta
        for (const [desc, name] of Object.entries(statusMap)) {
          if (description.includes(desc)) {
            return name;
          }
        }
        
        // Si no hay coincidencia, usar la descripción como fallback
        return description;
      };
      
      const statusName = getStatusName(cancelEventData.event.description);

      const result = await eventService.cancelStatus(
        itemCode,
        cancelEventData.event.event_date,
        reason,
        statusName // Nombre del estado para el payload
      );

      if (result.success) {
        await handleSearch();
      } else {
        setError(result.error || 'Error al anular el estado');
      }
    } catch (err) {
      console.error('Error cancelling status:', err);
      setError('Error al anular el estado');
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    const packages = shipmentData ? transformToPackages(shipmentData) : [];
    if (mode === 'comparison' && packages.length <= 1) {
      setViewMode('shipping');
    } else {
      setViewMode(mode);
    }
  };

  const renderContent = () => {
    if (!shipmentData) return null;

    const packages = transformToPackages(shipmentData);

    switch (viewMode) {
      case 'packages':
        return (
          <PackagesList
            packages={packages}
            onCancelStatus={handleCancelStatus}
          />
        );
      case 'comparison':
        return (
          <PackagesComparison
            packages={packages}
            onCancelStatus={handleCancelStatus}
          />
        );
      default:
        return (
          <TrackingTimeline
            events={shipmentData.shipping_history.events}
            onCancelStatus={null} // Desactivamos la anulación a nivel de envío
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col max-h-[calc(100vh-4rem)]">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Introduce uno o varios números de seguimiento (separados por comas, tabulaciones o saltos de línea)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                <Upload className="w-4 h-4 inline-block mr-1" />
                Puedes pegar múltiples envíos desde Excel (usa Shift + Enter para añadir saltos de línea)
              </p>
              {bulkSearchError && (
                <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{bulkSearchError}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !trackingNumber.trim() || bulkSearchError !== null}
              className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-fit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {bulkResults.length > 0 && (
            <div className="w-1/3 flex-shrink-0 overflow-hidden flex flex-col">
              <BulkSearchResults
                results={bulkResults}
                onSelect={handleBulkSelect}
                selectedTracking={selectedTracking}
              />
            </div>
          )}

          {shipmentData && (
            <div className={`${bulkResults.length > 0 ? 'w-2/3' : 'w-full'} overflow-auto`}>
              <div className="space-y-4">
                <ShipmentDetails 
                  data={shipmentData}
                  onCreateEvent={() => setIsCreateEventModalOpen(true)}
                />
                
                <ViewModeSelector
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  packagesCount={transformToPackages(shipmentData).length}
                />
                
                {renderContent()}
              </div>
            </div>
          )}
        </div>

        {shipmentData && (
          <>
            <CreateEventModal
              isOpen={isCreateEventModalOpen}
              onClose={() => setIsCreateEventModalOpen(false)}
              onCreateEvent={handleCreateEvent}
              packageCode={shipmentData.shipping_history.item_code}
            />
            
            <CancelEventModal
              isOpen={cancelEventData.isOpen}
              onClose={() => setCancelEventData({ event: null, isOpen: false })}
              onCancelEvent={submitCancelEvent}
              eventDescription={cancelEventData.event?.description || ''}
              eventCode={cancelEventData.event?.code || ''}
              eventDate={cancelEventData.event?.event_date || ''}
              packageCode={cancelEventData.packageCode}
              packageNumber={cancelEventData.packageNumber}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;