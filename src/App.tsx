import React, { useState } from 'react';
import { Search, Loader2, Upload } from 'lucide-react';
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

interface BulkSearchResult {
  trackingNumber: string;
  data: ShippingData | null;
  error?: string;
  loading: boolean;
}

function App() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('shipping');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [cancelEventData, setCancelEventData] = useState<{
    event: ShippingEvent;
    isOpen: boolean;
  }>({ event: null, isOpen: false });
  const [bulkResults, setBulkResults] = useState<BulkSearchResult[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);

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

    // Extraer los datos del envío de la respuesta
    const historyData = result.item_history_info.data;

    // Asegurarnos de que items_history existe y es un array
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

    // Detectar si es una búsqueda múltiple
    // Dividir por comas, tabulaciones o saltos de línea
    const trackingNumbers = trackingNumber
      .split(/[\n,\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (trackingNumbers.length > 1) {
      // Búsqueda múltiple
      setBulkResults(trackingNumbers.map(t => ({
        trackingNumber: t,
        data: null,
        loading: true
      })));
      setShipmentData(null);
      setError('');

      // Realizar búsquedas en paralelo
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
      // Búsqueda individual
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
      e.preventDefault(); // Prevenir el salto de línea
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

  const handleCancelStatus = async (status: ShippingEvent) => {
    setCancelEventData({ event: status, isOpen: true });
  };

  const submitCancelEvent = async (eventId: string, reason: string) => {
    try {
      if (!shipmentData || !cancelEventData.event) return;

      const result = await eventService.cancelStatus(
        cancelEventData.event.code,
        cancelEventData.event.event_date,
        reason
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
    // Si intentamos cambiar a modo comparación y no hay suficientes bultos, mantenemos el modo envío
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
            onCancelStatus={handleCancelStatus}
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
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !trackingNumber.trim()}
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
          {/* Lista de resultados */}
          {bulkResults.length > 0 && (
            <div className="w-1/3 flex-shrink-0 overflow-hidden flex flex-col">
              <BulkSearchResults
                results={bulkResults}
                onSelect={handleBulkSelect}
                selectedTracking={selectedTracking}
              />
            </div>
          )}

          {/* Panel de detalles */}
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
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;