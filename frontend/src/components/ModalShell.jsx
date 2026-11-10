// src/components/ModalShell.jsx
// Carcasa única para todos los modales: fondo con blur, panel animado,
// cabecera negra con título plateado + acento cian, cerrar con Esc / clic afuera.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
};

export default function ModalShell({
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = "md",
  children,
  footer,
  tone = "default", // "default" | "danger"
  closeOnBackdrop = true,
  zIndex = 10000,
  bodyClassName = "",
}) {
  // Esc para cerrar + bloquear scroll del fondo
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const accent = tone === "danger" ? "from-red-500/0 via-red-500 to-red-500/0" : "from-cyan-400/0 via-cyan-400 to-cyan-400/0";

  return createPortal(
    <motion.div
      className="fs-modal fixed inset-0 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
      style={{ zIndex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <motion.div
        className={`relative flex max-h-[92svh] w-full ${SIZES[size] || SIZES.md} flex-col overflow-hidden rounded-t-3xl bg-white text-black shadow-[0_30px_80px_-10px_rgba(0,0,0,0.6)] ring-1 ring-black/5 sm:rounded-3xl`}
        initial={{ y: 40, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* Cabecera */}
        {(title || Icon) && (
          <div className="relative shrink-0 overflow-hidden bg-black px-6 pb-5 pt-6 text-white">
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="relative flex items-center gap-3 pr-10">
              {Icon && (
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tone === "danger" ? "bg-red-500/15 text-red-400 ring-red-500/30" : "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30"}`}>
                  <Icon size={16} />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl uppercase leading-none tracking-wide text-silver">{title}</h2>
                {subtitle && <p className="mt-1 truncate text-xs text-white/55">{subtitle}</p>}
              </div>
            </div>
            <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r ${accent}`} />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:text-cyan-300"
        >
          <FaTimes size={14} />
        </button>

        {/* Contenido */}
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 ${bodyClassName}`}>{children}</div>

        {footer && <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:px-6">{footer}</div>}
      </motion.div>
    </motion.div>,
    document.body
  );
}
