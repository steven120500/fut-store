// src/components/Contacto.jsx
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

// 🎨 El mismo plateado que usas en el resto de la app
const silverGradient = "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #d1d1d1 100%)";

export default function Contacto() {
  return (
    <div className="w-full py-6 flex flex-col items-center gap-4">
      
      {/* Texto opcional (puedes borrarlo si prefieres solo iconos) */}
      <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
        Síguenos en redes
      </p>

      {/* Íconos sociales */}
      <div className="flex justify-center gap-6">
        
        {/* FACEBOOK */}
        <motion.a
          href="https://www.facebook.com/profile.php?id=61559013514708&locale=es_LA"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-colors duration-300 group"
          style={{ background: silverGradient }}
        >
          <FaFacebookF className="text-2xl text-gray-800 group-hover:text-[#1877F2] transition-colors" />
        </motion.a>

        {/* INSTAGRAM */}
        <motion.a
          href="https://www.instagram.com/futstore_cr/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-colors duration-300 group"
          style={{ background: silverGradient }}
        >
          <FaInstagram className="text-2xl text-gray-800 group-hover:text-[#E1306C] transition-colors" />
        </motion.a>

        {/* WHATSAPP */}
        <motion.a
          href="https://wa.me/50672327096"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-colors duration-300 group"
          style={{ background: silverGradient }}
        >
          <FaWhatsapp className="text-2xl text-gray-800 group-hover:text-[#25D366] transition-colors" />
        </motion.a>

      </div>
    </div>
  );
}