import { StatusCode } from '../types';
import { CheckCircle2, Box, CircleDot, Mail } from 'lucide-react';

// Definición de todos los códigos de estado con sus descripciones
export const STATUS_CODES = {
  '0701': 'Mercancía no enlazada en Origen',
  '0900': 'En tránsito',
  '1001': 'Mercancía no enlaza en Cruce',
  '1100': 'Llegada por Error a Delegación',
  '1200': 'Delegación destino',
  '1500': 'En reparto',
  '1600': 'Reparto Fallido',
  '1700': 'Envío Estacionado',
  '1800': 'Estacionado Ubicado',
  '1900': 'Pendiente de Extracción',
  '2100': 'Entregado',
  '2200': 'Entregado Parcial',
  '2300': 'Depositado en PUDO',
  '2310': 'Disponible en PUDO',
  '2400': 'Nuevo reparto',
  '2500': 'Devolución',
  '2700': 'Almacén Regulador',
  '3000': 'Anulado',
} as const;

// Estructura que define qué acciones están permitidas para cada código de estado
export const STATUS_ACTIONS = {
  // Estados que permiten asignar a reparto
  ASSIGNABLE_STATUS_CODES: [
    '1200', // Delegación destino
    '0900', // En tránsito
    '1600', // Reparto fallido
    '2400', //Nuevo reparto
    '1700', // Estacionado
    '0900', // En tránsito
  ] as StatusCode[],

  // Estados que permiten realizar una entrega
  DELIVERABLE_STATUS_CODES: [
    '1500', // En reparto
    '1600', // Reparto fallido
    '1700', // Estacionado
    '1200', // Delegación destino
    '2300', // Depositado en PUDO
    '2400', // Nuevo reparto
    '0900', // En tránsito
    '2900', // Recogerán en Delegación
  ] as StatusCode[],

  // Estados que pueden ser anulados
  CANCELLABLE_STATUS_CODES: [
    '2100', // Entregado
    '2300', // Depositado en PUDO
    '1500', // En reparto
    '1200', // Delegación destino
    '1600', // Reparto Fallido
    '1700', // Estacionado
    '2400', // Nuevo reparto
    '2500', // Devolución
    '3000', // Anulado
  ] as StatusCode[],
};

// Funciones helper para verificar si un estado permite una acción específica
export const isStatusAssignable = (statusCode: StatusCode): boolean => {
  const normalizedStatusCode = String(statusCode).trim();
  return STATUS_ACTIONS.ASSIGNABLE_STATUS_CODES.includes(normalizedStatusCode as StatusCode);
};

export const isStatusDeliverable = (statusCode: StatusCode): boolean => {
  const normalizedStatusCode = String(statusCode).trim();
  return STATUS_ACTIONS.DELIVERABLE_STATUS_CODES.includes(normalizedStatusCode as StatusCode);
};

export const isStatusCancellable = (statusCode: StatusCode): boolean => {
  const normalizedStatusCode = String(statusCode).trim();
  return STATUS_ACTIONS.CANCELLABLE_STATUS_CODES.includes(normalizedStatusCode as StatusCode);
};

// Función para obtener la descripción de un código de estado
export const getStatusDescription = (statusCode: StatusCode): string => {
  return STATUS_CODES[statusCode as keyof typeof STATUS_CODES] || 'Estado desconocido';
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
