import { useState } from 'react';
import { Package, User, X, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWAUpdate } from '../context/PWAUpdateContext';

export default function Header() {
  const { email, roles, hub_codes } = useAuth();
  const { countdown, forceCheck } = usePWAUpdate();
  const isAdmin = roles.includes('Admin');

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const [showDetails, setShowDetails] = useState(false);

  const handleClose = () => {
    try {
      window.close();
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = 'about:blank';
          window.close();
        }
      }, 100);
    } catch (e) {
      console.error('Error al cerrar la ventana:', e);
      window.location.href = 'about:blank';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-corporate-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-xl text-corporate-text">Status Management</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">v{import.meta.env.VITE_APP_VERSION}</span>
                {isAdmin && (
                  <span 
                    className="text-xs text-blue-400 font-mono"
                    title={`Próxima verificación de actualizaciones críticas`}
                    onClick={forceCheck}
                    style={{ cursor: 'pointer' }}
                  >
                    [{formatTime(countdown)}]
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{email}</span>
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  title={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
                  onClick={() => setShowDetails((v) => !v)}
                  aria-label="Mostrar detalles del usuario"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showDetails && (
                  <div className="flex flex-col gap-1 mt-2 bg-gray-50 border border-gray-200 rounded p-2 shadow-md absolute right-0 z-10 min-w-[220px]">
                    <div className="mb-1 text-xs text-gray-500 font-semibold">Detalles de usuario</div>
                    <div>
                      <span className="font-medium">Roles:</span>{' '}
                      {roles && roles.length > 0 ? (
                        roles.map((role: string, index: number) => (
                          <span key={`role-${index}`} className="inline-block ml-1 px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium text-blue-800">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="ml-1 px-2 py-0.5 bg-red-100 rounded-full text-xs font-medium text-red-800">Sin roles</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Hubs:</span>{' '}
                      {hub_codes && hub_codes.length > 0 ? (
                        hub_codes.map((hub: string, index: number) => (
                          <span key={`hub-${index}`} className="inline-block ml-1 px-2 py-0.5 bg-green-200 rounded-full text-xs font-medium text-green-900">
                            {hub}
                          </span>
                        ))
                      ) : (
                        <span className="ml-1 px-2 py-0.5 bg-red-100 rounded-full text-xs font-medium text-red-800">Sin hubs</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}