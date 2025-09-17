import logo from "../assets/logo.png";
import { IoMdArrowDropdown } from "react-icons/io";
import { FaBars } from "react-icons/fa";
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
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
    <header className="mb-10 shadow-md px-4 sm:px-6 py-3 fixed w-full top-0 left-0 z-50" style={{ backgroundColor: GOLD }}>
      <div className="flex items-center justify-between">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* LOGO */}
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none"
            style={{
              backgroundColor: "#d4af37",
              color: "#000",
              fontSize: "1.9rem",
            }}
            
          >
            <img src={logo} alt="Logo" className="h-12 sm:h-16" />
          </button>

          {/* CATEGORÍAS */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-black text-xs sm:text-lg font-semibold flex items-center gap-1 px-2 sm:px-4 py-1 rounded"
              style={{ backgroundColor: GOLD }}
            >
              Categorías <IoMdArrowDropdown />
            </button>
            {showDropdown && (
              <div className="absolute left-0 mt-1 w-36 sm:w-44 rounded shadow z-50 bg-white">
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
                    className="w-full text-left px-3 py-1.5 hover:bg-yellow-200 text-xs sm:text-sm"
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
            className="text-black text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: GOLD }}
          >
            <LiaRulerSolid size={18} />
            <span className="hidden sm:inline">Medidas</span>
          </button>

          {/* CONTACTO */}
          <button
            onClick={() => alert("Pronto podrás contactarnos.")}
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
            className="rounded-full p-2 sm:text-lg  shadow-md bg-black hover:bg-gray-800 text-white"
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
              className="text-black font-bold text-xl mb-4"
              style={{
                backgroundColor: "#DABB52",
                color: "#000",
                fontSize: "0.9rem",
              }}
              
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
                    className="block w-full mb-2 text-left text-black"
                    style={{
                      backgroundColor: "#DABB52",
                      color: "#000",
                      fontSize: "0.9rem",
                    }}
                    
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
                    className="block w-full mb-2 text-left text-black"
                    style={{
                      backgroundColor: "#DABB52",
                      color: "#000",
                      fontSize: "0.9rem",
                    }}
                    
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
                    className="block w-full mb-2 text-left text-black"
                    style={{
                      backgroundColor: "#DABB52",
                      color: "#000",
                      fontSize: "0.9rem",
                    }}
                    
                  >
                    Historial
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setSidebarOpen(false);
                  }}
                  className="block w-full mt-4 text-left text-red-600 font-semibold"
                  style={{
                    backgroundColor: "#DABB52",
                    color: "#000",
                    fontSize: "0.9rem",
                  }}
                  
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
                className="block w-full text-left text-black font-semibold hover:underline"
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