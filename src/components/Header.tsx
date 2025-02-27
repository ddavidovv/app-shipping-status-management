import { Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { userEmail, userRole } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-corporate-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-xl text-corporate-text">Status Management</span>
              <span className="text-xs text-gray-400">v{import.meta.env.VITE_APP_VERSION}</span>
            </div>
          </div>
          {userEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{userEmail}</span>
              {userRole && (
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                  {userRole}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}