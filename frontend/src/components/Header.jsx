import logo from "../assets/logo.png";
import { IoMdArrowDropdown } from "react-icons/io";
import { FaBars } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const GOLD = "#d4af37";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTypeClick = (type) => {
    setFilterType(type === "Todos" ? "" : type);
    setShowDropdown(false);
  };

  return (
    <header
      className="mb-12 shadow-md px-4 sm:px-6 py-4 relative"
      style={{ backgroundColor: GOLD }}
    >
      <div className="flex items-center justify-between">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-3">
          {/* LOGO */}
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none focus:ring-0"
          >
            <img
              src={logo}
              alt="Logo"
              className="h-20 sm:h-24"
              style={{ borderRadius: "0px" }}
            />
          </button>

          {/* CATEGORÍAS */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-black font-semibold flex items-center gap-1 px-4 py-1.5 rounded-md focus:outline-none focus:ring-0"
              style={{ backgroundColor: GOLD }}
            >
              Categorías <IoMdArrowDropdown />
            </button>
            {showDropdown && (
              <div
                className="absolute left-0 mt-2 w-44 rounded shadow z-10"
                style={{ backgroundColor: GOLD }}
              >
                {[
                  "Player",
                  "Fan",
                  "Mujer",
                  "Niño",
                  "Retro",
                  "Abrigos",
                  "Nacional",
                  "Todos",
                ].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    className="w-full text-left px-4 py-2 hover:bg-yellow-200 text-sm focus:outline-none focus:ring-0"
                    style={{ backgroundColor: GOLD }}
                    
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MEDIDAS */}
          <button
            onClick={onMedidasClick}
            className="text-black font-semibold px-4 py-1.5 rounded-md focus:outline-none focus:ring-0"
            style={{ backgroundColor: GOLD }}
          >
            Medidas
          </button>

          {/* CONTACTO */}
          <button
            onClick={() => alert("Pronto podrás contactarnos.")}
            className="text-black font-semibold px-4 py-1.5 rounded-md focus:outline-none focus:ring-0"
            style={{ backgroundColor: GOLD }}
          >
            Contacto
          </button>
        </div>

        {/* BOTÓN DE MENÚ (SLIDE) */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            title="Menú"
            className="rounded-full p-3 shadow-lg transition text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-0"
          >
            <FaBars size={18} />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50" onClick={() => setSidebarOpen(false)}>
          <div
            className="fixed top-0 right-0 w-64 h-full shadow-lg p-5 overflow-y-auto"
            style={{ backgroundColor: GOLD }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-black font-bold text-xl mb-4 focus:outline-none focus:ring-0"
              style={{ backgroundColor: GOLD }}
            >
              ✕
            </button>

            {user ? (
              <>
                {isSuperUser && (
                  <button
                    onClick={() => {
                      setShowRegisterUserModal(true);
                      setSidebarOpen(false);
                    }}
                    className="block text-left w-full mb-2 text-black hover:underline"
                    style={{ backgroundColor: GOLD }}
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
                    className="block text-left w-full mb-2 text-black hover:underline"
                    style={{ backgroundColor: GOLD }}
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
                    className="block text-left w-full mb-2 text-black hover:underline"
                    style={{ backgroundColor: GOLD }}
                  >
                    Historial
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setSidebarOpen(false);
                  }}
                  className="block text-left w-full text-red-600 font-semibold hover:underline mt-4"
                  style={{ backgroundColor: GOLD }}
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
                className="block text-left w-full text-black font-semibold hover:underline"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}