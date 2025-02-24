// Simulación de endpoints para eventos
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

  async cancelStatus(statusCode: string, eventDateTime: string, reason: string, userEmail: string = 'test@example.com') {
    const url = `${import.meta.env.VITE_API_URL}/item-status-v2/v1/items/${statusCode}/status/cancel`;
    
    const requestBody = {
      event_datetime: eventDateTime,
      status_id: statusCode,
      user_id: userEmail
    };

    console.log('Cancelando estado con los siguientes parámetros:');
    console.log('URL:', url);
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        error: 'Error al anular el estado'
      };
    }
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