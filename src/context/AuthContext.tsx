import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  idToken: string | null;
  enrichedData: any | null;
  expiresIn: number | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  idToken: null,
  enrichedData: null,
  expiresIn: null,
  email: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isAuthenticated: false,
    idToken: null,
    enrichedData: null,
    expiresIn: null,
    email: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Función para validar el token JWT y extraer el email
    function getEmailFromToken(token: string | null): string | null {
      if (!token) return null;
      try {
        const [, payload] = token.split('.');
        if (!payload) return null;
        const decoded = JSON.parse(atob(payload));
        return decoded.email || null;
      } catch {
        return null;
      }
    }
    function isValidToken(token: string | null): boolean {
      if (!token) return false;
      try {
        const [, payload] = token.split('.');
        if (!payload) return false;
        const decoded = JSON.parse(atob(payload));
        if (!decoded.exp) return false;
        const expirationTime = decoded.exp * 1000;
        return expirationTime > Date.now();
      } catch {
        return false;
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TOKEN_INIT' || event.data?.type === 'TOKEN_UPDATE') {
        const token = event.data.payload?.idToken ?? null;
        const enrichedData = event.data.payload?.enrichedData ?? null;
        const expiresIn = event.data.payload?.expiresIn ?? null;
        const email = getEmailFromToken(token);
        // LOG: Mostrar exactamente lo recibido
        console.log('[AuthContext] TOKEN recibido:', {
          type: event.data.type,
          idToken: token,
          enrichedData,
          expiresIn,
          email,
        });
        if (isValidToken(token)) {
          setState({
            isAuthenticated: true,
            idToken: token,
            enrichedData,
            expiresIn,
            email,
            loading: false,
            error: null,
          });
        } else {
          setState({
            isAuthenticated: false,
            idToken: null,
            enrichedData: null,
            expiresIn: null,
            email: null,
            loading: false,
            error: 'Token inválido o expirado',
          });
        }
      } else if (event.data?.type === 'TOKEN_EXPIRED') {
        setState({
          isAuthenticated: false,
          idToken: null,
          enrichedData: null,
          expiresIn: null,
          email: null,
          loading: false,
          error: 'Token expirado',
        });
        requestTokenFromOpener();
      }
    };

    const requestTokenFromOpener = () => {
      console.log('[AuthContext] Solicitando token a la aplicación principal...');
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

    window.addEventListener('message', handleMessage);
    requestTokenFromOpener();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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