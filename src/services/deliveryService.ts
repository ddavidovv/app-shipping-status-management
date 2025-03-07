import { ShippingData } from '../types';

interface SigneeInfo {
  name: string;
  image_id?: string;
  identifier?: string;
}

interface DeliveryResponse {
  success: boolean;
  error?: string;
}

// Estados que permiten realizar una entrega
const DELIVERABLE_STATUS_CODES = [
  '1500', // En reparto
  '1600', // Reparto fallido
  '1200', // Delegación destino
  '0900', // En tránsito
];

export const deliveryService = {
  async deliverShipment(
    shippingCode: string,
    isPudo: boolean,
    signee: SigneeInfo,
    actionDateTime: string = new Date().toISOString()
  ): Promise<DeliveryResponse> {
    try {
      console.log('Enviando petición de entrega:', {
        shippingCode,
        isPudo,
        signee,
        actionDateTime
      });

      const payload = {
        routeCode: "280C0000",
        shippingCode,
        action: "DELIVER",
        signee: {
          ...signee,
          image_id: ""
        },
        typeNumber: isPudo ? 6 : 3,
        optionCode: "",
        actionDateTime,
        stopOrder: 0
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
    actionDateTime: string
  ): string {
    const payload = {
      routeCode: "280C0000",
      shippingCode,
      action: "DELIVER",
      signee: {
        ...signee,
        image_id: ""
      },
      typeNumber: isPudo ? 6 : 3,
      optionCode: "",
      actionDateTime,
      stopOrder: 0
    };

    return `curl --location '${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/last-mile/v1/journey-snapshots' \\
--header 'Content-Type: application/json' \\
--header 'client_id: ${import.meta.env.VITE_CLIENT_ID}' \\
--header 'client_secret: ${import.meta.env.VITE_CLIENT_SECRET}' \\
--header 'Authorization: ${import.meta.env.VITE_JWT_TOKEN}' \\
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

  isDeliveryAllowed(data: { shipping_status_code: string }): boolean {
    // Si el envío está entregado, no permitir entrega
    if (data.shipping_status_code === '2100') {
      return false;
    }

    // Permitir entrega para los estados definidos
    return DELIVERABLE_STATUS_CODES.includes(data.shipping_status_code);
  }
};