---
description: Sistema de autenticación para aplicaciones hijas React (con soporte para desarrollo local sin autenticación real)
---

# Workflow: Autenticación para Apps Hijas React

Este workflow explica cómo implementar el sistema de autenticación y comunicación entre una aplicación hija React y la aplicación principal, permitiendo desarrollo local sin autenticación real.

---

## 1. Contexto de Autenticación (`AuthContext` y `AuthProvider`)

Crea el archivo `src/contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  userEmail: string | null;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  idToken: null,
  loading: true,
  error: null,
  userEmail: null,
  userRole: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isAuthenticated: false,
    idToken: null,
    loading: true,
    error: null,
    userEmail: null,
    userRole: null,
  });

  // Permitir desarrollo local sin autenticación real
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  useEffect(() => {
    if (isLocalhost) {
      setState({
        isAuthenticated: true,
        idToken: 'mock-token-for-local-development',
        loading: false,
        error: null,
        userEmail: 'usuario@ejemplo.com',
        userRole: 'Operador',
      });
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Ignorar mensajes de React DevTools
      if (
        event.data?.source === 'react-devtools-content-script' ||
        event.data?.source === 'react-devtools-backend-manager' ||
        event.data?.source === 'react-devtools-bridge'
      ) {
        return;
      }

      if (event.data?.type === 'TOKEN_INIT' || event.data?.type === 'TOKEN_UPDATE') {
        const token = event.data.payload?.idToken;
        if (token && hasValidToken(token)) {
          sessionStorage.setItem('idToken', token);
          const userInfo = getUserInfoFromToken(token);
          setState({
            isAuthenticated: true,
            idToken: token,
            loading: false,
            error: null,
            userEmail: userInfo.email,
            userRole: userInfo.role,
          });
        } else {
          setState({
            isAuthenticated: false,
            idToken: null,
            loading: false,
            error: 'Token inválido',
            userEmail: null,
            userRole: null,
          });
        }
      } else if (event.data?.type === 'TOKEN_EXPIRED') {
        setState({
          isAuthenticated: false,
          idToken: null,
          loading: false,
          error: 'Token expirado',
          userEmail: null,
          userRole: null,
        });
        requestTokenFromOpener();
      }
    };

    const requestTokenFromOpener = () => {
      if (!window.opener) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Esta aplicación debe abrirse desde la aplicación principal',
        }));
        return;
      }
      try {
        window.opener.postMessage(
          {
            type: 'READY_FOR_TOKEN',
            source: 'CHILD_APP'
          },
          '*'
        );
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error de comunicación con la aplicación principal',
        }));
      }
    };

    const initAuth = () => {
      const storedToken = getIdToken();
      if (storedToken && hasValidToken(storedToken)) {
        const userInfo = getUserInfoFromToken(storedToken);
        setState({
          isAuthenticated: true,
          idToken: storedToken,
          loading: false,
          error: null,
          userEmail: userInfo.email,
          userRole: userInfo.role,
        });
      } else {
        requestTokenFromOpener();
      }
    };

    window.addEventListener('message', handleMessage);
    initAuth();

    let refreshInterval: number | null = null;
    if (window.opener) {
      refreshInterval = window.setInterval(() => {
        if (state.idToken) {
          try {
            window.opener?.postMessage(
              {
                type: 'TOKEN_REFRESH_REQUEST',
                source: 'CHILD_APP'
              },
              '*'
            );
          } catch {}
        }
      }, 4 * 60 * 1000);
    }
    return () => {
      window.removeEventListener('message', handleMessage);
      if (refreshInterval !== null) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.idToken, isLocalhost]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// --- Funciones Helper ---
const getIdToken = (): string | null => {
  try {
    return sessionStorage.getItem('idToken');
  } catch {
    return null;
  }
};

const hasValidToken = (token: string): boolean => {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return false;
    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000;
    return expirationTime > Date.now();
  } catch {
    return false;
  }
};

const getUserInfoFromToken = (token: string): { email: string | null; role: string | null } => {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    const email = decodedPayload.email || null;
    const role = decodedPayload.role || decodedPayload.roles?.[0] || decodedPayload['cognito:groups']?.[0] || null;
    return { email, role };
  } catch {
    return { email: null, role: null };
  }
};
```

---

## 2. Flujo de Comunicación y Manejo de Errores

- Si la app está en `localhost`, la autenticación real se omite y se usan datos mock.
- Si no hay token o está expirado, la app hija envía `READY_FOR_TOKEN` a la ventana principal.
- La ventana principal responde con `TOKEN_INIT` (primer token) o `TOKEN_UPDATE` (refresco).
- Cada 4 minutos, la app hija solicita refresco de token con `TOKEN_REFRESH_REQUEST`.
- Si el token expira, la principal envía `TOKEN_EXPIRED`.
- Manejo de errores:
  - Si la app no se abre desde la principal: "Esta aplicación debe abrirse desde la aplicación principal"
  - Error de comunicación: "Error de comunicación con la aplicación principal"
  - Token inválido: "Token inválido"
  - Token expirado: "Token expirado"

---

## 3. Control global de error de autenticación (muy importante)

> **IMPORTANTE:** Todas las aplicaciones hijas deben implementar un control global en su componente principal para bloquear la UI y mostrar una pantalla de error si la autenticación falla (por ejemplo, si no se abre desde la principal, el token es inválido o hay cualquier otro error).

### Ejemplo de implementación en el componente principal (App):

```tsx
function App() {
  const { loading, error, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error de autenticación</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Esta aplicación requiere autenticación para funcionar correctamente.</p>
        </div>
      </div>
    );
  }

  // ...el resto de la app
}
```

- Así se garantiza que la app no es utilizable si la autenticación falla.
- Es fundamental para la seguridad y la experiencia de usuario.

---

Este workflow te permite añadir autenticación robusta y soporte para desarrollo local a cualquier app hija React, siguiendo el patrón de comunicación con la app principal.
