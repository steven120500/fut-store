import logo from "../assets/logo.png";
import { FaUser } from "react-icons/fa";
import UserDropDown from "./UserDropDown";

export default function Header({
  onLoginClick,
  onLogout,
  onLogoClick, // callback para volver al inicio
  user,
  canSeeHistory,
  isSuperUser,
  setShowRegisterUserModal,
  setShowUserListModal,
  setShowHistoryModal,
}) {
  return (
    <header className="bg-white shadow-md px-4 sm:px-6 py-3 sm:py-4 relative">
      {/* Fila superior: logo izq, usuario der */}
      <div className="flex items-center justify-between">
        {/* Logo como botón */}
        <button
          onClick={onLogoClick}
          className="focus:outline-none bg-white"
          title="Volver al inicio"
        >
          {/* Logo aquí si querés usarlo */}
          {/* <img src={logo} alt="Logo FutStore" className="h-8 sm:h-10" /> */}
        </button>

        {/* Botón de usuario o Login */}
        <div className="flex items-center">
          {user ? (
            <UserDropDown
              isSuperUser={isSuperUser}
              onLogout={onLogout}
              onAddUser={() => setShowRegisterUserModal(true)}
              onViewUsers={() => setShowUserListModal(true)}
              onViewHistory={() => setShowHistoryModal(true)}
              canSeeHistory={user?.isSuperUser || user?.roles?.includes("history")}
            />
          ) : (
            <button
              onClick={onLoginClick}
              title="Iniciar sesión / Registrarse"
              className="rounded-full p-3 shadow-lg transition text-white bg-black hover:bg-gray-800"
            >
              <FaUser size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Título */}
      <div className="mt-2">
      <h1 className="typing-effect">
  FutStore
</h1>
      </div>
    </header>
  );
}