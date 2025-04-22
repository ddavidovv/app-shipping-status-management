import { StatusCode } from '../types';

interface ForceStatusResponse {
  success: boolean;
  error?: string;
}

interface AdditionalInfo {
  [key: string]: string | number | boolean;
}

export const forceStatusService = {
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
        actionDatetime,
        additionalInfo
      });

      // Extraer la fecha de la acción del actionDatetime (YYYY-MM-DD)
      const actionDate = actionDatetime.split('T')[0];

      const payload = {
        shippingCode,
        action: "FORCE_STATUS",
        targetStatus,
        actionDatetime,
        actionDate,
        additionalInfo: additionalInfo || {}
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/force-status/v1/journey-snapshots`,
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
    const actionDate = actionDatetime.split('T')[0];

    const payload = {
      shippingCode,
      action: "FORCE_STATUS",
      targetStatus,
      actionDatetime,
      actionDate,
      additionalInfo: additionalInfo || {}
    };

    return `curl --location '${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/force-status/v1/journey-snapshots' \\
--header 'Content-Type: application/json' \\
--header 'client_id: ${import.meta.env.VITE_CLIENT_ID}' \\
--header 'client_secret: ${import.meta.env.VITE_CLIENT_SECRET}' \\
--header 'Authorization: ${import.meta.env.VITE_JWT_TOKEN}' \\
--data '${JSON.stringify(payload, null, 2)}'`;
  }
};
