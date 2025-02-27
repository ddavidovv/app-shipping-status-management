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

const getIdToken = (): string | null => {
  try {
    console.log('🔐 Obteniendo token de sessionStorage');
    const token = sessionStorage.getItem('idToken');
    console.log(`📦 Token encontrado: ${token ? 'Sí' : 'No'}`);
    return token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error);
    return null;
  }
};

const hasValidToken = (token: string): boolean => {
  try {
    console.log('🔍 Validando token...');
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      console.warn('⚠️ Token malformado: falta alguna parte');
      return false;
    }
    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000;
    const now = Date.now();
    const timeLeft = Math.round((expirationTime - now) / 1000);
    
    console.log(`⏰ Tiempo restante del token: ${timeLeft} segundos`);
    const isValid = expirationTime > now;
    console.log(`✅ Token ${isValid ? 'válido' : 'expirado'}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error al validar token:', error);
    return false;
  }
};

interface TokenUserInfo {
  email: string | null;
  role: string | null;
}

const getUserInfoFromToken = (token: string): TokenUserInfo => {
  try {
    console.log('👤 Extrayendo información de usuario del token...');
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    // Mostrar el token completo y su contenido decodificado
    console.log('🔑 Token JWT completo:', token);
    console.log('📄 Contenido decodificado del token:', decodedPayload);
    
    // Extraer email y rol del token
    const email = decodedPayload.email || null;
    // Buscar el rol en diferentes claims comunes
    const role = decodedPayload.role || 
                 decodedPayload.roles?.[0] || 
                 decodedPayload['cognito:groups']?.[0] ||
                 decodedPayload.scope?.split(' ').find((s: string) => s.startsWith('role:'))?.replace('role:', '') ||
                 null;

    console.log('📧 Información extraída:', { email, role });
    return { email, role };
  } catch (error) {
    console.error('❌ Error al extraer información del token:', error);
    return { email: null, role: null };
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isAuthenticated: false,
    idToken: null,
    loading: true,
    error: null,
    userEmail: null,
    userRole: null,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.source === 'react-devtools-content-script' ||
        event.data?.source === 'react-devtools-backend-manager' ||
        event.data?.source === 'react-devtools-bridge'
      ) {
        return;
      }

      console.log('📨 Mensaje recibido:', {
        type: event.data?.type,
        source: event.data?.source
      });

      if (event.data?.type === 'TOKEN_INIT' || event.data?.type === 'TOKEN_UPDATE') {
        console.log(`🔄 Procesando ${event.data.type}...`);
        const token = event.data.payload?.idToken;
        
        // Mostrar el token recibido
        console.log('🔑 Token recibido:', token);
        
        if (token && hasValidToken(token)) {
          console.log('💾 Guardando nuevo token en sessionStorage');
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
          console.log('✨ Estado actualizado con nuevo token');
        } else {
          console.warn('⚠️ Token recibido inválido');
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
        console.warn('⚠️ Token expirado, solicitando nuevo token');
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
      console.log('🔄 Solicitando token a la ventana principal...');
      
      if (!window.opener) {
        console.log('ℹ️ La aplicación no fue abierta desde la ventana principal');
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
        console.log('📤 Mensaje READY_FOR_TOKEN enviado');
      } catch (error) {
        console.log('⚠️ Error al comunicarse con la ventana principal:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error de comunicación con la aplicación principal',
        }));
      }
    };

    const initAuth = () => {
      console.log('🚀 Iniciando autenticación...');
      const storedToken = getIdToken();
      
      // Mostrar el token almacenado
      if (storedToken) {
        console.log('🔑 Token almacenado:', storedToken);
      }
      
      if (storedToken && hasValidToken(storedToken)) {
        console.log('✅ Token almacenado válido, inicializando estado');
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
        console.log('🔄 No hay token válido, solicitando uno nuevo');
        requestTokenFromOpener();
      }
    };

    window.addEventListener('message', handleMessage);
    initAuth();

    let refreshInterval: number | null = null;
    if (window.opener) {
      refreshInterval = window.setInterval(() => {
        if (state.idToken) {
          console.log('⏰ Solicitando refresco de token...');
          try {
            window.opener?.postMessage(
              {
                type: 'TOKEN_REFRESH_REQUEST',
                source: 'CHILD_APP'
              },
              '*'
            );
          } catch (error) {
            console.log('⚠️ Error al solicitar refresco de token:', error);
          }
        }
      }, 4 * 60 * 1000);
    }

    return () => {
      console.log('🧹 Limpiando event listeners y refresh interval');
      window.removeEventListener('message', handleMessage);
      if (refreshInterval !== null) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.idToken]);

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