import { useState } from 'react';
import { X, FileSpreadsheet, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { ShippingData } from '../types';
import * as XLSX from 'xlsx';

interface ExportField {
  key: keyof ShippingData | string;
  label: string;
  group: string;
}

interface FieldGroup {
  name: string;
  fields: ExportField[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    name: 'Información básica',
    fields: [
      { key: 'shipping_code', label: 'Código de envío', group: 'Información básica' },
      { key: 'shipping_status_code', label: 'Estado', group: 'Información básica' },
      { key: 'shipping_type_code', label: 'Tipo de envío', group: 'Información básica' },
      { key: 'item_count', label: 'Número de bultos', group: 'Información básica' },
      { key: 'declared_weight', label: 'Peso declarado', group: 'Información básica' },
      { key: 'final_weight', label: 'Peso final', group: 'Información básica' },
      { key: 'hasReimbursement', label: 'Reembolso', group: 'Información básica' },
    ]
  },
  {
    name: 'Remitente',
    fields: [
      { key: 'sender_name', label: 'Nombre del remitente', group: 'Remitente' },
      { key: 'origin_address', label: 'Dirección', group: 'Remitente' },
      { key: 'origin_postal_code', label: 'Código postal', group: 'Remitente' },
      { key: 'origin_town_name', label: 'Ciudad', group: 'Remitente' },
      { key: 'origin_country_code', label: 'País', group: 'Remitente' },
    ]
  },
  {
    name: 'Destinatario',
    fields: [
      { key: 'recipient_name', label: 'Nombre del destinatario', group: 'Destinatario' },
      { key: 'destin_address', label: 'Dirección', group: 'Destinatario' },
      { key: 'destin_postal_code', label: 'Código postal', group: 'Destinatario' },
      { key: 'destin_town_name', label: 'Ciudad', group: 'Destinatario' },
      { key: 'destin_country_code', label: 'País', group: 'Destinatario' },
    ]
  },
  {
    name: 'Estados',
    fields: [
      { key: 'last_status', label: 'Último estado', group: 'Estados' },
      { key: 'last_status_date', label: 'Fecha último estado', group: 'Estados' },
    ]
  }
];

const AVAILABLE_FIELDS = FIELD_GROUPS.flatMap(group => group.fields);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: { trackingNumber: string; data: ShippingData | null; error?: string }[];
}

export default function ExportModal({ isOpen, onClose, results }: Props) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const isGroupSelected = (group: FieldGroup) => {
    return group.fields.every(field => selectedFields.includes(field.key));
  };

  const isGroupPartiallySelected = (group: FieldGroup) => {
    const selectedCount = group.fields.filter(field => selectedFields.includes(field.key)).length;
    return selectedCount > 0 && selectedCount < group.fields.length;
  };

  const toggleGroup = (group: FieldGroup) => {
    const groupFields = group.fields.map(f => f.key);
    if (isGroupSelected(group)) {
      setSelectedFields(prev => prev.filter(field => !groupFields.includes(field)));
    } else {
      setSelectedFields(prev => [...prev, ...groupFields.filter(field => !prev.includes(field))]);
    }
  };

  const toggleGroupExpand = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        return prev.filter(key => key !== fieldKey);
      }
      return [...prev, fieldKey];
    });
  };

  const handleSelectAll = () => {
    if (selectedFields.length === AVAILABLE_FIELDS.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(AVAILABLE_FIELDS.map(field => field.key));
    }
  };

  const generateFileName = () => {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '');
    const time = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '');
    return `envios_${date}_${time}.xlsx`;
  };

  const handleExport = () => {
    if (selectedFields.length === 0) return;

    const exportData = results
      .filter(result => result.data)
      .map(result => {
        const data = result.data!;
        const row: any = {};

        selectedFields.forEach(fieldKey => {
          if (fieldKey === 'last_status') {
            const lastStatus = data.shipping_history.events
              .filter(event => event.type === 'STATUS')
              .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
            row[fieldKey] = lastStatus?.description || '';
          } else if (fieldKey === 'last_status_date') {
            const lastStatus = data.shipping_history.events
              .filter(event => event.type === 'STATUS')
              .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
            row[fieldKey] = lastStatus?.event_date || '';
          } else if (fieldKey === 'hasReimbursement') {
            row[fieldKey] = data.hasReimbursement ? 'Sí' : 'No';
          } else {
            row[fieldKey] = data[fieldKey as keyof ShippingData] || '';
          }
        });

        return row;
      });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const header = selectedFields.map(fieldKey => {
      const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
      return field?.label || fieldKey;
    });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });

    XLSX.utils.book_append_sheet(wb, ws, 'Envíos');
    XLSX.writeFile(wb, generateFileName());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-corporate-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Exportar a Excel</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-3">
          <button
            onClick={handleSelectAll}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <Check className={`w-4 h-4 ${selectedFields.length === AVAILABLE_FIELDS.length ? 'text-corporate-primary' : 'text-gray-400'}`} />
            {selectedFields.length === AVAILABLE_FIELDS.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {FIELD_GROUPS.map((group) => (
            <div key={group.name} className="border rounded-lg">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isGroupSelected(group) ? (
                      <Check className="w-4 h-4 text-corporate-primary" />
                    ) : isGroupPartiallySelected(group) ? (
                      <div className="w-3 h-3 bg-corporate-primary rounded-sm" />
                    ) : (
                      <div className="w-4 h-4 border rounded" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroupExpand(group.name);
                  }}
                >
                  {expandedGroups[group.name] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </button>
              
              {expandedGroups[group.name] && (
                <div className="p-2 pt-0">
                  <div className="grid grid-cols-2 gap-1">
                    {group.fields.map((field) => (
                      <label
                        key={field.key}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.key)}
                          onChange={() => toggleField(field.key)}
                          className="rounded border-gray-300 text-corporate-primary focus:ring-corporate-primary"
                        />
                        <span className="text-sm text-gray-600">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedFields.length === 0}
            className="px-3 py-1.5 text-sm font-medium text-white bg-corporate-primary rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}