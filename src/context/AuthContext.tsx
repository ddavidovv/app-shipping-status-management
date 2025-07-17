import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  userEmail: string | null;
  userRole: string | null;
  email: string | null;
  roles: string[];
  hub_codes: string[];
  enrichedData: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  idToken: null,
  loading: true,
  error: null,
  userEmail: null,
  userRole: null,
  email: null,
  roles: [],
  hub_codes: [],
  enrichedData: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isAuthenticated: false,
    idToken: null,
    loading: true,
    error: null,
    userEmail: null,
    userRole: null,
    email: null,
    roles: [],
    hub_codes: [],
    enrichedData: null,
  });

  // Permitir desarrollo local sin autenticación real
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  useEffect(() => {
    if (isLocalhost) {
      console.log('[AuthContext] 🏠 Modo localhost detectado, usando datos mock');
      setState({
        isAuthenticated: true,
        idToken: 'mock-token-for-local-development',
        loading: false,
        error: null,
        userEmail: 'usuario@ejemplo.com',
        userRole: 'Operador',
        email: 'usuario@ejemplo.com',
        roles: ['Admin', 'Operations_Central'],
        hub_codes: ['008280', '008290'],
        enrichedData: {
          roles: ['Admin', 'Operations_Central'],
          hub_codes: ['008280', '008290']
        },
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

      console.log('[AuthContext] 📥 Mensaje recibido:', event.data);

      if (event.data?.type === 'TOKEN_INIT' || event.data?.type === 'TOKEN_UPDATE') {
        const token = event.data.payload?.idToken;
        const enrichedData = event.data.payload?.enrichedData;
        
        console.log('[AuthContext] 📥 Datos recibidos:', { 
          hasToken: !!token, 
          enrichedData,
          roles: enrichedData?.roles,
          hub_codes: enrichedData?.hub_codes
        });
        
        if (token && hasValidToken(token)) {
          sessionStorage.setItem('idToken', token);
          const userInfo = getUserInfoFromToken(token);
          
          // Combinar datos del token con datos enriquecidos
          const roles = enrichedData?.roles || userInfo.roles || [];
          const hub_codes = enrichedData?.hub_codes || [];
          
          setState({
            isAuthenticated: true,
            idToken: token,
            loading: false,
            error: null,
            userEmail: userInfo.email,
            userRole: userInfo.role,
            email: userInfo.email,
            roles: roles,
            hub_codes: hub_codes,
            enrichedData: enrichedData,
          });
        } else {
          setState({
            isAuthenticated: false,
            idToken: null,
            loading: false,
            error: 'Token inválido',
            userEmail: null,
            userRole: null,
            email: null,
            roles: [],
            hub_codes: [],
            enrichedData: null,
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
          email: null,
          roles: [],
          hub_codes: [],
          enrichedData: null,
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
        console.log('[AuthContext] 📤 Solicitando token y datos enriquecidos...');
        window.opener.postMessage(
          {
            type: 'READY_FOR_TOKEN',
            source: 'CHILD_APP',
            requestEnrichedData: true
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
          email: userInfo.email,
          roles: userInfo.roles || [],
          hub_codes: [],
          enrichedData: null,
        });
        
        // Solicitar datos enriquecidos actualizados
        setTimeout(() => {
          requestTokenFromOpener();
        }, 1000);
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
                source: 'CHILD_APP',
                requestEnrichedData: true
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

const getUserInfoFromToken = (token: string): { 
  email: string | null; 
  role: string | null; 
  roles: string[] 
} => {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    const email = decodedPayload.email || null;
    const role = decodedPayload.role || decodedPayload.roles?.[0] || decodedPayload['cognito:groups']?.[0] || null;
    const roles = decodedPayload.roles || decodedPayload['cognito:groups'] || [];
    return { email, role, roles };
  } catch {
    return { email: null, role: null, roles: [] };
  }
};