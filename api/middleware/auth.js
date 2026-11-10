// api/middleware/auth.js — autenticación con JWT y permisos por rol
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const TOKEN_TTL = '7d';

// Sin JWT_SECRET el servidor NO emite ni acepta tokens (falla cerrado en vez de usar una clave pública).
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

export function signToken(user) {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET no configurado (mínimo 32 caracteres)');
  return jwt.sign({ id: String(user._id) }, secret, { expiresIn: TOKEN_TTL });
}

/**
 * Lee el token (si viene) y carga el usuario REAL desde la base de datos.
 * Así los roles siempre son los actuales (si le quitás un rol a alguien, aplica de inmediato).
 * No bloquea: las rutas deciden con requireAuth / requireRole / requireSuper.
 */
export async function attachAuth(req, _res, next) {
  req.user = null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const secret = getJwtSecret();

  if (token && secret) {
    try {
      const payload = jwt.verify(token, secret);
      const user = await User.findById(payload.id).select('firstName lastName email roles isSuperUser').lean();
      if (user) {
        req.user = {
          id: String(user._id),
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
          email: user.email,
          roles: Array.isArray(user.roles) ? user.roles : [],
          isSuperUser: Boolean(user.isSuperUser),
        };
      }
    } catch {
      // token inválido o vencido → se trata como no autenticado
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Sesión requerida. Inicia sesión de nuevo.' });
  next();
}

// Pasa si es superadmin o si tiene AL MENOS uno de los roles indicados
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Sesión requerida. Inicia sesión de nuevo.' });
  if (req.user.isSuperUser || roles.some((r) => req.user.roles.includes(r))) return next();
  return res.status(403).json({ message: 'No tienes permiso para esta acción.' });
};

export function requireSuper(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Sesión requerida. Inicia sesión de nuevo.' });
  if (!req.user.isSuperUser) return res.status(403).json({ message: 'Solo el administrador puede hacer esto.' });
  next();
}

// Nombre confiable para auditoría (ya no se usa el header x-user, que se podía falsificar)
export const actorName = (req, fallback = 'Sistema') => req.user?.name || fallback;
