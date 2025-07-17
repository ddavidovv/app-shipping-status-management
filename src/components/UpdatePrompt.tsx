import { usePWAUpdate } from '../context/PWAUpdateContext';
import { CloudCog } from 'lucide-react';

function UpdatePrompt() {
  const { needRefresh } = usePWAUpdate();

  if (!needRefresh) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex items-center gap-4 rounded-lg bg-slate-800 px-5 py-4 text-white shadow-2xl toast-in"
      role="alert"
    >
      <CloudCog className="h-8 w-8 animate-spin text-blue-400" style={{ animationDuration: '3s' }} />
      <div>
        <p className="font-bold">Actualización en curso</p>
        <p className="text-sm text-slate-400">Aplicando la nueva versión. La página se recargará en breve.</p>
      </div>
    </div>
  );
}

export default UpdatePrompt;
