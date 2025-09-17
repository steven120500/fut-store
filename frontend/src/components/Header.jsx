import logo from "../assets/logo.png";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoMdArrowDropdown } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import UserDropDown from "./UserDropDown";

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
    <>
      <header
        className="shadow-md px-4 sm:px-6 py-4 relative"
        style={{ backgroundColor: GOLD }}
      >
        <div className="flex items-center justify-between">
          {/* IZQUIERDA */}
          <div className="flex items-center gap-3">
            {/* LOGO */}
            <button
              onClick={onLogoClick}
              className="focus:outline-none focus:ring-0"
              title="Volver al inicio"
            >
              <img
                src={logo}
                alt="Logo FutStore"
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
                <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-300 rounded shadow z-10">
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
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm focus:outline-none"
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

          {/* BOTÓN HAMBURGUESA */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-5 shadow-lg transition text-black text-4xl bg-white hover:bg-gray-300 focus:outline-none focus:ring-0"
            title="Abrir menú"
          >
            <HiMenuAlt3 size={20} />
          </button>
        </div>
      </header>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 p-6 flex flex-col gap-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-right text-gray-500 hover:text-black self-end"
          >
            ✕
          </button>

          {user ? (
            <>
              {user.isSuperUser && (
                <>
                  <button
                    onClick={() => {
                      setShowRegisterUserModal(true);
                      setSidebarOpen(false);
                    }}
                    className="text-left text-black"
                  >
                    Agregar usuario
                  </button>
                  <button
                    onClick={() => {
                      setShowUserListModal(true);
                      setSidebarOpen(false);
                    }}
                    className="text-left text-black"
                  >
                    Ver usuarios
                  </button>
                </>
              )}

              {canSeeHistory && (
                <button
                  onClick={() => {
                    setShowHistoryModal(true);
                    setSidebarOpen(false);
                  }}
                  className="text-left text-black"
                >
                  Historial
                </button>
              )}

              <button
                onClick={() => {
                  onLogout();
                  setSidebarOpen(false);
                }}
                className="text-left text-red-600"
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
              className="text-left text-black"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}
    </>
  );
}