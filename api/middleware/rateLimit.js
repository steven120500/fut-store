// api/middleware/rateLimit.js — límite de intentos en memoria (sin dependencias)
// Suficiente para un solo servidor (Render). Frena fuerza bruta en login y spam de correos.
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message = 'Demasiados intentos. Intenta de nuevo en unos minutos.' } = {}) {
  const hits = new Map();

  // Limpieza periódica para no acumular memoria
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
}
