import React, { useState } from 'react';
import { MapPin, User, Package, ChevronDown, ChevronRight, Plus, AlertCircle, Tag, Printer, RefreshCw } from 'lucide-react';
import { ShippingData } from '../types';
import { labelService } from '../services/labelService';
import { eventService } from '../services/eventService';
import DataSourceStatus from './DataSourceStatus';

interface Props {
  data: ShippingData;
  onCreateEvent: () => void;
}

export default function ShipmentDetails({ data, onCreateEvent }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPrinting, setPrinting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Verificar si redis_info existe antes de acceder a sus propiedades
  const needsRelabeling = data.redis_info && data.redis_info.status_code === '5';
  const hasChanges = data.redis_info?.param_id_1 ? data.redis_info.param_id_1 !== '' : false;

  const handlePrintLabel = async () => {
    setPrinting(true);
    try {
      const result = await labelService.printLabel(data.shipping_code);
      if (!result.success) {
        console.error('Error printing label:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleResetFlags = async () => {
    if (!data.shipping_code) return;
    
    setIsResetting(true);
    try {
      const result = await eventService.resetFlags(data.shipping_code);
      if (result.success) {
        // Recargar los datos del envío
        window.location.reload();
      } else {
        console.error('Error resetting flags:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-corporate-primary" />
          <span className="text-sm text-gray-500">{data.shipping_code}</span>
          
          {/* Indicadores de estado */}
          <div className="flex gap-2 ml-4">
            {hasChanges && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                <AlertCircle className="w-3 h-3" />
                Con cambios
              </span>
            )}
            {needsRelabeling && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                <Tag className="w-3 h-3" />
                Relabeling
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(hasChanges || needsRelabeling) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetFlags();
              }}
              disabled={isResetting}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Reseteando...' : 'Resetear Flags'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintLabel();
            }}
            disabled={isPrinting}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <Printer className="w-3 h-3" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir Etiqueta'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateEvent();
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-900 text-white rounded hover:bg-red-800"
          >
            <Plus className="w-3 h-3" />
            Crear Evento
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Estado de las fuentes de datos */}
          <div className="mb-4">
            <DataSourceStatus 
              redisInfo={data.redis_info || null}
              hasItemHistory={Boolean(data.shipping_history?.events?.length)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-corporate-primary flex items-center gap-1">
                <User className="w-4 h-4" />
                Remitente
              </h4>
              <p className="text-sm text-gray-900">{data.sender_name}</p>
              <p className="text-sm text-gray-600">{data.sender_address}</p>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-corporate-primary flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Destinatario
              </h4>
              <p className="text-sm text-gray-900">{data.recipient_name}</p>
              <p className="text-sm text-gray-600">{data.recipient_address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}