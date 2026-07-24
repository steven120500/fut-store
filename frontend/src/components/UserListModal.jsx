import React, { useEffect, useState } from "react";
import { toast as toastHOT } from "react-hot-toast";
import { 
  FaTimes, 
  FaTrash, 
  FaUserShield, 
  FaUser, 
  FaSpinner, 
  FaShieldAlt, 
  FaExclamationTriangle
} from "react-icons/fa";

const API_BASE = "https://fut-store.onrender.com";

export default function UserListModal({ open, onClose, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null); 
  
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!open) return;
    fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user?.token || freshUser?.token || currentUser?.token || localStorage.getItem("token") || ""; 
      
      const res = await fetch(`${API_BASE}/api/auth/users`, { 
        headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${token}` 
        } 
      });
      
      if (!res.ok) throw new Error("Error al obtener usuarios");
      
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toastHOT.error("No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  };

  function startDeleteConfirm(u) {
    if (currentUser?.email === u.email) {
      toastHOT.error("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (u.isSuperUser) {
      toastHOT.error("No se puede eliminar al Superadmin.");
      return;
    }
    setConfirmingId(u._id);
  }

  async function executeDelete(userToDelete) {
    const targetId = userToDelete._id || userToDelete.id;

    if (!targetId) {
      toastHOT.error("Error: ID no encontrado.");
      return;
    }

    setDeletingId(targetId);
    setConfirmingId(null); 
    
    toastHOT.loading("Borrando usuario...", { id: "borrando" });

    try {
      const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user?.token || freshUser?.token || currentUser?.token || localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      const res = await fetch(`${API_BASE}/api/auth/users/${targetId}`, {
        method: "DELETE",
        headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Fallo al eliminar el usuario");
      }

      setUsers((prev) => prev.filter((u) => u._id !== targetId));
      
      toastHOT.success(`Usuario eliminado correctamente`, { id: "borrando" });

    } catch (e) {
      console.error("🔴 Error:", e);
      toastHOT.error(e.message || "Error al eliminar usuario", { id: "borrando" });
    } finally {
      setDeletingId(null);
    }
  }

  const getDisplayName = (u) => {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.username || u.email || "Usuario";
  };

  const getInitials = (name) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return `${parts[0].slice(0, 2)}`.toUpperCase();
    return "US";
  };

  const renderRoleBadges = (u) => {
    if (u.isSuperUser) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-black text-white border border-gray-700 shadow-sm">
          <FaShieldAlt size={10} className="text-amber-400" /> Superadmin
        </span>
      );
    }
    
    if (u.roles && u.roles.length > 0) {
      const mapRoles = { add: "Agregar", edit: "Editar", delete: "Eliminar", history: "Historial" };
      return (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <span key={r} className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {mapRoles[r] || r}
            </span>
          ))}
        </div>
      );
    }
    
    return (
      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
        Cliente
      </span>
    );
  };

  if (!open) return null;

  // Función segura de cierre
  const handleCerrar = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      
      {/* Fondo transparente clickeable para cerrar */}
      <div className="absolute inset-0" onClick={handleCerrar} />

      {/* Contenedor principal con z-50 */}
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-100 flex flex-col overflow-hidden max-h-[82vh] relative z-10">
        
        {/* Encabezado fijo */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <FaUserShield size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight">Gestión de Usuarios</h2>
              <p className="text-[11px] text-gray-400 font-medium">Administra accesos y roles del sistema</p>
            </div>
          </div>
          
          {/* Botón X con evento directo y garantizado */}
          <button 
            type="button"
            onClick={handleCerrar} 
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-black hover:text-white text-black flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Cerrar ventana"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Lista de Usuarios */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-2.5 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <FaSpinner className="animate-spin text-black" size={28} />
              <p className="text-xs font-bold uppercase tracking-wider">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <FaUser size={24} />
              </div>
              <p className="text-sm font-bold text-gray-600">No se encontraron usuarios</p>
            </div>
          ) : (
            users.map((u) => {
              const displayName = getDisplayName(u);
              const isMe = (currentUser?.email === u.email);
              const isSuper = u.isSuperUser;
              const canDelete = !isMe && !isSuper; 
              const initials = getInitials(displayName);
              const isDeletingThis = deletingId === u._id;
              const isConfirmingThis = confirmingId === u._id;

              if (isConfirmingThis) {
                return (
                  <div key={u._id} className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 gap-3 shadow-inner">
                    <div className="flex items-center gap-2 text-red-800 text-xs font-bold min-w-0">
                      <FaExclamationTriangle className="text-red-500 flex-shrink-0" size={16} />
                      <span className="truncate">¿Eliminar a <strong className="underline">{displayName}</strong>?</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                      <button 
                        type="button"
                        onClick={() => setConfirmingId(null)} 
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition border border-gray-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeDelete(u)} 
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FaTrash size={11} /> Sí, borrar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={u._id} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isMe ? 'bg-gray-50/80 border-gray-300 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs shadow-sm ${isSuper ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-extrabold' : isMe ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900 truncate capitalize">{displayName}</h3>
                        {isMe && <span className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded-md">TÚ</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">{renderRoleBadges(u)}</div>
                    </div>
                  </div>

                  <div className="pl-3 flex-shrink-0">
                    {canDelete ? (
                      <button 
                        type="button"
                        onClick={() => startDeleteConfirm(u)} 
                        disabled={isDeletingThis} 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${isDeletingThis ? 'bg-red-500 text-white cursor-wait' : 'bg-gray-100 text-gray-500 hover:bg-red-600 hover:text-white border-transparent'}`}
                      >
                        {isDeletingThis ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={13} />}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 select-none">
                        {isMe ? "Activo" : "Protegido"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie de página con botón de cierre garantizado */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-medium flex-shrink-0">
          <span>Total: <strong className="text-gray-900">{users.length}</strong> usuarios</span>
          <button 
            type="button"
            onClick={handleCerrar}
            className="text-xs font-bold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Cerrar ventana
          </button>
        </div>

      </div>
    </div>
  );
}