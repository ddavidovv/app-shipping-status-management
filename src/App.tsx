import React, { useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { ViewMode, Package } from './types';
import TrackingTimeline from './components/TrackingTimeline';
import ShipmentDetails from './components/ShipmentDetails';
import Header from './components/Header';
import CreateEventModal from './components/CreateEventModal';
import CancelEventModal from './components/CancelEventModal';
import ViewModeSelector from './components/ViewModeSelector';
import PackagesList from './components/PackagesList';
import PackagesComparison from './components/PackagesComparison';
import BulkSearchResults from './components/BulkSearchResults';
import SearchBar from './components/SearchBar';
import { eventService } from './services/eventService';
import { useAuth } from './context/AuthContext';
import { useShipmentSearch } from './hooks/useShipmentSearch';
import QuickDeliveryModal from './components/QuickDeliveryModal';
import { deliveryService } from './services/deliveryService';

function App() {
  const { isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('shipping');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [cancelEventData, setCancelEventData] = useState<{
    event: any;
    isOpen: boolean;
    packageCode?: string;
    packageNumber?: number;
  }>({ event: null, isOpen: false });

  const {
    trackingNumber,
    setTrackingNumber,
    shipmentData,
    loading,
    error,
    bulkResults,
    selectedTracking,
    bulkSearchError,
    isExpanded,
    handleSearch,
    handleKeyPress,
    handleBulkSelect,
    setIsExpanded
  } = useShipmentSearch();

  const handleClose = () => {
    try {
      window.close();
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = 'about:blank';
          window.close();
        }
      }, 100);
    } catch (e) {
      console.error('Error al cerrar la ventana:', e);
      window.location.href = 'about:blank';
    }
  };

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

  const transformToPackages = (data: any): Package[] => {
    if (!data.items_history || data.items_history.length === 0) {
      return [];
    }
    return data.items_history.map((item: any, index: number) => ({
      item_code: item.item_code,
      events: item.events,
      package_number: index + 1
    }));
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await eventService.createEvent(eventData);
      if (result.success) {
        await handleSearch();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleCancelStatus = async (status: any, packageCode?: string, packageNumber?: number) => {
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

      const itemCode = cancelEventData.packageCode || '';
      
      const result = await eventService.cancelStatus(
        itemCode,
        cancelEventData.event.event_date,
        reason,
        cancelEventData.event.description
      );

      if (result.success) {
        await handleSearch();
      }
    } catch (err) {
      console.error('Error cancelling status:', err);
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
            showNotifications={true}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col max-h-[calc(100vh-4rem)]">
        <SearchBar
          value={trackingNumber}
          onChange={setTrackingNumber}
          onKeyDown={handleKeyPress}
          onSearch={handleSearch}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          loading={loading}
          error={bulkSearchError}
        />

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
                  onRefresh={handleSearch}
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

            <QuickDeliveryModal
              isOpen={isDeliveryModalOpen}
              onClose={() => setIsDeliveryModalOpen(false)}
              onDeliver={handleSearch}
              shippingCode={shipmentData.shipping_code}
              isPudoAllowed={deliveryService.isPudoDeliveryAllowed(shipmentData)}
              pudoInfo={shipmentData.additionals?.find(a => a.additionalCode === 'PER')}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;