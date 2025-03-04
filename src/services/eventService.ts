// Simulación de endpoints para eventos
import { useAuth } from '../context/AuthContext';

export const eventService = {
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

  async cancelStatus(statusCode: string, eventDateTime: string, reason: string) {
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
    
    // Construir la URL correcta para la cancelación de estado
    // Aquí usamos el código del bulto, no el código de estado
    const itemCode = statusCode; // Renombrar para claridad
    const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-status-v2/v1/item/${itemCode}/cancel-status`;
    
    const requestBody = {
      event_datetime: eventDateTime,
      status_id: statusCode, // Usar el código de estado aquí
      user_id: userEmail
    };

    console.log('Cancelando estado con los siguientes parámetros:');
    console.log('URL:', url);
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    
    try {
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
      console.log('Respuesta del servidor:', data);
      
      return {
        success: true,
        data
      };
    } catch (err) {
      console.error('Error cancelling status:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al anular el estado'
      };
    }
  },

  // Método para generar el comando curl para debug
  generateCurlCommand(statusCode: string, eventDateTime: string) {
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
    
    // Aquí usamos el código del bulto, no el código de estado
    const itemCode = statusCode; // Renombrar para claridad
    const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/trf/item-status-v2/v1/item/${itemCode}/cancel-status`;
    
    const requestBody = {
      event_datetime: eventDateTime,
      status_id: statusCode, // Usar el código de estado aquí
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