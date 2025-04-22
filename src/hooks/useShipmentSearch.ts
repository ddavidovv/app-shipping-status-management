import { useState } from 'react';
import { ShippingData } from '../types';
import { useAuth } from '../context/AuthContext';

interface BulkSearchResult {
  trackingNumber: string;
  data: ShippingData | null;
  error?: string;
  loading: boolean;
}

interface UseShipmentSearchResult {
  trackingNumber: string;
  setTrackingNumber: (value: string) => void;
  shipmentData: ShippingData | null;
  loading: boolean;
  error: string;
  bulkResults: BulkSearchResult[];
  selectedTracking: string | null;
  bulkSearchError: string | null;
  isExpanded: boolean;
  handleSearch: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleBulkSelect: (tracking: string) => void;
  setIsExpanded: (value: boolean) => void;
  clearAllResults: () => void; // Método para limpiar todos los resultados
}

export function useShipmentSearch(): UseShipmentSearchResult {
  const { idToken } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkSearchResult[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [bulkSearchError, setBulkSearchError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isPickup = (data: any): boolean => {
    // Verificar si los eventos indican que es una recogida
    const pickupEvents = (data.shipping_history?.events || []).filter((event: any) => 
      event.code?.startsWith('PICKUP_')
    );
    
    // Verificar el tipo de tráfico
    const validTrafficTypes = ['TRANSIT_TRF', 'TRANSIT_TRFT'];
    const hasValidTrafficType = validTrafficTypes.includes(data.traffic_type_code || '');
    
    console.log('🔍 Validando tipo de envío:', {
      traffic_type_code: data.traffic_type_code,
      hasValidTrafficType,
      pickupEventCount: pickupEvents.length,
      isPickup: pickupEvents.length > 0 || !hasValidTrafficType
    });
    
    // Es una recogida si tiene eventos de recogida o no tiene un tipo de tráfico válido
    return pickupEvents.length > 0 || !hasValidTrafficType;
  };

  const processShipmentData = (rawData: any): ShippingData => {
    console.log('🔄 Procesando datos del envío:', {
      hasData: Boolean(rawData),
      hasShippingHistory: Boolean(rawData?.shipping_history),
      hasEvents: Boolean(rawData?.shipping_history?.events),
      eventCount: rawData?.shipping_history?.events?.length,
      traffic_type_code: rawData?.traffic_type_code
    });

    if (!rawData || typeof rawData !== 'object') {
      console.error('❌ Datos inválidos:', rawData);
      throw new Error('Datos de envío inválidos');
    }

    // Verificar si es una recogida
    if (isPickup(rawData)) {
      console.error('❌ Error en búsqueda: Este número corresponde a una recogida');
      throw new Error('Este número corresponde a una recogida. La búsqueda solo debe realizarse para envíos.');
    }

    // Asegurarse de que los campos requeridos existen
    if (!rawData.shipping_history || !Array.isArray(rawData.shipping_history.events)) {
      console.error('❌ Estructura inválida:', {
        shipping_history: rawData.shipping_history,
        events: rawData.shipping_history?.events
      });
      throw new Error('Estructura de datos de envío inválida');
    }

    // Verificar si el envío tiene reembolso (additionalCode = 'REE')
    const hasReimbursement = Array.isArray(rawData.additionals) && 
      rawData.additionals.some((additional: any) => additional.additionalCode === 'REE');
    
    console.log('💰 Verificación de reembolso:', {
      hasReimbursement,
      additionals: rawData.additionals
    });

    // Procesar y validar los datos
    const processedData: ShippingData = {
      ...rawData,
      shipping_history: {
        item_code: rawData.shipping_history.item_code || '',
        events: rawData.shipping_history.events || []
      },
      items_history: Array.isArray(rawData.items_history) ? rawData.items_history : [],
      shipping_code: rawData.shipping_code || '',
      main_shipping_code: rawData.main_shipping_code || '',
      shipping_status_code: rawData.shipping_status_code || '',
      origin_province_name: rawData.origin_province_name || '',
      destin_province_name: rawData.destin_province_name || '',
      recipient_name: rawData.recipient_name || '',
      sender_name: rawData.sender_name || '',
      recipient_address: rawData.recipient_address || '',
      sender_address: rawData.sender_address || '',
      origin_country_code: rawData.origin_country_code || '',
      origin_postal_code: rawData.origin_postal_code || '',
      origin_address: rawData.origin_address || '',
      origin_address2: rawData.origin_address2 || '',
      origin_town_name: rawData.origin_town_name || '',
      destin_country_code: rawData.destin_country_code || '',
      destin_postal_code: rawData.destin_postal_code || '',
      destin_address: rawData.destin_address || '',
      destin_address2: rawData.destin_address2 || '',
      destin_town_name: rawData.destin_town_name || '',
      traffic_type_code: rawData.traffic_type_code || '',
      hasReimbursement: hasReimbursement
    };

    console.log('✅ Datos procesados:', {
      shipping_code: processedData.shipping_code,
      event_count: processedData.shipping_history.events.length,
      first_event: processedData.shipping_history.events[0]?.code,
      traffic_type: processedData.traffic_type_code,
      hasReimbursement: processedData.hasReimbursement
    });

    return processedData;
  };

  const fetchShipment = async (tracking: string): Promise<ShippingData> => {
    console.log('🚀 Iniciando búsqueda para:', tracking);

    if (!idToken) {
      console.error('❌ No hay token de autenticación');
      throw new Error('No hay un token de autenticación válido');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-history/v1/history/${tracking}?view=OPERATIONS&showItems=true`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'client_id': import.meta.env.VITE_CLIENT_ID,
        'client_secret': import.meta.env.VITE_CLIENT_SECRET,
        'Authorization': idToken
      }
    });

    console.log('📡 Respuesta del servidor:', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Error de autenticación. Por favor, recarga la página.');
      }
      if (response.status === 404) {
        throw new Error('No se encontró el envío especificado');
      }
      throw new Error(`Error al buscar el envío (${response.status})`);
    }

    const result = await response.json();
    console.log('📦 Datos recibidos:', {
      hasData: Boolean(result.data),
      error: result.error,
      traffic_type_code: result.data?.traffic_type_code
    });

    if (!result.data) {
      throw new Error('No se encontró historial para este envío');
    }

    // Procesar y validar los datos recibidos
    return processShipmentData(result.data);
  };

  /**
   * Limpia completamente todos los estados y resultados de búsqueda
   * Este método debe ser llamado directamente para hacer una limpieza total
   */
  const clearAllResults = () => {
    console.log('🧹 clearAllResults: Limpiando TODOS los resultados y estados');
    
    // Usar un Promise.all para garantizar que todos los estados se actualicen
    // antes de continuar con cualquier otra operación
    Promise.all([
      // Limpiar todos los estados relacionados con la búsqueda
      new Promise<void>(resolve => {
        setBulkSearchError(null);
        resolve();
      }),
      new Promise<void>(resolve => {
        setError('');
        resolve();
      }),
      new Promise<void>(resolve => {
        setShipmentData(null);
        resolve();
      }),
      new Promise<void>(resolve => {
        setBulkResults([]);
        resolve();
      }),
      new Promise<void>(resolve => {
        setSelectedTracking(null);
        resolve();
      })
    ]).then(() => {
      console.log('🧹 clearAllResults: Limpieza completada.');
    });
  };

  const handleSearch = async () => {
    console.log('🔍 handleSearch: INICIO - trackingNumber:', trackingNumber, 'length:', trackingNumber.length);
    
    // Si no hay término de búsqueda, simplemente limpiamos y retornamos
    if (!trackingNumber.trim()) {
      console.log('🧹 No hay término de búsqueda, limpiando resultados...');
      clearAllResults();
      return;
    }
    
    // Limpiar siempre los datos anteriores al hacer una búsqueda
    clearAllResults();
    
    console.log('🔍 Iniciando búsqueda con:', trackingNumber);

    const trackingNumbers = trackingNumber
      .split(/[\n,\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (trackingNumbers.length > 1000) {
      setBulkSearchError(`Has excedido el límite de 1000 envíos para búsqueda masiva. Actualmente tienes ${trackingNumbers.length} envíos.`);
      return;
    }

    if (trackingNumbers.length > 1) {
      console.log('📦 Iniciando búsqueda múltiple:', trackingNumbers.length, 'envíos');
      
      setBulkResults(trackingNumbers.map(t => ({
        trackingNumber: t,
        data: null,
        loading: true
      })));

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
          const errorMessage = err instanceof Error ? err.message : 'Error al buscar el envío';
          console.error('❌ Error en búsqueda múltiple:', {
            tracking: t,
            error: errorMessage
          });
          setBulkResults(prev => prev.map(r => 
            r.trackingNumber === t 
              ? { trackingNumber: t, data: null, error: errorMessage, loading: false }
              : r
          ));
          return { trackingNumber: t, data: null, error: errorMessage, loading: false };
        }
      });

      await Promise.all(searches);
    } else {
      console.log('🔍 Iniciando búsqueda individual:', trackingNumber);
      
      setBulkResults([]);
      setSelectedTracking(null);
      setLoading(true);
      
      try {
        const data = await fetchShipment(trackingNumber);
        console.log('✅ Búsqueda exitosa:', {
          shipping_code: data.shipping_code,
          has_events: data.shipping_history.events.length > 0,
          traffic_type: data.traffic_type_code
        });
        setShipmentData(data);
        setError('');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al buscar el envío';
        console.error('❌ Error en búsqueda:', errorMessage);
        setError(errorMessage);
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

  return {
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
    clearAllResults  // Exponemos la función de limpieza para usarla directamente
  };
}