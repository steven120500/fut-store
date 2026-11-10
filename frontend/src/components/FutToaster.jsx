// src/components/FutToaster.jsx
// Contenedor único de notificaciones con la identidad de FutStore (negro, plateado y cian).
// Todas las llamadas existentes a toast.success / error / info / warning lo usan automáticamente.
import { ToastContainer, Slide } from "react-toastify";
import { FaCheck, FaTimes, FaExclamation, FaInfo } from "react-icons/fa";
import logo from "../assets/logo.png";

const ICONS = {
  success: { Icon: FaCheck, cls: "fut-toast-icon--success" },
  error: { Icon: FaTimes, cls: "fut-toast-icon--error" },
  warning: { Icon: FaExclamation, cls: "fut-toast-icon--warning" },
  info: { Icon: FaInfo, cls: "fut-toast-icon--info" },
};

function ToastIcon({ type, isLoading }) {
  if (isLoading) {
    return (
      <span className="fut-toast-icon fut-toast-icon--loading">
        <span className="fut-toast-spinner" />
      </span>
    );
  }
  const conf = ICONS[type];
  if (!conf) {
    return (
      <span className="fut-toast-icon">
        <img src={logo} alt="" className="h-full w-full rounded-full" />
      </span>
    );
  }
  const { Icon, cls } = conf;
  return (
    <span className={`fut-toast-icon ${cls}`}>
      <Icon size={11} />
    </span>
  );
}

function CloseButton({ closeToast }) {
  return (
    <button type="button" onClick={closeToast} aria-label="Cerrar notificación" className="fut-toast-close">
      <FaTimes size={10} />
    </button>
  );
}

export default function FutToaster() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3500}
      newestOnTop
      closeOnClick
      pauseOnHover
      pauseOnFocusLoss={false}
      draggable
      limit={4}
      transition={Slide}
      theme="dark"
      icon={(props) => <ToastIcon {...props} />}
      closeButton={CloseButton}
    />
  );
}
