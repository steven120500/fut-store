// src/authFetch.js
// Agrega automáticamente el token de sesión a TODAS las llamadas al backend (fetch y axios)
// y avisa a la app cuando la sesión venció, para cerrar sesión limpiamente.
import axios from 'axios';
import api from './api';
import { API_ORIGIN } from './config';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export const getToken = () => getStoredUser()?.token || null;

const isApiUrl = (url) => typeof url === 'string' && url.startsWith(API_ORIGIN);
// En estas rutas un 401 significa "credenciales incorrectas", no "sesión vencida"
const isLoginLike = (url) => /\/api\/auth\/(login|register|forgot-password|reset-password)/.test(url);

let expiredNotified = false;
function notifyExpired(url) {
  if (isLoginLike(url) || expiredNotified) return;
  expiredNotified = true;
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  setTimeout(() => { expiredNotified = false; }, 3000);
}

// ---------- fetch ----------
if (!window.__futstoreAuthFetch) {
  window.__futstoreAuthFetch = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
    if (!isApiUrl(url)) return originalFetch(input, init);

    const token = getToken();
    let options = init;
    if (token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      options = { ...init, headers };
    }

    const res = await originalFetch(input, options);
    if (res.status === 401 && token) notifyExpired(url);
    return res;
  };
}

// ---------- axios (instancia global y la de src/api.js) ----------
function withAuth(instance) {
  instance.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    const token = getToken();
    if (token && isApiUrl(fullUrl)) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  instance.interceptors.response.use(
    (r) => r,
    (error) => {
      const cfg = error?.config || {};
      const fullUrl = `${cfg.baseURL || ''}${cfg.url || ''}`;
      if (error?.response?.status === 401 && getToken() && isApiUrl(fullUrl)) notifyExpired(fullUrl);
      return Promise.reject(error);
    }
  );
}
withAuth(axios);
withAuth(api);
