import React from 'react';
import { Package, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { ShippingData } from '../types';

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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Encontrados</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-semibold text-green-600 mt-1">{stats.success}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Errores</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-semibold text-red-600 mt-1">{stats.error}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Pendientes</span>
            {stats.loading > 0 ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Package className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-xl font-semibold text-blue-600 mt-1">{stats.loading}</p>
        </div>
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
                        {result.data.shipping_status_code
                          ? `Estado: ${result.data.shipping_status_code}`
                          : 'Sin estado'}
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
    </div>
  );
}