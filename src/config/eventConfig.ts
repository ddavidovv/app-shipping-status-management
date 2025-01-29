// Estados que pueden ser anulados
export const CANCELLABLE_STATUS_CODES = [
  '1500', // En reparto
  '1600', // Reparto fallido
  '1200', // Delegación destino
  '0900'  // En tránsito
];

// Función helper para verificar si un estado es anulable
export const isStatusCancellable = (statusCode: string): boolean => {
  return CANCELLABLE_STATUS_CODES.includes(statusCode);
};