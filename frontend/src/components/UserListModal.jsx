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

export default function UserListModal({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // ⭐ NUEVO ESTADO: Controla la nueva alerta de confirmación elegante
  const [userToDelete, setUserToDelete] = useState(null); 
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!open) return;
    fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = freshUser.token || currentUser.token; 
      
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

  // Paso 1: Al hacer clic en el basurero, abrimos el modal elegante
  function askDeleteUser(u) {
    if (currentUser.email === u.email) {
      toastHOT.error("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (u.isSuperUser) {
      toastHOT.error("No se puede eliminar al Superadmin.");
      return;
    }
    setUserToDelete(u);
  }

  // Paso 2: Ejecutar el borrado real en la base de datos
  async function executeDelete() {
    if (!userToDelete) return;
    const targetId = userToDelete._id;
    const nameToShow = getDisplayName(userToDelete);

    setDeletingId(targetId);
    setUserToDelete(null); // Cerramos la alerta emergente

    try {
      const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = freshUser.token;

      if (!token) {
        toastHOT.error("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/users/${targetId}`, {
        method: "DELETE",
        headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Fallo al eliminar el usuario");
      }

      setUsers((prev) => prev.filter((u) => u._id !== targetId));
      toastHOT.success(`Usuario "${nameToShow}" eliminado correctamente.`);
    } catch (e) {
      console.error("Error eliminando:", e);
      toastHOT.error(e.message || "Error al eliminar usuario");
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-black text-amber-400 border border-amber-400/30 shadow-sm">
          <FaShieldAlt size={10} /> Superadmin
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

  return (
    <>
      {/* 1. MODAL PRINCIPAL DE LISTA DE USUARIOS (Nivel z-[9000]) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] my-auto animate-fadeIn relative">
          
          {/* Encabezado */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
                <FaUserShield size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Gestión de Usuarios</h2>
                <p className="text-xs text-gray-400 font-medium">Administra accesos y roles del sistema</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-black flex items-center justify-center transition-colors font-bold"
              title="Cerrar modal"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Lista de Usuarios */}
          <div className="p-4 md:p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <FaSpinner className="animate-spin text-black" size={28} />
                <p className="text-xs font-bold uppercase tracking-wider">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <FaUser size={24} />
                </div>
                <p className="text-sm font-bold text-gray-600">No se encontraron usuarios</p>
              </div>
            ) : (
              users.map((u) => {
                const displayName = getDisplayName(u);
                const isMe = (currentUser.email === u.email);
                const isSuper = u.isSuperUser;
                const canDelete = !isMe && !isSuper; 
                const initials = getInitials(displayName);
                const isDeletingThis = deletingId === u._id;

                return (
                  <div 
                    key={u._id} 
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe 
                        ? 'bg-gray-50/80 border-gray-300 shadow-sm' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs shadow-sm ${
                        isSuper 
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-extrabold' 
                          : isMe 
                            ? 'bg-black text-white' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900 truncate capitalize">
                            {displayName}
                          </h3>
                          {isMe && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded-md">
                              TÚ
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-1.5">
                          {renderRoleBadges(u)}
                        </div>
                      </div>
                    </div>

                    <div className="pl-3 flex-shrink-0">
                      {canDelete ? (
                        <button 
                          onClick={() => askDeleteUser(u)}
                          disabled={isDeletingThis}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                            isDeletingThis 
                              ? 'bg-red-500 text-white cursor-wait' 
                              : 'bg-gray-100 text-gray-500 hover:bg-red-600 hover:text-white border-transparent'
                          }`}
                          title="Eliminar usuario"
                        >
                          {isDeletingThis ? (
                            <FaSpinner className="animate-spin" size={14} />
                          ) : (
                            <FaTrash size={13} />
                          )}
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

          {/* Pie del modal */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center text-xs text-gray-400 font-medium flex-shrink-0">
            <span>Total: <strong className="text-gray-700">{users.length}</strong> usuarios</span>
            <button 
              onClick={onClose}
              className="font-bold text-gray-600 hover:text-black transition-colors px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs"
            >
              Cerrar ventana
            </button>
          </div>

        </div>
      </div>

      {/* ⭐ 2. MODAL DE ALERTA DE CONFIRMACIÓN (Nivel z-[10000] - ¡ESTÁ POR ENCIMA DE TODO!) */}
      {userToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100 transform transition-all scale-100 my-auto">
            
            {/* Ícono rojo brillante */}
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FaExclamationTriangle size={28} />
            </div>

            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">
              ¿Eliminar usuario?
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-6 px-2">
              Estás a punto de eliminar permanentemente a <strong className="text-black font-extrabold">"{getDisplayName(userToDelete)}"</strong>. Esta acción no se puede deshacer y perderá su acceso de inmediato.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-200"
              >
                Sí, eliminar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}