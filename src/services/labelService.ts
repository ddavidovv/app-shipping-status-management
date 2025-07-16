export const labelService = {
    async printLabel(shippingCode: string) {
      const labelCode = shippingCode.length === 25 
        ? shippingCode.slice(0, -3)
        : shippingCode;
  
      const url = `${import.meta.env.VITE_API_URL}/enterprise-portal/incident-mgmt/trf/labelling/v1/shippings/${labelCode}/shipping-labels?label_type_code=PDF&model_type_code=SINGLE`;
  
      try {
        console.log("Fetching label from URL:", url);
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`,
            'Accept': 'application/json'
          }
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
  
        // Convertir la respuesta a JSON
        const responseData = await response.json();
  
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
          throw new Error('La API no devolvió datos válidos');
        }
  
        // Buscar una etiqueta válida
        const validLabel = responseData.data.find((item: { label: string }) => item.label && typeof item.label === "string");
  
        if (!validLabel) {
          throw new Error('No se encontró una etiqueta PDF válida en la respuesta');
        }
  
        // Decodificar la base64 de la etiqueta
        const pdfData = atob(validLabel.label);
        const pdfBlob = new Blob([new Uint8Array([...pdfData].map(c => c.charCodeAt(0)))], { type: 'application/pdf' });
  
        if (pdfBlob.size === 0) {
          throw new Error('El PDF está vacío');
        }
  
        // Crear URL del blob
        const pdfUrl = window.URL.createObjectURL(pdfBlob);
  
        // Crear un enlace temporal y simular clic
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // Limpiar la URL del blob después de un tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(pdfUrl);
        }, 5000);
  
        return { success: true };
      } catch (error) {
        console.error('Error printing label:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error al imprimir la etiqueta'
        };
      }
    }
  };
  