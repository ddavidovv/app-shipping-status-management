import { usePWAUpdate } from '../context/PWAUpdateContext';

function UpdatePrompt() {
  const { needRefresh } = usePWAUpdate();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 animate-pulse">
      <div className="text-center">
        <p className="font-bold">Nueva versión encontrada</p>
        <p className="text-sm text-gray-600">La aplicación se actualizará automáticamente...</p>
      </div>
    </div>
  );
}

export default UpdatePrompt;
