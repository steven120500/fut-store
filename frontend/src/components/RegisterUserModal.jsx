import { useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaUser, FaPhone, FaEnvelope, FaLock, FaUserPlus, FaPlus, FaEdit, FaTrash, FaHistory, FaCheck } from "react-icons/fa";
import ModalShell from "./ModalShell";
import { API_ORIGIN as API_BASE } from "../config";

const ROLES = [
  { key: "add", label: "Agregar", desc: "Crear productos", Icon: FaPlus },
  { key: "edit", label: "Editar", desc: "Precios, stock, cierres", Icon: FaEdit },
  { key: "delete", label: "Eliminar", desc: "Borrar productos", Icon: FaTrash },
  { key: "history", label: "Historial", desc: "Ver cambios", Icon: FaHistory },
];

// Definido fuera del componente para que los inputs no se re-monten (y pierdan el foco) en cada tecla
function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="fs-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400" />}
        {children}
      </div>
    </div>
  );
}

export default function RegisterUserModal({ onClose }) {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState({ add: false, edit: false, delete: false, history: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 8) : value });
  };

  const pw = formData.password;
  const rules = [
    { ok: pw.length >= 6, label: "6+ caracteres" },
    { ok: /[A-Z]/.test(pw), label: "Mayúscula" },
    { ok: /\d/.test(pw), label: "Número" },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      return toast.warning("Nombre, apellido, correo y contraseña son obligatorios");
    }
    if (formData.phone.length !== 8) return toast.warning("El celular debe tener 8 dígitos");

    setLoading(true);
    try {
      const selectedRoles = Object.entries(roles).filter(([, v]) => v).map(([k]) => k);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.email, ...formData, roles: selectedRoles }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Usuario creado exitosamente");
        onClose?.();
      } else {
        toast.error(data.message || "Error al registrar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Nuevo usuario" subtitle="Crea una cuenta para tu equipo" icon={FaUserPlus} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field icon={FaUser} label="Nombre">
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Nombre" className="fs-input pl-9" required />
          </Field>
          <Field label="Apellido">
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Apellido" className="fs-input" required />
          </Field>
        </div>

        <Field icon={FaPhone} label="Celular">
          <input name="phone" type="tel" inputMode="numeric" value={formData.phone} onChange={handleChange} placeholder="88888888" className="fs-input pl-9 font-mono" />
        </Field>

        <Field icon={FaEnvelope} label="Correo electrónico">
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="empleado@correo.com" className="fs-input pl-9" required />
        </Field>

        <Field icon={FaLock} label="Contraseña">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
            className="fs-input pl-9 pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border-0 bg-transparent p-0 text-zinc-400 hover:text-black"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </Field>
        <div className="flex flex-wrap gap-2">
          {rules.map((r) => (
            <span key={r.label} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${r.ok ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200" : "bg-zinc-100 text-zinc-400"}`}>
              {r.ok ? "✓ " : ""}{r.label}
            </span>
          ))}
        </div>

        <div className="border-t border-dashed border-zinc-200 pt-4">
          <p className="fs-label">Permisos</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ key, label, desc, Icon }) => {
              const on = roles[key];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setRoles((p) => ({ ...p, [key]: !p[key] }))}
                  aria-pressed={on}
                  className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    on ? "border-cyan-400 bg-cyan-50/60 ring-2 ring-cyan-400/30" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${on ? "bg-black text-cyan-300" : "bg-zinc-100 text-zinc-500"}`}>
                    <Icon size={12} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-zinc-900">{label}</span>
                    <span className="block truncate text-[10px] text-zinc-500">{desc}</span>
                  </span>
                  {on && <FaCheck className="absolute right-2 top-2 text-[10px] text-cyan-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={loading} className="fs-btn fs-btn-primary w-full">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FaUserPlus />}
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
    </ModalShell>
  );
}
