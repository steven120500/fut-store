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
    // 🏆 Dispara el evento global que App.jsx escucha para activar el modo Mundial
    window.dispatchEvent(new CustomEvent("filtrarMundial"));
  };

  return (
    <section className="relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      
      {/* 🖼️ CONTENEDOR RELATIVO DEL BANNER */}
      <div className="relative w-full sm:pt-56 pt-28 z-0">
        
        {/* Banner de fondo adaptativo */}
        <img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="FIFA World Cup 2026 FutStore"
          className="w-full h-full object-cover md:object-fill" 
        />

        {/* 🔘 BOTÓN GIGANTE INVISIBLE (Cubre el 100% del Banner) 
            Usa 'absolute inset-0' para abarcar toda la imagen y asegurar el click en cualquier resolución o split view */}
        <motion.button
          onClick={handleNavigation}
          whileTap={{ scale: 0.99 }} // Un sutil efecto de pulsación global al tocar el banner
          className="absolute inset-0 w-full h-full cursor-pointer z-30 focus:outline-none"
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            WebkitTapHighlightColor: "transparent" // Quita el recuadro azul feo que mete Android/iOS al tocar pantallas completas
          }}
          title="Ver Colección Mundial 2026"
        />
        
      </div>

    </section>
  );
}