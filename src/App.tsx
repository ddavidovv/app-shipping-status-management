import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { ShippingData, ShippingEvent, ViewMode, Package, ItemHistory } from './types';
import TrackingTimeline from './components/TrackingTimeline';
import ShipmentDetails from './components/ShipmentDetails';
import Header from './components/Header';
import CreateEventModal from './components/CreateEventModal';
import CancelEventModal from './components/CancelEventModal';
import ViewModeSelector from './components/ViewModeSelector';
import PackagesList from './components/PackagesList';
import PackagesComparison from './components/PackagesComparison';
import { eventService } from './services/eventService';

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

  const transformToPackages = (itemsHistory: ItemHistory[]): Package[] => {
    return itemsHistory.map(item => {
      const packageNumber = parseInt(item.item_code.slice(-3));
      return {
        item_code: item.item_code,
        events: item.events,
        package_number: packageNumber
      };
    });
  };

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/enterprise-portal/incident-mgmt/package-info/v1/rpc-get-package-info?shipping_code=${trackingNumber}&view=OPERATIONS&show_items=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'jwt-token': import.meta.env.VITE_JWT_TOKEN,
          'client_secret': import.meta.env.VITE_CLIENT_SECRET,
          'client_id': import.meta.env.VITE_CLIENT_ID
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        setError('No se pudo encontrar el envío');
        setShipmentData(null);
      } else {
        // Accedemos a item_history_info con o sin comilla simple
        const itemHistoryInfo = result["item_history_info'"] || result.item_history_info;
        
        if (!itemHistoryInfo?.data) {
          throw new Error('Formato de respuesta inválido');
        }

        const transformedData = {
          ...itemHistoryInfo.data,
          shipping_history: {
            ...itemHistoryInfo.data.shipping_history,
            packages: transformToPackages(itemHistoryInfo.data.items_history || [])
          },
          redis_info: result.redis_info
        };
        setShipmentData(transformedData);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al buscar el envío');
      setShipmentData(null);
    } finally {
      setLoading(false);
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

  const renderContent = () => {
    if (!shipmentData) return null;

    const packages = shipmentData.shipping_history.packages || [];

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
            onCancelStatus={undefined}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Introduce tu número de seguimiento"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !trackingNumber.trim()}
              className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

        {shipmentData && (
          <div className="space-y-4">
            <ShipmentDetails 
              data={shipmentData}
              onCreateEvent={() => setIsCreateEventModalOpen(true)}
            />
            
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              packagesCount={shipmentData.items_history?.length || 0}
            />
            
            {renderContent()}
          </div>
        )}

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