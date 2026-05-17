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
    // Despacha el evento para filtrar por las camisetas Nacionales / Mundial
    window.dispatchEvent(new CustomEvent("filtrarNacional"));
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      
      {/* 🖼️ NUEVOS BANNERS MUNDIALISTAS (REEMPLAZO DIRECTO) */}
      <div className="absolute inset-0 z-0 sm:pt-56 pt-28">
        <img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="FIFA World Cup 2026 FutStore"
          className="w-full h-full object-cover md:object-fill" 
        />
        {/* Degradado inferior para conectar limpio con el fondo negro de la FilterBar */}
        
      </div>

      {/* 🔘 ÁREA INTERACTIVA ENCIMA DEL BOTÓN "COMPRAR AHORA" */}
      <div className={`absolute z-20 w-full flex justify-center 
        ${isMobile ? "bottom-[11.5%]" : "bottom-[33.5%] md:left-[-24.5%]"}`}
      >
        <motion.button
          onClick={handleNavigation}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="cursor-pointer rounded-xl transition-all"
          // Dimensiones calculadas para calzar sobre el botón dorado de tus diseños
          style={{
            width: isMobile ? "240px" : "210px",
            height: isMobile ? "55px" : "48px",
            background: "transparent",
            border: "none",
            outline: "none"
          }}
          title="Ver Colección Mundial"
        />
      </div>

    </section>
  );
}