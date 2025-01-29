import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { ShippingData, ShippingEvent } from './types';
import TrackingTimeline from './components/TrackingTimeline';
import ShipmentDetails from './components/ShipmentDetails';
import Header from './components/Header';
import CreateEventModal from './components/CreateEventModal';
import CancelEventModal from './components/CancelEventModal';
import { eventService } from './services/eventService';

function App() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [cancelEventData, setCancelEventData] = useState<{
    event: ShippingEvent;
    isOpen: boolean;
  }>({ event: null, isOpen: false });

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/item-history-api/v1/history/${trackingNumber}?view=unfiltered&show_items=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
        setShipmentData(result.data);
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
        await handleSearch(); // Recargar los datos del envío
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
        shipmentData.shipping_history.item_code,
        cancelEventData.event.event_date,
        cancelEventData.event.code
      );

      if (result.success) {
        await handleSearch(); // Recargar los datos del envío
      } else {
        setError(result.error || 'Error al anular el estado');
      }
    } catch (err) {
      console.error('Error cancelling status:', err);
      setError('Error al anular el estado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Introduce tu número de seguimiento"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {error && (
            <p className="text-red-600 mt-4">{error}</p>
          )}
        </div>

        {shipmentData && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Detalles del Envío</h2>
              <button
                onClick={() => setIsCreateEventModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800"
              >
                <Plus className="w-4 h-4" />
                Crear Evento
              </button>
            </div>
            <ShipmentDetails data={shipmentData} />
            <TrackingTimeline 
              events={shipmentData.shipping_history.events}
              onCancelStatus={handleCancelStatus}
            />
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