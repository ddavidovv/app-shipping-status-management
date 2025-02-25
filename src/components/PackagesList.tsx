import { useState } from 'react';
import { Package } from '../types';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';
import TrackingTimeline from './TrackingTimeline';

interface Props {
  packages: Package[];
  onCancelStatus?: (status: any) => void;
}

export default function PackagesList({ packages, onCancelStatus }: Props) {
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const togglePackage = (itemCode: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [itemCode]: !prev[itemCode]
    }));
  };

  const getLastStatus = (events: Package['events']) => {
    return events
      .filter(event => event.type === 'STATUS')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
  };

  return (
    <div className="space-y-4">
      {packages.map((pkg) => {
        const lastStatus = getLastStatus(pkg.events);
        return (
          <div key={pkg.item_code} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => togglePackage(pkg.item_code)}
            >
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-corporate-primary" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-corporate-primary">
                      Bulto {pkg.package_number}
                    </h3>
                    {lastStatus && (
                      <span className="text-sm px-2 py-0.5 bg-gray-100 rounded-full">
                        {lastStatus.description}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Código: {pkg.item_code}
                  </p>
                </div>
              </div>
              {expandedPackages[pkg.item_code] ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedPackages[pkg.item_code] && (
              <div className="p-4 border-t border-gray-100">
                <TrackingTimeline
                  events={pkg.events}
                  onCancelStatus={onCancelStatus}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}