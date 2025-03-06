import React, { useState, useEffect } from 'react';
import { X, Loader2, Clock, MapPin, Phone, AlertCircle, ExternalLink } from 'lucide-react';
import { PudoPoint } from '../types';
import { pudoService } from '../services/pudoService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  organicPointCode: string;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export default function PudoInfoModal({
  isOpen,
  onClose,
  organicPointCode
}: Props) {
  const [pudoInfo, setPudoInfo] = useState<PudoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && organicPointCode) {
      setLoading(true);
      setError(null);
      
      pudoService.getPudoPoint(organicPointCode)
        .then(data => {
          setPudoInfo(data);
        })
        .catch(err => {
          console.error('Error fetching PUDO info:', err);
          setError(err instanceof Error ? err.message : 'Error al obtener información del punto PUDO');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, organicPointCode]);

  if (!isOpen) return null;

  const openGoogleMaps = (latitude: number, longitude: number) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Información del Punto PUDO</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-corporate-primary animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Cargando información...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : pudoInfo && (
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-semibold text-corporate-primary mb-2">
                {pudoInfo.point_name}
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Proveedor:</span> {pudoInfo.provider_code}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Código del punto:</span> {pudoInfo.point_code}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Estado:</span>{' '}
                  <span className={pudoInfo.is_active === '1' ? 'text-green-600' : 'text-red-600'}>
                    {pudoInfo.is_active === '1' ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-corporate-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Dirección</h4>
                  <p className="text-sm text-gray-600">{pudoInfo.address.address}</p>
                  {pudoInfo.address.address2 && (
                    <p className="text-sm text-gray-600">{pudoInfo.address.address2}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {pudoInfo.address.postal_code} ({pudoInfo.address.country_code})
                  </p>
                  {pudoInfo.address.gps_location && (
                    <button
                      onClick={() => openGoogleMaps(
                        pudoInfo.address.gps_location.latitude,
                        pudoInfo.address.gps_location.longitude
                      )}
                      className="mt-2 text-sm text-corporate-primary hover:text-red-800 flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en Google Maps
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Teléfono */}
            {pudoInfo.phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-corporate-primary" />
                <div>
                  <h4 className="font-medium text-gray-900">Teléfono</h4>
                  <p className="text-sm text-gray-600">{pudoInfo.phone_number}</p>
                </div>
              </div>
            )}

            {/* Horario */}
            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-corporate-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Horario de apertura</h4>
                  <div className="grid gap-2">
                    {pudoInfo.openning_hours
                      .sort((a, b) => a.day_of_week - b.day_of_week)
                      .map((day) => (
                        <div key={day.day_of_week} className="flex items-center text-sm">
                          <span className="w-24 font-medium text-gray-700">
                            {DAYS_OF_WEEK[day.day_of_week]}
                          </span>
                          <div className="flex-1">
                            {day.hours.map((hour, index) => (
                              <span key={index} className="text-gray-600">
                                {index > 0 && ' y '}{hour.from} - {hour.to}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}