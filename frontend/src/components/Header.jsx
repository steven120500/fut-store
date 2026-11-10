import logo from "../assets/logo.png";
import {
  FaTimes, FaShoppingBag, FaUser, FaBoxOpen,
  FaHistory, FaCashRegister, FaChartLine, FaBalanceScale,
  FaColumns, FaUserPlus, FaUsers, FaSignOutAlt, FaChevronRight,
} from "react-icons/fa";
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import Contacto from "./Contacto";
import TopBanner from "./TopBanner";
import { useCart } from "../context/CartContext";

function NavItem({ icon: Icon, children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        primary ? "bg-black text-white hover:bg-zinc-800" : "text-zinc-800 hover:bg-zinc-100"
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${primary ? "bg-white/10" : "bg-zinc-100 group-hover:bg-white"}`}>
        <Icon size={14} />
      </span>
      <span className="flex-1">{children}</span>
      <FaChevronRight size={10} className="opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
    </button>
  );
}

export default function Header({
  onLoginClick,
  onLogout,
  onLogoClick,
  user,
  isSuperUser,
  setShowRegisterUserModal,
  setShowUserListModal,
  onMedidasClick,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContacto, setShowContacto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const { cartCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquear scroll del body con paneles abiertos
  useEffect(() => {
    const open = sidebarOpen || showContacto;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, showContacto]);

  const handleCartClick = () => {
    if (cartCount > 0) navigate("/checkout");
    else toast.info("Tu carrito está vacío 🛒");
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const go = (path) => { navigate(path); setSidebarOpen(false); };

  const pillBtn =
    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/85 transition hover:border-cyan-400/60 hover:bg-white/10 hover:text-white sm:px-4";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled ? "border-cyan-400/20 bg-black/90 backdrop-blur-xl" : "border-white/5 bg-black"
        }`}
        style={{ height: "var(--header-h)" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => { navigate("/"); onLogoClick?.(); }}
            title="Volver al inicio"
            className="flex shrink-0 items-center gap-3 border-0 bg-transparent p-0"
          >
            <img src={logo} alt="FutStore" className="h-11 w-11 rounded-full ring-1 ring-white/20 transition hover:scale-105 sm:h-14 sm:w-14" />
            <span className="hidden font-display text-2xl uppercase tracking-wider text-silver lg:block">FutStore</span>
          </button>

          {/* Accesos */}
          <nav className="flex items-center gap-2">
            <button onClick={onMedidasClick} className={pillBtn} aria-label="Guía de tallas">
              <LiaRulerSolid size={16} />
              <span className="hidden md:inline">Guía de tallas</span>
            </button>
            <button onClick={() => setShowContacto(true)} className={pillBtn} aria-label="Contacto">
              <FiPhoneCall size={14} />
              <span className="hidden md:inline">Contacto</span>
            </button>
          </nav>

          {/* Carrito y perfil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCartClick}
              aria-label="Carrito"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white text-black shadow-lg transition hover:scale-105 active:scale-95 sm:h-11 sm:w-11"
            >
              <FaShoppingBag size={16} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-black bg-red-600 px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Menú de usuario"
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/15 bg-zinc-900 text-white transition hover:border-white/40 sm:h-11 sm:w-11"
            >
              {user ? (
                <span className="text-xs font-black tracking-tight text-silver">{getInitials(user.firstName || user.username)}</span>
              ) : (
                <FaUser size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      <TopBanner />

      {/* 🔸 SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.aside
              className="fixed right-0 top-0 flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="relative overflow-hidden bg-black px-6 pb-6 pt-6 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar"
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <FaTimes size={14} />
                </button>
                <img src={logo} alt="" className="mb-4 h-12 w-12 rounded-full ring-1 ring-white/20" />
                {user ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Sesión iniciada</p>
                    <p className="truncate text-2xl font-black">{user.firstName || user.username}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">FutStore</p>
                    <p className="text-2xl font-black">¡Bienvenido!</p>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                {user ? (
                  <nav className="space-y-1">
                    <NavItem icon={FaBoxOpen} primary onClick={() => go("/pedidos")}>Gestión de pedidos</NavItem>
                    <div className="h-2" />
                    <NavItem icon={FaColumns} onClick={() => go("/apartados")}>Tablero de apartados</NavItem>
                    <NavItem icon={FaCashRegister} onClick={() => go("/ventas")}>Registro de ventas</NavItem>
                    <NavItem icon={FaHistory} onClick={() => go("/historial")}>Historial de cambios</NavItem>

                    {isSuperUser && (
                      <>
                        <p className="px-4 pb-1 pt-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Administración</p>
                        <NavItem icon={FaUserPlus} onClick={() => { setShowRegisterUserModal?.(true); setSidebarOpen(false); }}>Agregar usuario</NavItem>
                        <NavItem icon={FaUsers} onClick={() => { setShowUserListModal?.(true); setSidebarOpen(false); }}>Lista de usuarios</NavItem>
                        <NavItem icon={FaBalanceScale} onClick={() => go("/balance")}>Balance y gastos</NavItem>
                        <NavItem icon={FaChartLine} onClick={() => go("/reportes")}>Reporte diario</NavItem>
                      </>
                    )}
                  </nav>
                ) : (
                  <div className="px-2 pt-4 text-center">
                    <p className="mb-6 text-sm text-zinc-500">Inicia sesión para gestionar pedidos, ventas y apartados.</p>
                    <button
                      onClick={() => { onLoginClick?.(); setSidebarOpen(false); }}
                      className="w-full rounded-xl bg-black px-4 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition hover:bg-zinc-800"
                    >
                      Iniciar sesión
                    </button>
                    <div className="mt-8 border-t border-zinc-100 pt-6">
                      <Contacto />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 px-4 py-4">
                {user && (
                  <button
                    onClick={() => { onLogout?.(); setSidebarOpen(false); }}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-600/20 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-50"
                  >
                    <FaSignOutAlt size={12} /> Cerrar sesión
                  </button>
                )}
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">FutStore Costa Rica © {new Date().getFullYear()}</p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔹 MODAL CONTACTO */}
      <AnimatePresence>
        {showContacto && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setShowContacto(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
            >
              <div className="bg-black px-8 pb-6 pt-8 text-center text-white">
                <img src={logo} alt="" className="mx-auto mb-3 h-14 w-14 rounded-full ring-1 ring-white/20" />
                <h2 className="font-display text-3xl uppercase tracking-wide text-silver">Contáctanos</h2>
                <p className="mt-1 text-xs text-white/60">Respondemos rápido por WhatsApp</p>
              </div>
              <button
                onClick={() => setShowContacto(false)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <FaTimes size={14} />
              </button>
              <div className="px-6 pb-4">
                <Contacto />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
