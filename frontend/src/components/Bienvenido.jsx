import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Bienvenido() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleNavigation = () => {
    // Despacha el evento personalizado para el filtro del mundial
    window.dispatchEvent(new CustomEvent("filtrarMundial"));
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      
      {/* 🖼️ IMAGEN DE FONDO (BANNER) */}
      <div className="absolute inset-0 z-10 sm:pt-56 pt-28">
        <img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="FIFA World Cup 2026 FutStore"
          className="w-full h-full object-cover md:object-fill" 
        />
      </div>

      {/* 🔘 MÁSCARA DEL BOTÓN INVISIBLE (Z-INDEX SUPERIOR) */}
      <div 
        className={`absolute z-30 w-full flex justify-start ml-36 sm:ml-72
          ${isMobile ? "bottom-10" : "bottom-72"}`}
      >
        <motion.button
          onClick={handleNavigation}
          // Micro-interacciones para dar feedback visual de que es clickable
         
          whileTap={{ scale: 0.96 }}
          className="cursor-pointer rounded-xl transition-all"
          style={{
            // Estas dimensiones y posiciones están ajustadas para calzar sobre el botón dorado impreso en la imagen
            width: isMobile ? "290px" : "800px",
            height: isMobile ? "60px" : "110px",
            background: "transparent", // Mantener invisible pero clickable
            border: "none",
            outline: "none"
          }}
          title="Ver Colección Mundial"
        />
      </div>

    </section>
  );
}