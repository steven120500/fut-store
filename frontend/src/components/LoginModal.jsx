import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiPhone, FiMail, FiLock, FiUser, FiLogIn, FiUserPlus, FiKey } from 'react-icons/fi';
import ModalShell from './ModalShell';
import 'react-toastify/dist/ReactToastify.css';
import { API_ORIGIN } from '../config';

const API_BASE = API_ORIGIN;

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Estados de campos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  
  // Modos: 'login', 'register', 'forgot'
  const [mode, setMode] = useState('login'); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  // 🛡️ Validaciones de contraseña
  const hasUpper  = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLength = password.length >= 6;
  const isPasswordValid = hasUpper && hasNumber && hasLength;

  // Limpiar estados al cambiar de modo o cerrar
  useEffect(() => {
    if (isOpen) {
      setFirstName(''); setLastName(''); setEmail(''); 
      setPassword(''); setPhone('');
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Manejador para que el teléfono solo acepte números y máx 8 dígitos
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 8) setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación de Correo (Común para todos)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }

    // 2. Lógica según el modo
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success('Enlace de recuperación enviado al correo');
        setMode('login');
        return;
      }

      if (mode === 'register') {
        if (!firstName || !lastName || phone.length !== 8) {
          toast.warn('Nombre, Apellido y Celular (8 dígitos) son obligatorios');
          return;
        }
        if (!isPasswordValid) {
          toast.error('La contraseña no cumple los requisitos');
          return;
        }
      }

      const endpoint = mode === 'register' ? 'register' : 'login';
      
      // 👇 AQUÍ ESTÁ LA MAGIA: Se agregó "username: email" para evitar el error de MongoDB
      const payload = mode === 'register' 
        ? { username: email, firstName, lastName, email, phone, password } 
        : { email, password };

      const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en la solicitud');

      if (mode === 'register') {
        toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
        setMode('login');
      } else {
        if (!data.token) throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
        const userData = {
          token: data.token,
          id: data.id,
          username: data.firstName, 
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          roles: data.roles,
          isSuperUser: data.isSuperUser,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess?.(userData);
        onClose?.();
        toast.success(`Bienvenido, ${data.firstName}`);
      }
    } catch (err) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const META = {
    login: { title: 'Iniciar sesión', subtitle: 'Accede a tu panel de FutStore', icon: FiLogIn, cta: 'Entrar' },
    register: { title: 'Crear cuenta', subtitle: 'Regístrate en segundos', icon: FiUserPlus, cta: 'Crear cuenta' },
    forgot: { title: 'Recuperar clave', subtitle: 'Te enviamos un enlace a tu correo', icon: FiKey, cta: 'Enviar enlace' },
  }[mode];

  const Rule = ({ ok, children }) => (
    <li className={`flex items-center gap-1.5 text-[11px] ${ok ? 'font-bold text-cyan-700' : 'text-zinc-400'}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${ok ? 'bg-cyan-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>{ok ? '✓' : ''}</span>
      {children}
    </li>
  );

  return (
    <ModalShell onClose={onClose} title={META.title} subtitle={META.subtitle} icon={META.icon} size="sm">
      <form ref={cardRef} onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="fs-label">Nombre</label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="fs-input pl-9" autoComplete="given-name" />
                </div>
              </div>
              <div>
                <label className="fs-label">Apellido</label>
                <input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} className="fs-input" autoComplete="family-name" />
              </div>
            </div>
            <div>
              <label className="fs-label">Celular</label>
              <div className="relative">
                <FiPhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input type="tel" inputMode="numeric" placeholder="8 dígitos" value={phone} onChange={handlePhoneChange} className="fs-input pl-9" autoComplete="tel" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="fs-label">Correo electrónico</label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="fs-input pl-9" autoComplete="email" autoFocus />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="fs-label mb-0">Contraseña</label>
              {mode === 'login' && (
                <button type="button" onClick={() => setMode('forgot')} className="border-0 bg-transparent p-0 text-[11px] font-semibold text-cyan-700 hover:underline">
                  ¿La olvidaste?
                </button>
              )}
            </div>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`fs-input pl-9 pr-11 ${mode === 'register' && password.length > 0 ? (isPasswordValid ? '!border-cyan-500' : '!border-red-300') : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border-0 bg-transparent p-0 text-zinc-400 hover:text-black"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>

            {mode === 'register' && (
              <ul className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <Rule ok={hasLength}>6+ letras</Rule>
                <Rule ok={hasUpper}>Mayúscula</Rule>
                <Rule ok={hasNumber}>Número</Rule>
              </ul>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="fs-btn fs-btn-primary w-full">
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <META.icon size={14} />
          )}
          {loading ? 'Procesando…' : META.cta}
        </button>

        <p className="text-center text-xs text-zinc-500">
          {mode === 'login' && (
            <>¿No tienes cuenta?{' '}<button type="button" onClick={() => setMode('register')} className="border-0 bg-transparent p-0 font-bold text-black hover:text-cyan-700">Regístrate</button></>
          )}
          {mode === 'register' && (
            <>¿Ya tienes cuenta?{' '}<button type="button" onClick={() => setMode('login')} className="border-0 bg-transparent p-0 font-bold text-black hover:text-cyan-700">Inicia sesión</button></>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('login')} className="border-0 bg-transparent p-0 font-bold text-black hover:text-cyan-700">← Volver a iniciar sesión</button>
          )}
        </p>
      </form>
    </ModalShell>
  );
}
