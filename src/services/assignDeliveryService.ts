import { ShippingData } from '../types';
import { isStatusAssignable } from '../config/shippingStatusConfig';

export const assignDeliveryService = {
  async assignToDelivery(
    shippingCode: string,
    routeCode: string,
    actionDatetime: string = new Date().toISOString()
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Enviando petición de asignación a reparto:', {
        shippingCode,
        routeCode,
        actionDatetime
      });

      const payload = {
        routeCode,
        shippingCode,
        action: "ASSIGN_DELIVERY",
        stopOrder: 0,
        actionDatetime
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/last-mile/v1/journey-snapshots`,
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
      console.error('Error assigning to delivery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al asignar a reparto'
      };
    }
  },

  generateCurlCommand(
    shippingCode: string,
    routeCode: string,
    actionDatetime: string
  ): string {
    const payload = {
      routeCode,
      shippingCode,
      action: "ASSIGN_DELIVERY",
      stopOrder: 0,
      actionDatetime
    };

    return `curl --location '${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/last-mile/v1/journey-snapshots' \\
--header 'Content-Type: application/json' \\
--header 'client_id: ${import.meta.env.VITE_CLIENT_ID}' \\
--header 'client_secret: ${import.meta.env.VITE_CLIENT_SECRET}' \\
--header 'Authorization: ${import.meta.env.VITE_JWT_TOKEN}' \\
--data '${JSON.stringify(payload, null, 2)}'`;
  },

  isAssignmentAllowed(data: ShippingData): boolean {
    console.log('Estado actual del envío:', data.shipping_status_code);
    console.log('¿Está en la lista de estados asignables?', isStatusAssignable(data.shipping_status_code));
    return isStatusAssignable(data.shipping_status_code);
  }
};
