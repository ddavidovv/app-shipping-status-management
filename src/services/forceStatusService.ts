import { StatusCode } from '../types';

interface ForceStatusResponse {
  success: boolean;
  error?: string;
}

interface AdditionalInfo {
  [key: string]: string | number | boolean;
}

// Mapeo de códigos de estado a identificadores de estado forzado
interface EventTypeMapping {
  force_status_id: string;
  description: string;
}

// Configuración para mapear estados a identificadores de estado forzado
const EVENT_TYPE_MAPPING: Record<StatusCode, EventTypeMapping> = {
  '0000': {
    force_status_id: 'MANIFEST',
    description: 'Manifiesto'
  },
  '0010': {
    force_status_id: 'PROVISIONAL_ACCEPTANCE',
    description: 'Aceptación provisional'
  },
  '0020': {
    force_status_id: 'PUDO_DEPOSIT_PENDING',
    description: 'Pendiente de depósito en PUDO'
  },
  '0030': {
    force_status_id: 'PUDO_PICKUP_PENDING',
    description: 'Pendiente de recogida en PUDO'
  },
  '0100': {
    force_status_id: 'PICKUP_REJECTED',
    description: 'Recogida rechazada'
  },
  '0200': {
    force_status_id: 'PICKUP_PENDING_ACCEPTANCE',
    description: 'Recogida pendiente de aceptación'
  },
  '0300': {
    force_status_id: 'PICKUP_IN_DELIVERY',
    description: 'Recogida Realizada'
  },
  '0400': {
    force_status_id: 'PICKUP_CANCELED',
    description: 'Recogida cancelada'
  },
  '0500': {
    force_status_id: 'PICKED',
    description: 'Recogido'
  },
  '0600': {
    force_status_id: 'PICKUP_FAILED',
    description: 'Recogida fallida'
  },
  '0701': {
    force_status_id: 'UNLINKED_MERCHANDISE_ORIGIN',
    description: 'Mercancía no enlazada en Origen'
  },
  '0900': {
    force_status_id: 'TRANSIT',
    description: 'En tránsito'
  },
  '1000': {
    force_status_id: 'PLATFORM_TRANSIT',
    description: 'Tránsito por plataforma'
  },
  '1100': {
    force_status_id: 'IN_AGENCY_ERROR',
    description: 'Llegada por Error a Delegación'
  },
  '1200': {
    force_status_id: 'HUB_DESTIN',
    description: 'Delegación destino'
  },
  '1500': {
    force_status_id: 'DELIVERY',
    description: 'En reparto'
  },
  '1600': {
    force_status_id: 'DELIVERY_FAILED',
    description: 'Reparto fallido'
  },
  '1700': {
    force_status_id: 'PARKED',
    description: 'Envío Estacionado'
  },
  '1800': {
    force_status_id: 'PARKED_LOCATED',
    description: 'Estacionado Ubicado'
  },
  '1900': {
    force_status_id: 'EXTRACTION_PENDING',
    description: 'Pendiente de Extracción'
  },
  '2100': {
    force_status_id: 'DELIVERED',
    description: 'Entregado'
  },
  '2200': {
    force_status_id: 'PARTIAL_DELIVERED',
    description: 'Entregado Parcial'
  },
  '2300': {
    force_status_id: 'PUDO_DEPOSIT',
    description: 'Depositado en PUDO'
  },
  '2310': {
    force_status_id: 'PUDO_AVAILABLE',
    description: 'Disponible en PUDO'
  },
  '2400': {
    force_status_id: 'IN_AGENCY_NEW_DELIVERY',
    description: 'Nuevo reparto'
  },
  '2500': {
    force_status_id: 'RETURNED',
    description: 'Devolución'
  },
  '2900': {
    force_status_id: 'AGENCY_COLLECT',
    description: 'Recogerán en Delegación'
  },
  '3000': {
    force_status_id: 'ANNULLED',
    description: 'Anulado'
  }
};

// Obtener todos los tipos de eventos disponibles como lista
export const getEventTypes = (): {code: StatusCode, description: string, force_status_id: string}[] => {
  return Object.entries(EVENT_TYPE_MAPPING).map(([code, mapping]) => ({
    code: code as StatusCode,
    description: mapping.description,
    force_status_id: mapping.force_status_id
  }));
};

export const forceStatusService = {
  // Método para obtener la configuración de tipos de eventos
  getEventTypeMapping() {
    return EVENT_TYPE_MAPPING;
  },

  async forceShipmentStatus(
    shippingCode: string,
    targetStatus: StatusCode,
    actionDatetime: string = new Date().toISOString(),
    additionalInfo?: AdditionalInfo
  ): Promise<ForceStatusResponse> {
    try {
      console.log('Enviando petición de forzado de estado:', {
        shippingCode,
        targetStatus,
        actionDatetime
      });

      // Obtener la información de tipo de evento correspondiente al estado
      const eventMapping = EVENT_TYPE_MAPPING[targetStatus] || {
        force_status_id: 'DEFAULT_STATUS',
        description: 'Estado forzado'
      };

      // Generar un ID único para la transacción (UUID v4)
      const uuid = crypto.randomUUID();

      // Formato ISO para fecha/hora
      const isoTimestamp = new Date().toISOString();

      // Obtener el correo electrónico del usuario de los parámetros adicionales o usar un valor por defecto
      const userEmail = additionalInfo?.userEmail || 'sistema@ctt.es';
      
      // Obtener fecha actual del sistema (momento de la llamada a la API) en formato ISO con Z al final
      // Esta será usada para action_datetime en el objeto audit
      const currentIsoDateTime = new Date().toISOString().replace(/\.\d+Z?$/, 'Z');
      
      // Crear un UID para la operación
      const operationUid = crypto.randomUUID();
      
      // Construir el nuevo payload según el formato solicitado con los atributos adicionales
      // Asegurarse de que event_datetime (fecha especificada por el usuario) está en el formato correcto
      // Convertimos la fecha de entrada a formato ISO y aseguramos que termine con Z
      const formattedEventDatetime = new Date(actionDatetime).toISOString().replace(/\.\d+Z?$/, 'Z');

      const payload = {
        metadata: {
          correlation_id: uuid,
          data_type: "schema/json/traffic/traffic-cdc-package-event-v1.json",
          interchange_id: uuid,
          source: "urn:com:cttexpress:interchange:source:adt-service",
          timestamp: isoTimestamp
        },
        package_event: {
          event_info: [{
            platform_code: "",
            force_status_id: eventMapping.force_status_id
          }],
          audit: {
            operation_hub_code: additionalInfo?.hubCode as string || "",
            user_code: userEmail,
            operation_uid: operationUid,
            action_datetime: currentIsoDateTime  // Fecha/hora del sistema cuando se llama a la API
          },
          event_datetime: formattedEventDatetime,  // Fecha/hora especificada por el usuario
          event_type_code: "FORCE_STATUS_EVENT",
          package_code: shippingCode,
          event_type_version: "1.0",
          event_source_code: "nexus"
        }
      };

      // Utilizar la URL base del .env y concatenar la ruta del endpoint
      const baseUrl = import.meta.env.VITE_API_URL || 'https://api-test.cttexpress.com';
      const response = await fetch(
        `${baseUrl}/enterprise-portal/incident-mgmt/fix/v1/package-events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'client_id': import.meta.env.VITE_CLIENT_ID,
            'client_secret': import.meta.env.VITE_CLIENT_SECRET,
            'Authorization': import.meta.env.VITE_JWT_TOKEN
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al forzar el estado del envío:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al forzar el estado del envío'
      };
    }
  },

  generateCurlCommand(
    shippingCode: string,
    targetStatus: StatusCode,
    actionDatetime: string,
    additionalInfo?: AdditionalInfo
  ): string {
    // Obtener la información de tipo de evento correspondiente al estado
    const eventMapping = EVENT_TYPE_MAPPING[targetStatus] || {
      force_status_id: 'DEFAULT_STATUS',
      description: 'Estado forzado'
    };

    // Generar un ID único para la transacción (UUID v4 o simulado si no está disponible)
    const uuid = crypto.randomUUID ? crypto.randomUUID() : 
      'c57784a1-0841-46b9-8aca-179a629c88fe';

    // Formato ISO para fecha/hora
    const isoTimestamp = new Date().toISOString();

    // Obtener el correo electrónico del usuario de los parámetros adicionales o usar un valor por defecto
    const userEmail = additionalInfo?.userEmail || 'sistema@ctt.es';
    
    // Obtener fecha actual del sistema (momento de la llamada a la API) en formato ISO con Z al final
    // Esta será usada para action_datetime en el objeto audit
    const currentIsoDateTime = new Date().toISOString().replace(/\.\d+Z?$/, 'Z');
    
    // Crear un UID para la operación
    const operationUid = crypto.randomUUID ? crypto.randomUUID() : 
      'op-' + uuid.substring(0, 8);
    
    // Construir el nuevo payload según el formato solicitado con atributos adicionales
    // Asegurarse de que event_datetime (fecha especificada por el usuario) está en el formato correcto
    // Convertimos la fecha de entrada a formato ISO y aseguramos que termine con Z
    const formattedEventDatetime = new Date(actionDatetime).toISOString().replace(/\.\d+Z?$/, 'Z');
    
    const payload = {
      metadata: {
        correlation_id: uuid,
        data_type: "schema/json/traffic/traffic-cdc-package-event-v1.json",
        interchange_id: uuid,
        source: "urn:com:cttexpress:interchange:source:adt-service",
        timestamp: isoTimestamp
      },
      package_event: {
        event_info: [{
          platform_code: "",
          force_status_id: eventMapping.force_status_id
        }],
        audit: {
          operation_hub_code: additionalInfo?.hubCode as string || "",
          user_code: userEmail,
          operation_uid: operationUid,
          action_datetime: currentIsoDateTime  // Fecha/hora del sistema cuando se llama a la API
        },
        event_datetime: formattedEventDatetime,  // Fecha/hora especificada por el usuario
        event_type_code: "FORCE_STATUS_EVENT",
        package_code: shippingCode,
        event_type_version: "1.0",
        event_source_code: "nexus"
      }
    };

    // Utilizar la URL base del .env
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api-test.cttexpress.com';
    return `curl --location '${baseUrl}/enterprise-portal/incident-mgmt/fix/v1/package-events' \
--header 'Content-Type: application/json' \
--header 'client_id: ${import.meta.env.VITE_CLIENT_ID}' \
--header 'client_secret: ${import.meta.env.VITE_CLIENT_SECRET}' \
--header 'Authorization: ${import.meta.env.VITE_JWT_TOKEN}' \
--data '${JSON.stringify(payload, null, 2)}'`;
  }
};
