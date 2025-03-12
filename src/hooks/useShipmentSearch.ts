import { useState } from 'react';
import { ShippingData } from '../types';

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
}

export function useShipmentSearch(): UseShipmentSearchResult {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkSearchResult[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [bulkSearchError, setBulkSearchError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateTrafficType = (data: ShippingData): void => {
    if (data.traffic_type_code !== 'TRANSIT_TRF') {
      throw new Error('Este número corresponde a una recogida. La búsqueda solo debe realizarse para envíos.');
    }
  };

  const fetchShipment = async (tracking: string): Promise<ShippingData> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-history/v1/history/${tracking}?view=OPERATIONS&showItems=true`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'client_id': import.meta.env.VITE_CLIENT_ID,
        'client_secret': import.meta.env.VITE_CLIENT_SECRET,
        'Authorization': import.meta.env.VITE_JWT_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data) {
      throw new Error('No se encontró historial para este envío');
    }

    // Validar el tipo de tráfico
    validateTrafficType(result.data);

    return result.data;
  };

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setBulkSearchError(null);

    const trackingNumbers = trackingNumber
      .split(/[\n,\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

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
    setIsExpanded
  };
}