import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="pt-10 mt-10 bg-white text-center py-8 border-t border-gray-200 relative z-10">
      {/* Íconos sociales */}
      <div className="flex justify-center gap-6 mb-6">
        <a
          href="https://www.facebook.com/profile.php?id=61559013514708&locale=es_LA"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black text-white w-12 h-12 flex items-center justify-center rounded  hover:opacity-80 transition text-2xl z-50 pointer-events-auto"
          style={{
            backgroundColor: "#d4af37",
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
          className="bg-black text-white w-12 h-12 flex items-center justify-center rounded hover:opacity-80 transition text-2xl z-50 pointer-events-auto"
          style={{
            backgroundColor: "#d4af37",
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
          className="bg-black text-white w-12 h-12 flex items-center justify-center rounded  hover:opacity-80 transition text-2xl z-50 pointer-events-auto"
          style={{
            backgroundColor: "#d4af37",
            color: "#000",
            fontSize: "1.9rem",
          }}
        >
          <FaWhatsapp />
        </a>
      </div>

       {/* Texto inferior */}
       <div className="mt-4 text-sm text-gray-800 space-y-1">
        <p>© 2025 FutStore. Todos los derechos reservados.</p>
        <p>
          Diseñado por{" "}
          <a
            href="https://wa.me/50688028216"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 font-bold underline hover:text-gray-800 font-medium"
          >
            Steven Corrales Alfaro
          </a>
        </p>
      </div>
    </footer>
  );
}