import { useState } from 'react';
import { ShippingData } from '../types';
import { MapPin, User, Package, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  data: ShippingData;
}

export default function ShipmentDetails({ data }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-corporate-primary" />
          <h3 className="text-lg font-semibold text-corporate-primary">Detalles del envío</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {data.shipping_code}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Número de envío: {data.shipping_code}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Estado: {data.last_shipping_status_code}
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-corporate-primary mb-2 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Remitente
                </h4>
                <p className="text-sm text-gray-600">{data.sender_name}</p>
                <p className="text-sm text-gray-600">{data.sender_address}</p>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-corporate-primary mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Destinatario
                </h4>
                <p className="text-sm text-gray-600">{data.recipient_name}</p>
                <p className="text-sm text-gray-600">{data.recipient_address}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}