import { useState } from 'react';
import { Package } from '../types';
import TrackingTimeline from './TrackingTimeline';
import { Box } from 'lucide-react';

interface Props {
  packages: Package[];
  onCancelStatus?: (status: any) => void;
}

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Selecciona hasta 2 bultos para comparar
        </h3>
        <div className="flex flex-wrap gap-2">
          {packages.map((pkg) => (
            <button
              key={pkg.item_code}
              onClick={() => togglePackageSelection(pkg.item_code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm
                ${selectedPackages.includes(pkg.item_code)
                  ? 'bg-corporate-primary text-white border-corporate-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <Box className="w-4 h-4" />
              <span>Bulto {pkg.package_number}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPackagesList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPackagesList.map((pkg) => (
            <div key={pkg.item_code} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-corporate-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-corporate-primary">
                    Bulto {pkg.package_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Código: {pkg.item_code}
                  </p>
                </div>
              </div>
              <TrackingTimeline
                events={pkg.events}
                onCancelStatus={onCancelStatus}
                showNotifications={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}