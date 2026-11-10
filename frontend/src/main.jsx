import React from 'react';
import ReactDOM from 'react-dom/client';
import './authFetch'; // token de sesión en todas las llamadas al backend
import App from './App';
import './i18n';
import './index.css';
import { registerSW } from './registerSW.js'; // 👈 importa tu helper de SW

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 👇 Registramos el service worker al cargar la app
registerSW();