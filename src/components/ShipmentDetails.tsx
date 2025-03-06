import React, { useState } from 'react';
import { MapPin, User, Package, ChevronDown, ChevronRight, Plus, AlertCircle, Tag, Printer, RefreshCw, CheckCircle2, Home, Box, Building, Info } from 'lucide-react';
import { ShippingData } from '../types';
import { labelService } from '../services/labelService';
import { eventService } from '../services/eventService';
import { deliveryService } from '../services/deliveryService';
import QuickDeliveryModal from './QuickDeliveryModal';
import PudoInfoModal from './PudoInfoModal';

interface Props {
  data: ShippingData;
  onCreateEvent: () => void;
  onRefresh: () => void;
}

export default function ShipmentDetails({ data, onCreateEvent, onRefresh }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPrinting, setPrinting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isQuickDeliveryOpen, setIsQuickDeliveryOpen] = useState(false);
  const [isPudoInfoOpen, setIsPudoInfoOpen] = useState(false);

  const isDelivered = deliveryService.isDelivered(data);
  const isPudoAllowed = deliveryService.isPudoDeliveryAllowed(data);

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

  const formatAddress = (address: string, address2: string, postalCode: string, town: string, countryCode: string) => {
    return `${address}, ${postalCode} ${town} (${countryCode})${address2 ? ` - ${address2}` : ''}`;
  };

  // Obtener la información del PUDO si está disponible
  const pudoInfo = data.additionals?.find(additional => additional.additionalCode === 'PER');

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintLabel();
            }}
            disabled={isPrinting}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <Printer className="w-3 h-3" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir Etiqueta'}
          </button>
          {!isDelivered && (
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
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateEvent();
            }}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-red-900 text-white rounded hover:bg-red-800"
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
                          <Info className="w-4 h-4" />
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
      />

      {pudoInfo?.organicPointCode && (
        <PudoInfoModal
          isOpen={isPudoInfoOpen}
          onClose={() => setIsPudoInfoOpen(false)}
          organicPointCode={pudoInfo.organicPointCode}
        />
      )}
    </div>
  );
}