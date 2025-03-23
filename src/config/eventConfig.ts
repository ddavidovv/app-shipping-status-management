import { CheckCircle2, Box, CircleDot, Mail } from 'lucide-react';
import { isStatusCancellable } from './shippingStatusConfig';

// Exportar la función isStatusCancellable desde la configuración centralizada
export { isStatusCancellable };

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