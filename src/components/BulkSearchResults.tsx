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
    <div className="space-y-4">
      {/* Resumen estadístico */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Encontrados</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-600 mt-2">{stats.success}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Errores</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-red-600 mt-2">{stats.error}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Pendientes</span>
            {stats.loading > 0 ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <p className="text-2xl font-semibold text-blue-600 mt-2">{stats.loading}</p>
        </div>
      </div>

      {/* Lista de resultados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {results.map((result) => {
          const isSelected = selectedTracking === result.trackingNumber;
          return (
            <div
              key={result.trackingNumber}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 relative
                ${isSelected ? 'bg-red-50 hover:bg-red-50/80' : ''}`}
              onClick={() => result.data && onSelect(result.trackingNumber)}
            >
              <div className="flex items-center gap-4">
                {/* Indicador de estado */}
                {result.loading ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : result.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}

                {/* Información del envío */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.trackingNumber}
                  </p>
                  {result.error ? (
                    <p className="text-sm text-red-600">{result.error}</p>
                  ) : result.data ? (
                    <p className="text-sm text-gray-500">
                      {result.data.shipping_status_code
                        ? `Estado: ${result.data.shipping_status_code}`
                        : 'Sin estado'}
                    </p>
                  ) : result.loading ? (
                    <p className="text-sm text-gray-500">Buscando...</p>
                  ) : (
                    <p className="text-sm text-gray-500">Sin datos</p>
                  )}
                </div>

                {/* Indicador de selección */}
                {isSelected && (
                  <div className="flex items-center text-corporate-primary">
                    <ArrowRight className="w-5 h-5" />
                  </div>
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
  );
}