import React, { useState } from 'react';
import { MapPin, User, Package, ChevronDown, ChevronRight, RefreshCw, CheckCircle2, Home, Box, Building, XCircle } from 'lucide-react';
import { ShippingData } from '../types';
import { deliveryService } from '../services/deliveryService';
import QuickDeliveryModal from './QuickDeliveryModal';
import PudoInfoModal from './PudoInfoModal';
import CancelEventModal from './CancelEventModal';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  data: ShippingData;
  onRefresh: () => void;
}

export default function ShipmentDetails({ data, onRefresh }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isQuickDeliveryOpen, setIsQuickDeliveryOpen] = useState(false);
  const [isPudoInfoOpen, setIsPudoInfoOpen] = useState(false);
  const [isCancelEventOpen, setIsCancelEventOpen] = useState(false);

  const isDelivered = deliveryService.isDelivered(data);
  const isPudoAllowed = deliveryService.isPudoDeliveryAllowed(data);

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

  const handleCancelEvent = () => {
    console.log('↻ Refreshing data after cancellation');
    onRefresh();
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
          {!isDelivered && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuickDeliveryOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                <CheckCircle2 className="w-3 h-3" />
                Entregar
              </button>
              {hasCancellableStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCancelEventOpen(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <XCircle className="w-3 h-3" />
                  Anular Estado
                </button>
              )}
            </>
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
                {isPudoAllowed && (
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
              {isPudoAllowed && pudoInfo && (
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

      <QuickDeliveryModal
        isOpen={isQuickDeliveryOpen}
        onClose={() => setIsQuickDeliveryOpen(false)}
        onDeliver={onRefresh}
        shippingCode={data.shipping_code}
        isPudoAllowed={isPudoAllowed}
        pudoInfo={pudoInfo ? {
          providerCode: pudoInfo.providerCode || '',
          organicPointCode: pudoInfo.organicPointCode || ''
        } : null}
        currentStatus={data.shipping_status_code}
        shipmentData={data}
      />

      {pudoInfo?.organicPointCode && (
        <PudoInfoModal
          isOpen={isPudoInfoOpen}
          onClose={() => setIsPudoInfoOpen(false)}
          organicPointCode={pudoInfo.organicPointCode}
        />
      )}

      <CancelEventModal
        isOpen={isCancelEventOpen}
        onClose={() => setIsCancelEventOpen(false)}
        onCancelEvent={handleCancelEvent}
        eventDescription=""
        eventCode=""
        eventDate=""
        packages={data.items_history.map((item, index) => ({
          itemCode: item.item_code,
          packageNumber: index + 1,
          events: item.events
        }))}
      />
    </div>
  );
}