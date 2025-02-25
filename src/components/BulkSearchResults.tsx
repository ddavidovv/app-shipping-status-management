import React, { useState } from 'react';
import { Package, AlertCircle, CheckCircle, Loader2, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { ShippingData } from '../types';
import ExportModal from './ExportModal';

interface BulkSearchResult {
  trackingNumber: string;
  data: ShippingData | null;
  error?: string;
  loading: boolean;
}

interface Props {
  results: BulkSearchResult[];
  onSelect: (trackingNumber: string) => void;
  selectedTracking: string | null;
}

export default function BulkSearchResults({ results, onSelect, selectedTracking }: Props) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calcular estadísticas
  const stats = {
    total: results.length,
    success: results.filter(r => r.data && !r.error).length,
    error: results.filter(r => r.error).length,
    loading: results.filter(r => r.loading).length
  };

  return (
    <div className="flex flex-col h-full">
      {/* Resumen estadístico */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4" />
          <span>{stats.total} envíos</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{stats.success} encontrados</span>
        </div>
        {stats.error > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{stats.error} errores</span>
            </div>
          </>
        )}
        {stats.loading > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{stats.loading} pendientes</span>
            </div>
          </>
        )}
        
        {stats.success > 0 && (
          <>
            <div className="flex-1" />
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 text-corporate-primary hover:text-red-800 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </>
        )}
      </div>

      {/* Lista de resultados con scroll */}
      <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-100">
          {results.map((result) => {
            const isSelected = selectedTracking === result.trackingNumber;
            return (
              <div
                key={result.trackingNumber}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 relative
                  ${isSelected ? 'bg-red-50 hover:bg-red-50/80' : ''}`}
                onClick={() => result.data && onSelect(result.trackingNumber)}
              >
                <div className="flex items-center gap-3">
                  {/* Indicador de estado */}
                  {result.loading ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                  ) : result.error ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}

                  {/* Información del envío */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.trackingNumber}
                    </p>
                    {result.error ? (
                      <p className="text-xs text-red-600 truncate">{result.error}</p>
                    ) : result.data ? (
                      <p className="text-xs text-gray-500 truncate">
                        {result.data.shipping_history.events
                          .filter(event => event.type === 'STATUS')
                          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0]?.description || 'Sin estado'}
                      </p>
                    ) : result.loading ? (
                      <p className="text-xs text-gray-500">Buscando...</p>
                    ) : (
                      <p className="text-xs text-gray-500">Sin datos</p>
                    )}
                  </div>

                  {/* Indicador de selección */}
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-corporate-primary flex-shrink-0" />
                  )}
                </div>

                {/* Borde izquierdo cuando está seleccionado */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-corporate-primary rounded-l" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de exportación */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        results={results}
      />
    </div>
  );
}