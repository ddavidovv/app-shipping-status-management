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

  async cancelStatus(packageCode: string, eventDateTime: string, statusId: string) {
    const url = `${import.meta.env.VITE_API_URL}/item-status-v2/v1/items/${packageCode}/cancel-status`;
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_datetime: eventDateTime,
          status_id: statusId,
          user_id: 'test-user' // TODO: Obtener el usuario real
        })
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
      console.error('Error cancelling status:', error);
      return {
        success: false,
        error: 'Error al anular el estado'
      };
    }
  }
};