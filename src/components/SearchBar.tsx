import React from 'react';
import { Search, Loader2, Upload, AlertCircle } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSearch: () => void;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  loading: boolean;
  error: string | null;
}

export default function SearchBar({
  value,
  onChange,
  onKeyDown,
  onSearch,
  isExpanded,
  setIsExpanded,
  loading,
  error
}: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
      <div className="flex gap-4">
        <div className="flex-1">
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
          <p className="mt-1 text-sm text-gray-500">
            <Upload className="w-4 h-4 inline-block mr-1" />
            Puedes pegar múltiples envíos desde Excel (usa Shift + Enter para añadir saltos de línea)
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <button
          onClick={onSearch}
          disabled={loading || !value.trim() || error !== null}
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