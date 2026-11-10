// src/components/WhatsAppFloat.jsx
// Botón flotante de WhatsApp. Se monta directo en <body> (portal): así ningún contenedor con
// overflow/isolation/transform (como el hero) lo deja "por detrás", algo que en iPhone pasaba siempre.
import { createPortal } from "react-dom";
import { FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_URL } from "./Contacto";

export default function WhatsAppFloat() {
  if (typeof document === "undefined") return null;
  return createPortal(
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.45)] transition hover:scale-110 active:scale-95"
      style={{
        left: "calc(1.25rem + env(safe-area-inset-left, 0px))",
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40 [animation-duration:2.5s]" />
      <FaWhatsapp className="relative text-3xl" />
    </a>,
    document.body
  );
}
