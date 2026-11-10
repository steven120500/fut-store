// utils/security.js — helpers de saneamiento

// Escapa texto antes de insertarlo en HTML de correos (evita inyección de HTML/enlaces falsos)
export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Escapa caracteres especiales para usar texto del usuario dentro de un $regex (evita ReDoS / patrones raros)
export const escapeRegex = (value) => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Fuerza a string plano: bloquea inyección de operadores NoSQL ({ "$ne": null }) en consultas
export const asString = (value) => (typeof value === 'string' ? value : '');
