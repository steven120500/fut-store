import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiX, FiPhone } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = import.meta.env.VITE_API_URL || "https://fut-store.onrender.com";

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
        const userData = {
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div ref={cardRef} className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute right-3 top-2 p-1.5 rounded-md fondo-plateado text-black z-10 hover:brightness-90 transition">
          <FiX size={20} />
        </button>

        <div className="pt-8 pb-2 text-center">
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear Cuenta'}
            {mode === 'forgot' && 'Recuperar Clave'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text" placeholder="Nombre" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                />
                <input
                  type="text" placeholder="Apellido" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiPhone size={14}/></span>
                <input
                  type="text" placeholder="Celular (8 dígitos)" value={phone}
                  onChange={handlePhoneChange}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Correo Electrónico</label>
            <input
              type="email" placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Contraseña</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[10px] text-blue hover:text-black hover:underline bg-transparent">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 transition-all ${
                    mode === 'register' && password.length > 0 
                    ? (isPasswordValid ? 'border-green-500 focus:ring-green-100' : 'border-red-300 focus:ring-red-50') 
                    : 'border-gray-300'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-0 -translate-y-1/2 text-gray-400 bg-transparent flex items-center h-full">
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {mode === 'register' && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <ul className="space-y-1">
                    <li className={`flex items-center text-[10px] ${hasLength ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      <span className="mr-1.5">{hasLength ? '✓' : '○'}</span> 6+ caracteres
                    </li>
                    <li className={`flex items-center text-[10px] ${hasUpper ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      <span className="mr-1.5">{hasUpper ? '✓' : '○'}</span> Una MAYÚSCULA
                    </li>
                    <li className={`flex items-center text-[10px] ${hasNumber ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      <span className="mr-1.5">{hasNumber ? '✓' : '○'}</span> Un número
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 space-y-4">
            <button type="submit" className="w-full rounded-lg py-2.5 font-bold text-black transition hover:scale-[1.02] shadow-md fondo-plateado">
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Enviar Enlace'}
            </button>

            <div className="text-center text-xs text-gray-600">
              {mode === 'login' && (
                <>¿No tienes cuenta? <button type="button" onClick={() => setMode('register')} className="font-bold underline hover:text-black">Regístrate</button></>
              )}
              {mode === 'register' && (
                <>¿Ya tienes cuenta? <button type="button" onClick={() => setMode('login')} className="font-bold underline hover:text-black">Inicia sesión</button></>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')} className="font-bold underline hover:text-black">Volver al inicio de sesión</button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}