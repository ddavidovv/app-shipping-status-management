import React, { useState, useCallback } from 'react';
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
import PackageStatusView from './components/PackageStatusView';
import BulkSearchResults from './components/BulkSearchResults';
import SearchBar from './components/SearchBar';
import { eventService } from './services/eventService';
import { useAuth } from './context/AuthContext';
import { useShipmentSearch } from './hooks/useShipmentSearch';
import QuickDeliveryModal from './components/QuickDeliveryModal';
import { deliveryService } from './services/deliveryService';
import AssignDeliveryModal from './components/AssignDeliveryModal';

function App() {
  const { isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('shipping');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isAssignDeliveryModalOpen, setIsAssignDeliveryModalOpen] = useState(false);
  const [cancelEventData, setCancelEventData] = useState<{
    event: any;
    isOpen: boolean;
    packageCode?: string;
    packageNumber?: number;
    result?: {
      success: boolean;
      message: string;
      packageNumber?: number;
    } | null;
  }>({ event: null, isOpen: false, result: null });

  // Estado para mantener el resultado de la última operación de anulación
  // const [lastCancellationResult, setLastCancellationResult] = useState<{
  //   success: boolean;
  //   message: string;
  //   packageNumber?: number;
  // } | null>(null);

  // Usar referencia para mantener estado entre re-renderizados
  const cancelEventDataRef = React.useRef({
    lastEvent: null as any,
    lastPackageCode: null as string | null,
    lastPackageNumber: null as number | null
  });

  // Log para el seguimiento del estado del modal
  React.useEffect(() => {
    console.log(' App.tsx - cancelEventData changed:', { 
      isOpen: cancelEventData.isOpen, 
      hasEvent: !!cancelEventData.event,
      packageCode: cancelEventData.packageCode
    });

    // Guardar los últimos datos válidos cuando se abre el modal
    if (cancelEventData.isOpen && cancelEventData.event) {
      cancelEventDataRef.current = {
        lastEvent: cancelEventData.event,
        lastPackageCode: cancelEventData.packageCode || null,
        lastPackageNumber: cancelEventData.packageNumber || null
      };
    }
  }, [cancelEventData]);

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
    setIsExpanded,
    clearAllResults  // Extraemos el método de limpieza
  } = useShipmentSearch();

  // Función personalizada para resetear el estado de la aplicación
  const resetAppState = useCallback(() => {
    console.log(' App.tsx - Reseteando estado de la aplicación');
    // Resetear el estado del modal de anulación
    setCancelEventData({ 
      event: null, 
      isOpen: false,
      packageCode: undefined,
      packageNumber: undefined,
      result: null
    });
    // Resetear otras variables de estado si es necesario
  }, []);

  // Función mejorada que combina resetAppState y handleSearch
  // IMPORTANTE: No usamos originalHandleSearch porque causa problemas con las referencias
  const enhancedHandleSearch = useCallback(async () => {
    console.log('🔄 App.tsx - enhancedHandleSearch: INICIO');
    // Resetear el estado antes de realizar la búsqueda
    resetAppState();
    // Llamar directamente a la función handleSearch del hook
    // Esto asegura que siempre usamos la versión más actualizada
    console.log('🔄 App.tsx - enhancedHandleSearch: Llamando a handleSearch');
    return await handleSearch();
  }, [resetAppState, handleSearch]);

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
    // Filtrar solo los elementos que tienen item_code
    const validItems = data.items_history.filter((item: any) => item.item_code);
    
    // Mapear solo los elementos válidos y asignarles un número secuencial
    return validItems.map((item: any, index: number) => ({
      item_code: item.item_code,
      events: item.events,
      package_number: index + 1
    }));
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const result = await eventService.createEvent(eventData);
      if (result.success) {
        await enhancedHandleSearch();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleCancelStatus = async (status: any, packageCode?: string, packageNumber?: number) => {
    console.log(' App.tsx - handleCancelStatus llamado:', { status, packageCode, packageNumber });
    
    // Evitar cerrar/abrir el modal para prevenir problemas de estado
    const isModalAlreadyOpen = cancelEventData.isOpen;
    
    setCancelEventData(() => {
      console.log(' App.tsx - Actualizando cancelEventData con:', { 
        isAlreadyOpen: isModalAlreadyOpen,
        newStatus: status, 
        newCode: packageCode 
      });
      
      return { 
        event: status, 
        isOpen: true,
        packageCode,
        packageNumber,
        result: null
      };
    });
  };

  const submitCancelEvent = async (eventId: string, reason: string) => {
    try {
      // Verificar que tenemos los datos necesarios
      if (!cancelEventData.packageCode || !cancelEventData.event) {
        console.error('No hay datos suficientes para cancelar el estado');
        setCancelEventData(prev => ({
          ...prev,
          result: {
            success: false,
            message: 'Datos insuficientes para cancelar el estado'
          }
        }));
        return;
      }
      
      const packageCode = cancelEventData.packageCode;
      console.log('Submitting cancel event:', { eventId, reason, packageCode });
      
      // Intentar cancelar el estado
      const result = await eventService.cancelStatus(
        packageCode, 
        cancelEventData.event.event_date, 
        reason, 
        cancelEventData.event.description
      );
      
      console.log('Cancel status result:', result);
      
      // Actualizar el estado con el resultado
      setCancelEventData(prev => ({
        ...prev,
        result: {
          success: result.success,
          message: result.error || (result.success ? 'Estado anulado correctamente' : 'Error al anular el estado')
        }
      }));
      
      // Si la cancelación fue exitosa, actualizar los datos del envío
      if (result.success) {
        await handleSearch();
      }
    } catch (error) {
      console.error('Error in submitCancelEvent:', error);
      
      // Crear un mensaje de error descriptivo
      let errorMessage = 'Error al anular el estado';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Actualizar el estado con el error
      setCancelEventData(prev => ({
        ...prev,
        result: {
          success: false,
          message: errorMessage
        }
      }));
    }
  };

  const handleCloseEventModal = () => {
    console.log(' App.tsx - Llamando a setCancelEventData para cerrar modal');
    // Resetear completamente el estado del modal al cerrarlo
    setCancelEventData({ 
      event: null, 
      isOpen: false,
      packageCode: undefined,
      packageNumber: undefined,
      result: null
    });
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
      case 'packageStatus':
        return (
          <PackageStatusView
            packages={packages}
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
          onSearch={enhancedHandleSearch}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          loading={loading}
          error={error || bulkSearchError}
          clearResults={clearAllResults}  // Pasamos el método de limpieza directa
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
                  onRefresh={enhancedHandleSearch}
                  onCancelStatus={handleCancelStatus}
                  onOpenDeliveryModal={() => setIsDeliveryModalOpen(true)}
                  onOpenAssignDeliveryModal={() => setIsAssignDeliveryModalOpen(true)}
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
              onClose={handleCloseEventModal}
              onCancelEvent={submitCancelEvent}
              packageCode={cancelEventData.packageCode}
              packageNumber={cancelEventData.packageNumber}
              packages={shipmentData.items_history
                .filter(item => item.item_code)
                .map((item, index) => ({
                  itemCode: item.item_code,
                  packageNumber: index + 1,
                  events: item.events
                }))}
              lastResult={cancelEventData.result}
            />

            <QuickDeliveryModal
              isOpen={isDeliveryModalOpen}
              onClose={() => setIsDeliveryModalOpen(false)}
              onDeliver={enhancedHandleSearch}
              shippingCode={shipmentData.shipping_code}
              isPudoAllowed={deliveryService.isPudoDeliveryAllowed(shipmentData)}
              pudoInfo={
                (() => {
                  const pudo = shipmentData.additionals?.find(a => a.additionalCode === 'PER');
                  return pudo && pudo.providerCode && pudo.organicPointCode 
                    ? { providerCode: pudo.providerCode, organicPointCode: pudo.organicPointCode }
                    : null;
                })()
              }
              currentStatus={shipmentData.shipping_status_code}
              shipmentData={shipmentData}
            />

            <AssignDeliveryModal
              isOpen={isAssignDeliveryModalOpen}
              onClose={() => setIsAssignDeliveryModalOpen(false)}
              onAssign={enhancedHandleSearch}
              shippingCode={shipmentData.shipping_code}
              shipmentData={shipmentData}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;