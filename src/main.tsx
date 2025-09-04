import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Désactiver complètement le service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered');
    }
  });
}

// Trouver l'élément racine
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Créer et rendre l'application React
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);