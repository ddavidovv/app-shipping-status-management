import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { PWAUpdateProvider } from './context/PWAUpdateContext';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <AuthProvider>
      <PWAUpdateProvider>
        <App />
      </PWAUpdateProvider>
    </AuthProvider>
  </React.StrictMode>
);