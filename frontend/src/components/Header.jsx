import logo from "../assets/logo.png";
import { FaBars, FaTimes } from "react-icons/fa";
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import Contacto from "./Contacto"; // 🔹 Importa el nuevo componente

const GOLD = "#9E8F91";

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
  setFilterType,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContacto, setShowContacto] = useState(false);

  const handleOfertasClick = () => {
    setFilterType("Ofertas"); // 🔹 señalamos que solo se muestren ofertas
  };

  return (
    <header
      className="mb-10 shadow-md px-4 sm:px-6 py-3 fixed w-full top-0 left-0 z-50"
      style={{ backgroundColor: GOLD }}
    >
      <div className="flex items-center justify-between">
        {/* IZQUIERDA */}
        <div className="flex items-center gap sm:gap-4">
          {/* LOGO */}
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none"
            style={{
              backgroundColor: GOLD,
              color: "#000",
              fontSize: "1.9rem",
            }}
          >
            <img src={logo} alt="Logo" className="h-12 sm:h-20" />
          </button>

          {/* OFERTAS */}
          <button
            onClick={handleOfertasClick}
            className="text-red-600 text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded"
            style={{ backgroundColor: GOLD }}
          >
            Ofertas 🏷️
          </button>

          {/* MEDIDAS */}
          <button
            onClick={onMedidasClick}
            className="text-black text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: GOLD }}
          >
            <LiaRulerSolid size={18} />
            <span className="hidden sm:inline">Medidas</span>
          </button>

          {/* CONTACTO */}
          <button
            onClick={() => setShowContacto(true)}
            className="text-black text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: GOLD }}
          >
            <FiPhoneCall size={18} />
            <span className="hidden sm:inline">Contacto</span>
          </button>
        </div>

        {/* BOTÓN MENÚ */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-2 sm:text-lg shadow-md bg-black hover:bg-gray-800 text-white"
          >
            <FaBars size={18} />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Panel */}
          <div
            className="fixed top-0 right-0 h-full w-72 sm:w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative h-full overflow-y-auto pt-14 p-5"
              style={{ backgroundColor: GOLD }}
            >
              {/* X */}
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú"
                className="absolute top-3 right-3 grid place-items-center rounded-full w-9 h-9"
                style={{ backgroundColor: GOLD, color: "#000" }}
              >
                ✕
              </button>

              {/* Opciones */}
              {user ? (
                <>
                  {isSuperUser && (
                    <button
                      onClick={() => {
                        setShowRegisterUserModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left mb-3 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: "#574C4D", color: "#000" }}
                    >
                      Agregar usuario
                    </button>
                  )}

                  {isSuperUser && (
                    <button
                      onClick={() => {
                        setShowUserListModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left mb-3 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: "#574C4D", color: "#000" }}
                    >
                      Ver usuarios
                    </button>
                  )}

                  {canSeeHistory && (
                    <button
                      onClick={() => {
                        setShowHistoryModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left mb-3 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: "#574C4D", color: "#000" }}
                    >
                      Historial
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left mt-2 px-4 py-2 rounded-lg text-red-700 font-semibold"
                    style={{ backgroundColor: "#574C4D", color: "#000" }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onLoginClick();
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "#574C4D", color: "#000" }}
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACTO */}
      {showContacto && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative w-80 sm:w-96">
            <button
              onClick={() => setShowContacto(false)}
              className="absolute top-2 right-2 text-black font-bold"
              style={{ backgroundColor: GOLD, color: "#000" }}
            >
              <FaTimes size={18} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Contáctanos</h2>
            <Contacto />
          </div>
        </div>
      )}
    </header>
  );
}