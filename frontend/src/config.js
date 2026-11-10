// src/config.js
// Fuente única de la URL del backend.
// Acepta VITE_API_URL con o sin "/api" al final (antes eso duplicaba "/api/api" en local).
const raw = (import.meta.env.VITE_API_URL || "https://fut-store.onrender.com").trim().replace(/\/+$/, "");

export const API_ORIGIN = raw.replace(/\/api$/, ""); // https://fut-store.onrender.com
export const API_URL = `${API_ORIGIN}/api`;           // https://fut-store.onrender.com/api
