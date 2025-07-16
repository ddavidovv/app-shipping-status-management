---
description: Refactoriza las llamadas al backend para usar Bearer tokens en lugar de client_id/client_secret.
---

### Guía para Refactorizar Llamadas al Backend y Usar Bearer Tokens

Este workflow te guiará para securizar las llamadas a la API, eliminando el envío de `client_id` y `client_secret` desde el frontend y sustituyéndolo por un Bearer token en la cabecera de autorización.

#### Paso 1: Localizar Credenciales Inseguras

El primer paso es encontrar todos los lugares en el código donde se utilizan `client_id` y `client_secret`.

*   **Acción:** Usa la herramienta de búsqueda (`grep_search`) para encontrar todas las ocurrencias.

    ```bash
    # Busca la cadena 'client_id' en todo el proyecto
    grep_search --query "client_id"

    # Busca la cadena 'client_secret' en todo el proyecto
    grep_search --query "client_secret"
    ```

#### Paso 2: Analizar y Modificar las Llamadas a la API

Una vez identificados los archivos, modifícalos para eliminar las credenciales y asegurarte de que se envía el Bearer token.

*   **Acción:** Por cada archivo encontrado:
    1.  Abre el archivo y localiza la función que realiza la llamada (`fetch`, `axios`, etc.).
    2.  Elimina las líneas que añaden `client_id` y `client_secret` a las cabeceras (`headers`) o al cuerpo (`body`) de la petición.
    3.  Verifica que la cabecera `Authorization` se está enviando correctamente.

*   **Ejemplo de cómo debe quedar la llamada:**

    ```javascript
    // Antes (ejemplo con fetch)
    const response = await fetch(url, {
      headers: {
        'client_id': '...',       // <-- ELIMINAR
        'client_secret': '...', // <-- ELIMINAR
        'Content-Type': 'application/json'
      }
    });

    // Después
    const token = sessionStorage.getItem('idToken'); // O de donde corresponda
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`, // <-- ASEGURAR QUE ESTÉ PRESENTE
        'Content-Type': 'application/json'
      }
    });
    ```

#### Paso 3: Verificar el Origen del Token

Es crucial que el token que se envía sea el correcto y esté disponible en el momento de la llamada.

*   **Acción:**
    1.  Identifica de dónde proviene el token (ej. `sessionStorage.getItem('idToken')`).
    2.  Si no está claro, busca dónde se almacena el token tras el inicio de sesión (ej. buscando `sessionStorage.setItem`). Esto suele estar en un contexto de autenticación (`AuthContext.tsx`, etc.).

#### Paso 4: Limpieza de Código (Opcional)

Para mantener el código limpio, elimina las variables de entorno que ya no se usan.

*   **Acción:**
    1.  Busca en el proyecto las variables de entorno como `VITE_CLIENT_ID` o `REACT_APP_CLIENT_ID`.
    2.  Si no se utilizan en ningún otro lugar, elimínalas de tus archivos `.env` y de la configuración de tu sistema de CI/CD.