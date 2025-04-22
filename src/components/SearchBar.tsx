import React from 'react';
import { Search, Loader2, Upload, AlertCircle, Eraser } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSearch: () => void;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  clearResults?: () => void; // Método opcional para forzar limpieza completa de resultados
}

export default function SearchBar({
  value,
  onChange,
  onKeyDown,
  onSearch,
  isExpanded,
  setIsExpanded,
  loading,
  error,
  clearResults
}: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => !value && setIsExpanded(false)}
              placeholder="Introduce uno o varios números de seguimiento (separados por comas, tabulaciones o saltos de línea)"
              className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 ${isExpanded ? 'min-h-[80px]' : 'min-h-[42px] max-h-[42px] overflow-hidden'}`}
              disabled={loading}
            />
            {/* Botón limpiar más visible con texto */}
            {value && !loading && (
              <button
                type="button"
                onClick={() => {
                  console.log('🧹 SearchBar: Botón Clean presionado - valor actual:', value);
                  onChange("");
                  setIsExpanded(false);
                  
                  // Usar clearResults directamente si está disponible
                  if (clearResults) {
                    console.log('🧹 SearchBar: Usando clearResults directamente para limpieza completa');
                    clearResults();
                  } else {
                    console.log('🧹 SearchBar: clearResults no disponible, usando onSearch() como fallback');
                    onSearch(); // Método alternativo si clearResults no está disponible
                  }
                  
                  console.log('🧹 SearchBar: Limpieza completada');
                }}
                className="absolute top-2 right-2 bg-gray-100 shadow-md rounded-full p-2 transition-all duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
                style={{ transition: 'all 0.2s' }}
                aria-label="Limpiar filtro"
              >
                <Eraser className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            <Upload className="w-4 h-4 inline-block mr-1" />
            Puedes pegar múltiples envíos desde Excel (usa Shift + Enter para añadir saltos de línea)
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <button
          onClick={onSearch}
          disabled={loading || !value.trim()}
          className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-fit"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Buscar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}