// src/components/ConfirmDialog.jsx
// Confirmación reutilizable con la identidad de FutStore (reemplaza window.confirm y los "Sí / No" sueltos).
import { AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";
import ModalShell from "./ModalShell";

export default function ConfirmDialog({
  open,
  title = "¿Estás seguro?",
  subtitle,
  message,
  details, // contenido opcional (resumen de lo que se va a borrar)
  confirmLabel = "Sí, eliminar",
  cancelLabel = "Cancelar",
  tone = "danger", // "danger" | "default"
  icon = tone === "danger" ? FaTrash : FaExclamationTriangle,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <AnimatePresence>
      {open && (
        <ModalShell
          onClose={loading ? () => {} : onClose}
          title={title}
          subtitle={subtitle}
          icon={icon}
          size="sm"
          tone={tone}
          zIndex={100001}
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={loading} className="fs-btn fs-btn-ghost flex-1">
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                autoFocus
                className={`fs-btn flex-1 ${tone === "danger" ? "fs-btn-danger" : "fs-btn-primary"}`}
              >
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {loading ? "Procesando…" : confirmLabel}
              </button>
            </div>
          }
        >
          {message && <p className="text-sm leading-relaxed text-zinc-600">{message}</p>}
          {details && <div className="mt-4">{details}</div>}
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
