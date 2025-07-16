import { ShippingData } from '../types';
import { isStatusDeliverable } from '../config/shippingStatusConfig';

interface SigneeInfo {
  name: string;
  image_id?: string;
  identifier?: string;
}

interface DeliveryResponse {
  success: boolean;
  error?: string;
}

export const deliveryService = {
  async deliverShipment(
    shippingCode: string,
    isPudo: boolean,
    signee: SigneeInfo,
    actionDatetime: string = new Date().toISOString(),
    routeCode: string
  ): Promise<DeliveryResponse> {
    try {
      console.log('Enviando petición de entrega:', {
        shippingCode,
        isPudo,
        signee,
        actionDatetime,
        routeCode
      });

      // Extraer la fecha de entrega del actionDatetime (YYYY-MM-DD)
      const deliveryDate = actionDatetime.split('T')[0];

      const payload = {
        routeCode,
        shippingCode,
        action: "DELIVER",
        signee: {
          ...signee,
          image_id: ""
        },
        typeNumber: isPudo ? 6 : 3,
        optionCode: "",
        actionDatetime,
        stopOrder: 0,
        deliveryDate
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/last-mile/v1/journey-snapshots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error delivering shipment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al realizar la entrega'
      };
    }
  },

  generateCurlCommand(
    shippingCode: string,
    isPudo: boolean,
    signee: SigneeInfo,
    actionDatetime: string,
    routeCode: string
  ): string {
    const deliveryDate = actionDatetime.split('T')[0];

    const payload = {
      routeCode,
      shippingCode,
      action: "DELIVER",
      signee: {
        ...signee,
        image_id: ""
      },
      typeNumber: isPudo ? 6 : 3,
      optionCode: "",
      actionDatetime,
      stopOrder: 0,
      deliveryDate
    };

    return `curl --location '${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/last-mile/v1/journey-snapshots' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer ${sessionStorage.getItem('idToken')}' \\ \\
--data '${JSON.stringify(payload, null, 2)}'`;
  },

  isPudoDeliveryAllowed(data: ShippingData): boolean {
    return data.additionals?.some(additional => 
      additional.additionalCode === "PER"
    ) ?? false;
  },

  isDelivered(data: ShippingData): boolean {
    return data.shipping_status_code === '2100';
  },

  isDeliveryAllowed(data: ShippingData): boolean {
    return isStatusDeliverable(data.shipping_status_code);
  }
};