// src/components/Contacto.jsx
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Contacto() {
  return (
    <div className="w-full py-10 flex flex-col items-center">
      {/* Íconos sociales */}
      <div className="flex justify-center gap-6">
        <a
          href="https://www.facebook.com/profile.php?id=61559013514708&locale=es_LA"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded hover:opacity-80 transition text-2xl"
          style={{
            backgroundColor: "#9E8F91",
            color: "#000",
            fontSize: "1.9rem",
          }}
        >
          <FaFacebookF />
        </a>

        <a
          href="https://www.instagram.com/futstore_cr/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded hover:opacity-80 transition text-2xl"
          style={{
            backgroundColor: "#9E8F91",
            color: "#000",
            fontSize: "1.9rem",
          }}
        >
          <FaInstagram />
        </a>

        <a
          href="https://wa.me/50672327096"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded hover:opacity-80 transition text-2xl"
          style={{
            backgroundColor: "#9E8F91",
            color: "#000",
            fontSize: "1.9rem",
          }}
        >
          <FaWhatsapp />
        </a>
      </div>
    </div>
  );
}