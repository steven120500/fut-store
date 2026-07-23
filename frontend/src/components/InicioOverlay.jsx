import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function InicioOverlay({ onComplete }) {
  const camisasMundial = [
    "/Japon.png",
    "/Mexico.png",
    "/Espana.png",
    "/Portugal.png",
    "/Italia.png",
    "/Usa.png"
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000); // Mantenemos los 4 segundos para disfrutar la órbita completa
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        filter: "blur(6px)",
        transition: { duration: 0.6, ease: "easeOut" }
      }}
      className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* 🌀 CONTENEDOR CENTRAL DE LA ÓRBITA */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        
        {/* Aura dorada suave de fondo */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-96 h-96 bg-amber-500/20 rounded-full blur-[90px]" 
        />

        {/* 👕 Camisetas orbitando en un radio amplio alrededor de las letras SIN ROTAR SOBRE SÍ MISMAS */}
        {camisasMundial.map((src, i) => {
          // Distribución angular original
          const angle = (i * 2 * Math.PI) / camisasMundial.length;
          
          // Determinamos el radio de órbita según el tamaño de la pantalla (Radio grande mantenido)
          const isMobile = window.innerWidth < 768;
          const radius = isMobile ? 130 : 180; 

          return (
            <motion.img
              key={src}
              src={src}
              alt="Camiseta Selección"
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1, 1, 0.4],
                // 🏆 CORRECCIÓN: Fijamos la rotación axial en 0. 
                // Las camisetas ya no giran 360 grados, se mantienen derechas.
                rotate: 0, 
                // Mantenemos la lógica de traslación circular épica alrededor del texto
                x: [0, Math.cos(angle) * radius, Math.cos(angle + 0.5) * radius, Math.cos(angle) * (radius * 2.5)],
                y: [0, Math.sin(angle) * radius, Math.sin(angle + 0.5) * radius, Math.sin(angle) * (radius * 2.5)],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 3.8,
                times: [0, 0.15, 0.85, 1],
                ease: "easeOut",
                delay: i * 0.1
              }}
              className="absolute w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_15px_25px_rgba(255,255,255,0.15)] select-none pointer-events-none"
            />
          );
        })}
      </div>

      {/* ✍️ TEXTOS DE BIENVENIDA (Fijos en el centro de la órbita) */}
      <div className="text-center px-6 z-10 max-w-xl relative">
        <motion.h2
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-white font-black text-4xl sm:text-6xl tracking-tighter uppercase italic select-none"
        >
          ¡Bienvenido a <span className="text-amber-400">FutStore</span>!
        </motion.h2>
        
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          className="mt-4 text-gray-400 font-bold tracking-[0.25em] text-xs sm:text-base select-none"
        >
          SIEMPRE LA MEJOR <span className="text-white border-b-[3px] border-amber-500 pb-1">CALIDAD</span>
        </motion.p>
      </div>

      {/* 🌟 BARRA DE CARGA */}
      <div className="absolute bottom-16 w-48 h-[2px] bg-neutral-900 overflow-hidden rounded-full">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .text-amber-400 {
          text-shadow: 0 0 35px rgba(251, 191, 36, 0.4);
        }
      `}} />
    </motion.div>
  );
}