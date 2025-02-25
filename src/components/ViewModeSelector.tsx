import { ViewMode } from '../types';
import { Package, Boxes, GitCompare } from 'lucide-react';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  packagesCount: number;
}

export default function ViewModeSelector({ viewMode, onViewModeChange, packagesCount }: Props) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onViewModeChange('shipping')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm
          ${viewMode === 'shipping' 
            ? 'bg-corporate-primary text-white border-corporate-primary' 
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
      >
        <Package className="w-4 h-4" />
        <span>Vista de Envío</span>
      </button>
      
      <button
        onClick={() => onViewModeChange('packages')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm
          ${viewMode === 'packages'
            ? 'bg-corporate-primary text-white border-corporate-primary'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
      >
        <Boxes className="w-4 h-4" />
        <span>Bultos ({packagesCount})</span>
      </button>

      {packagesCount > 1 && (
        <button
          onClick={() => onViewModeChange('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm
            ${viewMode === 'comparison'
              ? 'bg-corporate-primary text-white border-corporate-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Comparar Bultos</span>
        </button>
      )}
    </div>
  );
}