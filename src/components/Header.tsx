import { Package } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-corporate-primary" />
            <span className="font-semibold text-xl text-corporate-text">Status Management</span>
          </div>
        </div>
      </div>
    </header>
  );
}