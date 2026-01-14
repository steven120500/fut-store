import React from "react";
import { motion } from "framer-motion";

export default function Bienvenido() {
  const handleVerOfertas = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };

  const handleVerDisponibles = () => {
    window.dispatchEvent(new CustomEvent("filtrarDisponibles"));
  };

  // ✨ Variantes para la animación escalonada del texto
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 * i },
    }),
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">
      
      {/* 🖼️ Fondo oscuro con movimiento suave */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/fotofondo1.jpg"
          alt="Fondo FutStore"
          className="w-full h-full object-cover object-center brightness-[0.5]"
        />
      </motion.div>

      {/* 🌑 Overlay Degradado */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />

      {/* 🔹 Contenido Principal */}
      <div className="mt-16 sm:mt-18 md:mt-24 relative z-10 px-6 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* ✨ TÍTULO ANIMADO */}
        <motion.h1 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight drop-shadow-2xl flex flex-wrap justify-center gap-x-3 gap-y-1"
        >
          <motion.span variants={childVariants} className="text-plateado">
            Bienvenido
          </motion.span>
          <motion.span variants={childVariants} className="text-plateado">
            a
          </motion.span>
          <motion.span 
            variants={childVariants}
            className="text-plateado bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-300 md:ml-2"
          >
            FutStore
          </motion.span>
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
          className="mt-6 text-plateado text-2xl sm:text-2xl md:text-3xl font-medium tracking-wide drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] max-w-2xl"
        >
          La mejor calidad, la misma pasión.
        </motion.p>

        {/* 🔘 Botones Animados */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 150, damping: 15 }}
          className="mt-12 flex flex-row sm:flex-row gap-4 sm:gap-8 w-full justify-center items-center"
        >
          {/* Botón Verde */}
          <motion.button
            onClick={handleVerDisponibles}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            /* ✅ CLASE AGREGADA AQUI: boton-luminoso-verde */
            /* Ajustes de tamaño responsivos: w-[180px] (móvil) -> sm:w-auto (pc) */
            className="boton-luminoso-verde group relative text-white font-bold 
                       w-[150px] sm:w-auto sm:min-w-[220px] 
                       px-6 py-3 sm:px-8 sm:py-4
                       text-base sm:text-xl
                       rounded-full overflow-hidden transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Ver Disponibles
            </span>
          </motion.button>

          {/* Botón Rojo */}
          <motion.button
            onClick={handleVerOfertas}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            /* ✅ CLASE AGREGADA AQUI: boton-luminoso-rojo */
            className="boton-luminoso-rojo group relative text-white font-bold 
                       w-[150px] sm:w-auto sm:min-w-[220px] 
                       px-6 py-3 sm:px-8 sm:py-4 
                       text-base sm:text-xl
                       rounded-full overflow-hidden transition-all duration-300"
          >
             <span className="relative z-10 flex items-center justify-center gap-2">
              Ver Ofertas 
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}