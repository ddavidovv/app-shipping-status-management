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
    } catch (error) {
      console.error('Error cancelling status:', error);
      return {
        success: false,
        error: 'Error al anular el estado'
      };
    }
  }
};