import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [, payload] = token.split('.');
    if (!payload) return false;
    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000;
    return expirationTime > Date.now();
  } catch {
    return false;
  }
};

const getUserInfoFromToken = (token: string): { email: string | null; roles: string[]; hub_codes: string[] } => {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    console.log('[AuthContext] Decoded token payload:', JSON.stringify(decodedPayload, null, 2));
    const email = decodedPayload.email || null;
    // Normalizar roles y hub_codes a arrays
    const roles = decodedPayload.roles ? (Array.isArray(decodedPayload.roles) ? decodedPayload.roles : [decodedPayload.roles]) : (decodedPayload['cognito:groups'] ? (Array.isArray(decodedPayload['cognito:groups']) ? decodedPayload['cognito:groups'] : [decodedPayload['cognito:groups']]) : []);
    const hub_codes = decodedPayload.hub_codes ? (Array.isArray(decodedPayload.hub_codes) ? decodedPayload.hub_codes : [decodedPayload.hub_codes]) : [];
    const userInfo = { email, roles, hub_codes };
    console.log('[AuthContext] Extracted user info:', JSON.stringify(userInfo, null, 2));
    return userInfo;
  } catch {
    return { email: null, roles: [], hub_codes: [] };
  }
};

interface AuthContextType {
  isAuthenticated: boolean;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  email: string | null;
  roles: string[];
  hub_codes: string[];
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  idToken: null,
  loading: true,
  error: null,
  email: null,
  roles: [],
  hub_codes: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isAuthenticated: false,
    idToken: null,
    loading: true,
    error: null,
    email: null,
    roles: [],
    hub_codes: [],
  });

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    if (isLocalhost) {
      console.warn('[AuthContext] Ejecutando en modo local. Usando datos de autenticación simulados.');
      setState({
        isAuthenticated: true,
        idToken: 'mock-token-for-local-development',
        loading: false,
        error: null,
        email: 'usuario@ejemplo.com',
        roles: ['Admin', 'Operations_Central'], // Roles para pruebas locales
        hub_codes: ['MAD1', 'BCN2'], // Hubs para pruebas locales
      });
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.source?.startsWith('react-devtools-')
      ) {
        return;
      }

      if (event.data?.type === 'TOKEN_INIT' || event.data?.type === 'TOKEN_UPDATE') {
        console.log('[AuthContext] Received token message:', JSON.stringify(event.data, null, 2));
        const token = event.data.payload?.idToken;
        if (token && hasValidToken(token)) {
          sessionStorage.setItem('idToken', token);
          const userInfo = getUserInfoFromToken(token);
          setState({
            isAuthenticated: true,
            idToken: token,
            loading: false,
            error: null,
            email: userInfo.email,
            roles: userInfo.roles,
            hub_codes: userInfo.hub_codes,
          });
        } else {
          sessionStorage.removeItem('idToken');
          setState(prev => ({ ...prev, isAuthenticated: false, idToken: null, loading: false, error: 'Token inválido' }));
        }
      } else if (event.data?.type === 'TOKEN_EXPIRED') {
        sessionStorage.removeItem('idToken');
        setState(prev => ({ ...prev, isAuthenticated: false, idToken: null, loading: false, error: 'Token expirado' }));
        requestTokenFromOpener();
      }
    };

    const requestTokenFromOpener = () => {
      if (!window.opener) {
        setState(prev => ({ ...prev, loading: false, error: 'Esta aplicación debe abrirse desde la aplicación principal' }));
        return;
      }
      try {
        window.opener.postMessage({ type: 'READY_FOR_TOKEN', source: 'CHILD_APP' }, '*');
      } catch (error) {
        setState(prev => ({ ...prev, loading: false, error: 'Error de comunicación con la aplicación principal' }));
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
          email: userInfo.email,
          roles: userInfo.roles,
          hub_codes: userInfo.hub_codes,
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
            console.log('[AuthContext] Solicitando refresco de token...');
            window.opener?.postMessage({ type: 'TOKEN_REFRESH_REQUEST', source: 'CHILD_APP' }, '*');
          } catch {}
        }
      }, 4 * 60 * 1000); // 4 minutos
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (refreshInterval !== null) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.idToken, isLocalhost]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}