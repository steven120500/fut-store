import logo from "../assets/logo.png";
import { FaBars, FaTimes } from "react-icons/fa";
import { LiaRulerHorizontalSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useState } from "react";
import Contacto from "./Contacto";
import TopBanner from "./TopBanner"; // ✅ 1. Importamos el TopBanner
import { motion, AnimatePresence } from "framer-motion";

// 🎨 El Gradiente Plateado (Insignia de la empresa)
const silverGradient = "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #d1d1d1 100%)";

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

  return (
    <header
      className="shadow-md fixed w-full top-6 left-0 z-50 transition-all duration-300"
      style={{
        background: silverGradient,
      }}
    >
      {/* ✅ 2. Agregamos el TopBanner aquí para que salga arriba del todo */}
      <TopBanner />

      {/* Contenedor Principal */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-2 flex items-center justify-between">
        
        {/* 🔹 IZQUIERDA: LOGO */}
        <div className="flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogoClick}
            className="focus:outline-none bg-transparent flex items-center"
          >
            <img 
              src={logo} 
              alt="FutStore Logo" 
              // En móvil un poco más pequeño para dar espacio
              className="h-14 sm:h-20 object-contain drop-shadow-md" 
            />
          </motion.button>
        </div>

        {/* 🔹 DERECHA: LOS 3 BOTONES */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* 1. BOTÓN TALLAS */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onMedidasClick}
            title="Ver Tallas"
            // EN MÓVIL: p-2 (redondo). EN PC: px-5 py-2 (alargado)
            className="flex items-center justify-center gap-2 p-2 sm:px-5 sm:py-2 rounded-full bg-black text-white shadow-md hover:bg-gray-800 transition-all"
          >
            <LiaRulerHorizontalSolid className="text-white text-lg sm:text-xl" />
            {/* Texto oculto en móvil (hidden), visible en PC (sm:block) */}
            <span className="hidden sm:block text-sm font-bold uppercase tracking-wide">
              Tallas
            </span>
          </motion.button>

          {/* 2. BOTÓN CONTACTO */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowContacto(true)}
            title="Contactar"
            // EN MÓVIL: p-2 (redondo). EN PC: px-5 py-2 (alargado)
            className="flex items-center justify-center gap-2 p-2 sm:px-5 sm:py-2 rounded-full bg-black text-white shadow-md hover:bg-gray-800 transition-all"
          >
            <FiPhoneCall className="text-white text-lg sm:text-lg" />
            {/* Texto oculto en móvil (hidden), visible en PC (sm:block) */}
            <span className="hidden sm:block text-sm font-bold uppercase tracking-wide">
              Contacto
            </span>
          </motion.button>

          {/* 3. BOTÓN MENÚ (Hamburguesa) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="bg-black text-white p-2 sm:p-3 rounded-full shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            <FaBars size={18} className="sm:w-5 sm:h-5" />
          </motion.button>

        </div>
      </div>

      {/* 🔸 SIDEBAR (Menú Lateral) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 sm:w-80 shadow-2xl bg-white border-l border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="relative h-full overflow-y-auto pt-20 p-6 flex flex-col gap-4"
                style={{ background: silverGradient }}
              >
                {/* Cerrar Sidebar */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-5 right-5 text-black fondo-plateado hover:bg-white/50 p-2 rounded-full transition-all"
                >
                  <FaTimes size={20} />
                </button>

                <div className="mb-6 border-b border-gray-300 pb-6 flex justify-center">
                   <img src={logo} alt="Logo" className="h-16 drop-shadow-lg" />
                </div>

                {/* Opciones del Menú */}
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="text-gray-600 text-xs uppercase tracking-widest mb-2 px-2 font-bold">
                       Menú de Usuario
                    </div>

                    {isSuperUser && (
                      <>
                        <SidebarButton onClick={() => { setShowRegisterUserModal(true); setSidebarOpen(false); }}>
                          Agregar usuario
                        </SidebarButton>
                        <SidebarButton onClick={() => { setShowUserListModal(true); setSidebarOpen(false); }}>
                          Ver usuarios
                        </SidebarButton>
                      </>
                    )}

                    {canSeeHistory && (
                      <SidebarButton onClick={() => { setShowHistoryModal(true); setSidebarOpen(false); }}>
                        Historial de Ventas
                      </SidebarButton>
                    )}

                    <div className="mt-4 border-t border-gray-300 pt-4">
                      <button
                        onClick={() => { onLogout(); setSidebarOpen(false); }}
                        className="w-full text-left px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all flex items-center gap-2 justify-center"
                      >
                         Cerrar sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { onLoginClick(); setSidebarOpen(false); }}
                    className="w-full bg-black text-white text-center px-4 py-3 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg"
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔹 MODAL CONTACTO */}
      <AnimatePresence>
        {showContacto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 rounded-2xl shadow-2xl relative w-full max-w-sm"
            >
              <button
                onClick={() => setShowContacto(false)}
                className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-black p-2 rounded-full transition-colors"
              >
                <FaTimes size={16} />
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight">Contáctanos</h2>
                <div className="w-12 h-1 bg-black mx-auto mt-2 rounded-full"></div>
              </div>
              
              <Contacto />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Botón auxiliar para el Sidebar (con el fondo-plateado que pediste conservar)
function SidebarButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl font-bold text-gray-800 fondo-plateado hover:bg-white hover:shadow-md transition-all border border-gray-200"
    >
      {children}
    </button>
  );
}