import { useState } from 'react';
import { Package } from '../types';
import TrackingTimeline from './TrackingTimeline';
import { Box, XCircle, CheckCircle } from 'lucide-react';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  packages: Package[];
  onCancelStatus?: (status: any, packageCode?: string, packageNumber?: number) => void;
}

const DELIVERABLE_STATUS_CODES = ['1500', '1600', '1200', '0900'];

export default function PackagesComparison({ packages, onCancelStatus }: Props) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const togglePackageSelection = (itemCode: string) => {
    setSelectedPackages(prev => {
      // Si ya está seleccionado, lo quitamos
      if (prev.includes(itemCode)) {
        return prev.filter(code => code !== itemCode);
      }
      
      // Si no está seleccionado y hay menos de 2 selecciones, lo añadimos
      if (prev.length < 2) {
        return [...prev, itemCode];
      }
      
      // Si ya hay 2 selecciones, reemplazamos el más antiguo
      return [prev[1], itemCode];
    });
  };

  const selectedPackagesList = packages.filter(pkg => 
    selectedPackages.includes(pkg.item_code)
  );

  const getLastStatus = (events: Package['events']) => {
    return events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
  };

  // Check if a package has a status that allows delivery
  const isDeliverable = (lastStatus: any) => {
    return lastStatus && DELIVERABLE_STATUS_CODES.includes(lastStatus.code);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Selecciona hasta 2 bultos para comparar
        </h3>
        <div className="flex flex-wrap gap-2">
          {packages.map((pkg) => {
            const lastStatus = getLastStatus(pkg.events);
            const isCancellable = lastStatus && isStatusCancellable(lastStatus.code);
            const canBeDelivered = isDeliverable(lastStatus);
            
            return (
              <button
                key={pkg.item_code}
                onClick={() => togglePackageSelection(pkg.item_code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm
                  ${selectedPackages.includes(pkg.item_code)
                    ? 'bg-corporate-primary text-white border-corporate-primary'
                    : canBeDelivered
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <Box className="w-4 h-4" />
                <span>Bulto {pkg.package_number}</span>
                {canBeDelivered && !selectedPackages.includes(pkg.item_code) && (
                  <span className="ml-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </span>
                )}
                {onCancelStatus && isCancellable && lastStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelStatus(lastStatus, pkg.item_code, pkg.package_number);
                    }}
                    className={`p-0.5 ${selectedPackages.includes(pkg.item_code) ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                    title="Anular estado"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPackagesList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPackagesList.map((pkg) => {
            const lastStatus = getLastStatus(pkg.events);
            const canBeDelivered = isDeliverable(lastStatus);
            
            return (
              <div key={pkg.item_code} className={`bg-white p-4 rounded-lg shadow-sm border ${canBeDelivered ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Box className={`w-5 h-5 ${canBeDelivered ? 'text-green-600' : 'text-corporate-primary'}`} />
                  <div>
                    <h3 className={`text-sm font-semibold ${canBeDelivered ? 'text-green-600' : 'text-corporate-primary'}`}>
                      Bulto {pkg.package_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Código: {pkg.item_code}
                    </p>
                  </div>
                  {canBeDelivered && (
                    <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Entregable
                    </span>
                  )}
                </div>
                <TrackingTimeline
                  events={pkg.events}
                  showNotifications={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}