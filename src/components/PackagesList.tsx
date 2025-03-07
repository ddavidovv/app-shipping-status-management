import { useState } from 'react';
import { Package } from '../types';
import { Box, ChevronDown, ChevronRight, XCircle, CheckCircle } from 'lucide-react';
import TrackingTimeline from './TrackingTimeline';
import { isStatusCancellable } from '../config/eventConfig';

interface Props {
  packages: Package[];
  onCancelStatus?: (status: any, packageCode?: string, packageNumber?: number) => void;
}

const DELIVERABLE_STATUS_CODES = ['1500', '1600', '1200', '0900'];

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

  // Check if a package has a status that allows delivery
  const isDeliverable = (lastStatus: any) => {
    return lastStatus && DELIVERABLE_STATUS_CODES.includes(lastStatus.code);
  };

  return (
    <div className="space-y-4">
      {packages.map((pkg) => {
        const lastStatus = getLastStatus(pkg.events);
        const isCancellable = lastStatus && isStatusCancellable(lastStatus.code);
        const canBeDelivered = isDeliverable(lastStatus);
        
        return (
          <div key={pkg.item_code} className={`bg-white rounded-lg shadow-sm border ${canBeDelivered ? 'border-green-200' : 'border-gray-200'}`}>
            <div
              className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${canBeDelivered ? 'bg-green-50/30' : ''}`}
              onClick={() => togglePackage(pkg.item_code)}
            >
              <div className="flex items-center gap-3">
                <Box className={`w-5 h-5 ${canBeDelivered ? 'text-green-600' : 'text-corporate-primary'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${canBeDelivered ? 'text-green-600' : 'text-corporate-primary'}`}>
                      Bulto {pkg.package_number}
                    </h3>
                    {lastStatus && (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded-full ${canBeDelivered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {lastStatus.description}
                        </span>
                        {onCancelStatus && isCancellable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelStatus(lastStatus, pkg.item_code, pkg.package_number);
                            }}
                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Anular estado"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                    {canBeDelivered && (
                      <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Entregable
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
                  showNotifications={false}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}