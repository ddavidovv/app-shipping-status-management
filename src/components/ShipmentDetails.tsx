import React, { useState } from 'react';
import { MapPin, User, Package, ChevronDown, ChevronRight, RefreshCw, CheckCircle2, Home, Box, Building, XCircle, DollarSign, RefreshCw as ForceIcon } from 'lucide-react';
import { ShippingData } from '../types';
import { deliveryService } from '../services/deliveryService';
import PudoInfoModal from './PudoInfoModal';
import ForceStatusModal from './ForceStatusModal';
import { isStatusCancellable } from '../config/eventConfig';
import { useAuth } from '../context/AuthContext';

interface Props {
  data: ShippingData;
  onRefresh: () => void;
  onCancelStatus?: (status: any, packageCode?: string, packageNumber?: number) => void;
}

export default function ShipmentDetails({ data, onRefresh, onCancelStatus }: Props) {
  const { enrichedData } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPudoInfoOpen, setIsPudoInfoOpen] = useState(false);
  const [isForceStatusOpen, setIsForceStatusOpen] = useState(false);

  const userRoles = enrichedData?.roles || [];
  const canPerformSensitiveActions = userRoles.includes('Admin') || userRoles.includes('Operations_Central');

  const isDelivered = deliveryService.isDelivered(data);

  const formatAddress = (address: string, address2: string, postalCode: string, town: string, countryCode: string) => {
    return `${address}, ${postalCode} ${town} (${countryCode})${address2 ? ` - ${address2}` : ''}`;
  };

  // Obtener la información del PUDO si está disponible
  const pudoInfo = data.additionals?.find(additional => additional.additionalCode === 'PER');

  // Verificar si hay algún bulto con estado cancelable
  const hasCancellableStatus = data.items_history.some(item => {
    const lastStatus = item.events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    return lastStatus && isStatusCancellable(lastStatus.code);
  });

  // Encontrar el primer bulto con estado cancelable para usarlo al hacer clic en "Anular Estado"
  const findCancellableStatus = () => {
    for (const item of data.items_history) {
      const lastStatus = item.events
        .filter(event => event.type === 'STATUS')
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
      
      if (lastStatus && isStatusCancellable(lastStatus.code)) {
        return {
          status: lastStatus,
          itemCode: item.item_code,
          packageNumber: data.items_history.indexOf(item) + 1
        };
      }
    }
    return null;
  };

  const handleAnularEstadoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCancelStatus) return;
    
    console.log('⭐ ShipmentDetails - Iniciando anulación de estado');
    const cancellableItem = findCancellableStatus();
    if (cancellableItem) {
      onCancelStatus(
        cancellableItem.status, 
        cancellableItem.itemCode, 
        cancellableItem.packageNumber
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-corporate-primary" />
          <span className="text-sm text-gray-500">{data.shipping_code}</span>
          
          {isDelivered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Entregado
            </span>
          )}

          {data.hasReimbursement && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              <DollarSign className="w-3 h-3" />
              Reembolso
            </span>
          )}

          <div className="flex items-center gap-2 ml-2">
            {data.shipping_type_code && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                <Box className="w-3 h-3" />
                {data.shipping_type_code}
              </span>
            )}
            {data.client_center_code && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                <Building className="w-3 h-3" />
                {data.client_center_code}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
          {/* Mostrar botón de Anular Estado siempre que haya un estado cancelable, independientemente de si está entregado */}
          {canPerformSensitiveActions && hasCancellableStatus && onCancelStatus && (
            <button
              onClick={handleAnularEstadoClick}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              <XCircle className="w-3 h-3" />
              Anular Estado
            </button>
          )}
          {/* Botón para forzar estado */}
          {canPerformSensitiveActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsForceStatusOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <ForceIcon className="w-3 h-3" />
              Forzar Estado
            </button>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-corporate-primary flex items-center gap-1 mb-1">
                <User className="w-4 h-4" />
                Remitente
              </h4>
              <p className="text-sm text-gray-900">{data.sender_name}</p>
              <p className="text-sm text-gray-600">
                {formatAddress(
                  data.origin_address,
                  data.origin_address2,
                  data.origin_postal_code,
                  data.origin_town_name,
                  data.origin_country_code
                )}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-corporate-primary flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                Destinatario
                {pudoInfo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    <Home className="w-3 h-3" />
                    Punto PUDO
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-900">{data.recipient_name}</p>
              <p className="text-sm text-gray-600">
                {formatAddress(
                  data.destin_address,
                  data.destin_address2,
                  data.destin_postal_code,
                  data.destin_town_name,
                  data.destin_country_code
                )}
              </p>
              {pudoInfo && (
                <div className="mt-1 text-sm text-blue-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pudoInfo.providerCode}</span>
                    {pudoInfo.organicPointCode && (
                      <>
                        <span>· Punto {pudoInfo.organicPointCode}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPudoInfoOpen(true);
                          }}
                          className="p-1 text-blue-700 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          title="Ver información del punto PUDO"
                        >
                          <Box className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPudoInfoOpen && pudoInfo && (
        <PudoInfoModal
          isOpen={isPudoInfoOpen}
          onClose={() => setIsPudoInfoOpen(false)}
          organicPointCode={String(pudoInfo.additionalValue || '')}
        />
      )}

      {isForceStatusOpen && (
        <ForceStatusModal
          isOpen={isForceStatusOpen}
          onClose={() => setIsForceStatusOpen(false)}
          onForceStatus={() => {
            // No cerrar el modal aquí, permitir múltiples forzados si es necesario      
            onRefresh();
          }}
          shippingCode={data.shipping_code}
          shipmentData={data} // Pasar shipmentData al modal
        />
      )}
    </div>
  );
}