import logo from "../assets/logo.png";
import { FaBars, FaTimes, FaShoppingCart, FaUser, FaBoxOpen } from "react-icons/fa"; 
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Contacto from "./Contacto"; 
import { useCart } from "../context/CartContext";

export default function Header({
  onLoginClick,
  onLogout,
  onLogoClick,
  user,
  canSeeHistory,
  isSuperUser,
  setShowRegisterUserModal,
  setShowUserListModal,
  setShowHistoryModal,
  onMedidasClick,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContacto, setShowContacto] = useState(false);
  
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const handleCartClick = () => {
    if (cartCount > 0) {
      navigate('/checkout');
    } else {
      toast.info("Tu carrito está vacío 🛒");
    }
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header
      className="shadow-md fondo-plateado px-2 sm:px-10 py-2 fixed w-full 
                 top-0 left-0 z-50 transition-all duration-300"
      style={{ backgroundColor: "#000" }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* 🔹 SECCIÓN IZQUIERDA: Logo y Accesos Rápidos */}
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none bg-transparent hover:scale-105 transition-transform"
          >
            <img src={logo} alt="FutStore Logo" className="h-14 sm:h-24 object-contain" />
          </button>

          <div className="flex gap-2">
            {/* BOTÓN TALLAS: Ahora Negro con letras blancas */}
            <button 
              onClick={onMedidasClick} 
              className="text-white text-[10px] sm:text-sm bg-black border border-zinc-700 font-bold px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all"
            >
              <LiaRulerSolid size={18} /> 
              <span className="hidden md:inline uppercase tracking-tighter">Guía de Tallas</span>
            </button>

            {/* BOTÓN CONTACTO: Ahora Negro con letras blancas */}
            <button 
              onClick={() => setShowContacto(true)} 
              className="text-white text-[10px] sm:text-sm bg-black border border-zinc-700 font-bold px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all"
            >
              <FiPhoneCall size={16} /> 
              <span className="hidden md:inline uppercase tracking-tighter">Contacto</span>
            </button>
          </div>
        </div>

        {/* 🔹 SECCIÓN DERECHA: Carrito y Perfil */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Botón Carrito: Ahora Negro con letras blancas */}
          <button 
            onClick={handleCartClick} 
            className="relative bg-black text-white p-3 rounded-full shadow-xl border border-zinc-700 hover:bg-zinc-800 transition-all active:scale-95"
          >
            <FaShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* Botón Usuario / Menú */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full bg-black p-1 w-11 h-11 flex items-center justify-center shadow-xl hover:border-white text-white transition-all border border-zinc-700 overflow-hidden"
          >
            {user ? (
              <div className="bg-gradient-to-br from-gray-700 to-black w-full h-full flex items-center justify-center">
                <span className="font-black text-xs tracking-tighter text-[#D4AF37]">
                  {getInitials(user.firstName || user.username)}
                </span>
              </div>
            ) : (
              <FaUser size={18} />
            )}
          </button>
        </div>
      </div>

      {/* 🔸 SIDEBAR (Menú Lateral) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div 
            className="fixed top-0 right-0 h-full w-72 sm:w-80 shadow-2xl animate-in slide-in-from-right duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative fondo-plateado h-full flex flex-col p-6" style={{ backgroundColor: "#000" }}>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="absolute text-white top-5 right-5 rounded-full w-10 h-10 grid place-items-center hover:bg-zinc-800 transition"
              >
                <FaTimes size={24} />
              </button>

              {user ? (
                <div className="mt-10 flex-grow">
                  <div className="mb-8 border-b border-zinc-800 pb-6">
                    <p className="text-zinc-500 text-xs uppercase font-black tracking-widest mb-1">Sesión Iniciada</p>
                    <p className="text-white font-bold text-2xl truncate">
                      {user.firstName || user.username}
                    </p>
                  </div>

                  <nav className="space-y-2">
                    {isSuperUser && (
                      <>
                        <button onClick={() => { setShowRegisterUserModal(true); setSidebarOpen(false); }} className="w-full text-white text-left px-4 py-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition flex items-center gap-3">
                          <FaUser size={14}/> Agregar Usuario
                        </button>
                        <button onClick={() => { setShowUserListModal(true); setSidebarOpen(false); }} className="w-full text-white text-left px-4 py-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition flex items-center gap-3">
                          <FaUser size={14}/> Lista de Usuarios
                        </button>
                      </>
                    )}
                    
                    {canSeeHistory && (
                      <button onClick={() => { setShowHistoryModal(true); setSidebarOpen(false); }} className="w-full text-white text-left px-4 py-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition flex items-center gap-3">
                        Historial de Cambios
                      </button>
                    )}
                    
                    {/* Botón Pedidos */}
                    {(isSuperUser || canSeeHistory) && (
                      <button 
                        onClick={() => { navigate('/pedidos'); setSidebarOpen(false); }} 
                        className="w-full bg-[#D4AF37] text-black font-black text-left px-4 py-3 rounded-xl flex items-center gap-3 hover:brightness-110 transition shadow-lg"
                      >
                        <FaBoxOpen size={18} /> GESTIÓN DE PEDIDOS
                      </button>
                    )}
                  </nav>

                  <button 
                    onClick={() => { onLogout(); setSidebarOpen(false); }} 
                    className="w-full text-center mt-12 px-4 py-4 rounded-xl font-black text-red-500 hover:bg-red-500/10 border border-red-500/20 transition uppercase text-sm tracking-widest"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="text-center mt-20">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800 text-zinc-700">
                    <FaUser size={30} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2 tracking-tight">¡Bienvenido!</h3>
                  <p className="text-zinc-500 text-sm mb-8 px-4">Inicia sesión para gestionar tus pedidos y ver las mejores ofertas.</p>
                  
                  {/* BOTÓN INICIAR SESIÓN: Ahora Negro con letras blancas */}
                  <button 
                    onClick={() => { onLoginClick(); setSidebarOpen(false); }} 
                    className="w-full bg-black text-white px-4 py-4 rounded-xl font-black uppercase tracking-widest border border-zinc-700 hover:bg-zinc-900 transition shadow-xl"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}
              
              <div className="mt-auto pt-6 text-center">
                <p className="text-[10px] text-zinc-700 font-bold tracking-widest uppercase">FutStore Costa Rica © 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL CONTACTO */}
      {showContacto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowContacto(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-black transition"
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-black uppercase mb-6 text-center tracking-tight">Contáctanos</h2>
            <Contacto />
          </div>
        </div>
      )}
    </header>
  );
}