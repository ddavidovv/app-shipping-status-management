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

export const deliveryService = {
  async deliverShipment(
    shippingCode: string,
    isPudo: boolean,
    signee: SigneeInfo,
    actionDateTime: string = new Date().toISOString()
  ): Promise<DeliveryResponse> {
    try {
      const payload = {
        routeCode: "280C0000", // TODO: Get from shipping history
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
      routeCode: "280C0000", // TODO: Get from shipping history
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

  getRouteCodeFromHistory(data: ShippingData): string | null {
    // Buscar el último evento de entrega que tenga route_code
    const deliveryEvent = data.shipping_history.events
      .filter(event => event.detail?.route_code)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

    return deliveryEvent?.detail?.route_code || null;
  }
};