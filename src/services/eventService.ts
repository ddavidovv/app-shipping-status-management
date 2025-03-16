// Simulación de endpoints para eventos
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
        const errorText = await response.text().catch(() => 'No se pudo leer el cuerpo de la respuesta');
        console.error(`❌ Server responded with status ${response.status}:`, errorText);
        
        // Crear un error más descriptivo
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (response.status === 500) {
          errorMessage = `Error del servidor (500): El servidor no pudo procesar la solicitud. Detalles: ${errorText.substring(0, 100)}`;
        } else if (response.status === 404) {
          errorMessage = `No se encontró el recurso (404): El bulto con código ${itemCode} no existe o no está disponible.`;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = `Error de autenticación (${response.status}): No tiene permisos para acceder a este recurso.`;
        } else if (response.status === 400) {
          errorMessage = `Solicitud incorrecta (400): Verifique el código del bulto e intente nuevamente.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Current item status received:', data.current_status);
      return data;
    } catch (err) {
      console.error('❌ Error fetching item status:', err);
      
      // Si es un error de red (no HTTP), proporcionar un mensaje más claro
      if (err instanceof Error && !err.message.includes('HTTP error')) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.');
        } else if (err.message.includes('timeout')) {
          throw new Error('Tiempo de espera agotado: El servidor tardó demasiado en responder. Intente nuevamente más tarde.');
        }
      }
      
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
        user_id: userEmail,
        reason: reason // Añadimos el motivo de la cancelación
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
        const errorData = await response.text();
        console.error('❌ Server error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
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
      user_id: userEmail,
      reason: "Motivo de cancelación" // Agregamos un motivo por defecto para el curl
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