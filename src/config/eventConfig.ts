import { StatusCode, EventType } from '../types';
import { Package, Truck, Mail, CheckCircle2, Box, CircleDot } from 'lucide-react';

// Estados que pueden ser anulados
export const CANCELLABLE_STATUS_CODES: StatusCode[] = [
  '1500', // En reparto
  '1600', // Reparto fallido
  '1200', // Delegación destino
  '0900'  // En tránsito
];

// Función helper para verificar si un estado es anulable
export const isStatusCancellable = (statusCode: StatusCode): boolean => {
  return CANCELLABLE_STATUS_CODES.includes(statusCode);
};

// Mapeo de tipos de eventos a sus iconos
export const EVENT_TYPE_ICONS = {
  'STATUS': CheckCircle2,
  'EVENT': Box,
  'SHIPPING_ITEM_EVENT_V1': CircleDot,
  'NOTIFICATION_V1': Mail
} as const;

// Mapeo de tipos de eventos a sus descripciones
export const EVENT_TYPE_DESCRIPTIONS = {
  'STATUS': 'Estado del envío',
  'EVENT': 'Evento general',
  'SHIPPING_ITEM_EVENT_V1': 'Evento de envío',
  'NOTIFICATION_V1': 'Notificación'
} as const;

// Mapeo de tipos de eventos a sus colores
export const EVENT_TYPE_COLORS = {
  'STATUS': 'text-green-600',
  'EVENT': 'text-blue-600',
  'SHIPPING_ITEM_EVENT_V1': 'text-purple-600',
  'NOTIFICATION_V1': 'text-amber-600'
} as const;