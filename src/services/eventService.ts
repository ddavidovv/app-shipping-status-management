// Simulación de endpoints para eventos
import { useAuth } from '../context/AuthContext';
import { ItemStatusResponse } from '../types';

export const eventService = {
  async getItemStatus(itemCode: string): Promise<ItemStatusResponse> {
    console.log('📡 Fetching current item status for:', itemCode);
    const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-status-v2/v1/item/${itemCode}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': import.meta.env.VITE_JWT_TOKEN,
          'client_secret': import.meta.env.VITE_CLIENT_SECRET,
          'client_id': import.meta.env.VITE_CLIENT_ID
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Current item status received:', data.current_status);
      return data;
    } catch (err) {
      console.error('❌ Error fetching item status:', err);
      throw err;
    }
  },

  async createEvent(eventData: any) {
    // Simular llamada al backend
    console.log('Creating event:', eventData);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simular respuesta exitosa
    return {
      success: true,
      data: {
        ...eventData,
        id: crypto.randomUUID()
      }
    };
  },

  async cancelStatus(itemCode: string, eventDateTime: string, reason: string, statusDescription: string) {
    // Obtener el email del usuario desde sessionStorage
    let userEmail = 'test@example.com'; // Valor por defecto
    
    try {
      const token = sessionStorage.getItem('idToken');
      if (token) {
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.email) {
          userEmail = decodedPayload.email;
        }
      }

      // Primero obtenemos el estado actual del bulto
      console.log('🔍 Fetching current status before cancellation...');
      const itemStatus = await this.getItemStatus(itemCode);
      console.log('📦 Current status:', itemStatus.current_status);

      // Construir la URL correcta para la cancelación de estado
      const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-status-v2/v1/item/${itemCode}/cancel-status`;
      
      // Usamos los datos del estado actual para la cancelación
      const requestBody = {
        event_datetime: itemStatus.current_status.status_datetime,
        status_id: itemStatus.current_status.status_id,
        user_id: userEmail
      };

      console.log('📤 Sending cancellation request with params:', {
        url,
        body: requestBody
      });
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': import.meta.env.VITE_JWT_TOKEN,
          'client_secret': import.meta.env.VITE_CLIENT_SECRET,
          'client_id': import.meta.env.VITE_CLIENT_ID
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Cancellation response:', data);
      
      return {
        success: true,
        data
      };
    } catch (err) {
      console.error('❌ Error during status cancellation:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al anular el estado'
      };
    }
  },

  // Método para generar el comando curl para debug
  generateCurlCommand(itemCode: string, eventDateTime: string, statusDescription: string) {
    // Obtener el email del usuario desde sessionStorage
    let userEmail = 'test@example.com'; // Valor por defecto
    
    try {
      const token = sessionStorage.getItem('idToken');
      if (token) {
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.email) {
          userEmail = decodedPayload.email;
        }
      }
    } catch (error) {
      console.error('Error al obtener el email del usuario:', error);
    }
    
    // Aquí usamos el código del bulto en la URL
    const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-status-v2/v1/item/${itemCode}/cancel-status`;
    
    // En el body, status_id es la descripción del estado que queremos anular
    const requestBody = {
      event_datetime: eventDateTime,
      status_id: statusDescription,
      user_id: userEmail
    };

    // Generar el comando curl
    const curlCommand = `curl --location --request PATCH '${url}' \\
--header 'Content-Type: application/json' \\
--header 'client_id: ${import.meta.env.VITE_CLIENT_ID}' \\
--header 'client_secret: ${import.meta.env.VITE_CLIENT_SECRET}' \\
--header 'Authorization: ${import.meta.env.VITE_JWT_TOKEN}' \\
--data '${JSON.stringify(requestBody, null, 2)}'`;

    return curlCommand;
  },

  async resetFlags(itemCode: string) {
    const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/incident-mgmt/sorters/v1/items/${itemCode}/rpc-reset-relabelling-and-changes-flag`;
    
    const requestBody = {
      user_id: "22",
      machine_id: "22",
      hub_code: "008280"
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'jwt-token': import.meta.env.VITE_JWT_TOKEN,
          'client_secret': import.meta.env.VITE_CLIENT_SECRET,
          'client_id': import.meta.env.VITE_CLIENT_ID
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error resetting flags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al resetear los flags'
      };
    }
  }
};