import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 📦 DATOS DEL CARRUSEL (Ofertas ahora de primero)
const slides = [
  { id: 1, isOffer: true, title: "Ver Ofertas", eventName: "filtrarOfertas" },
  { id: 2, image: "/RetroB.png", title: "Ver Retros", eventName: "filtrarRetros" },
  { id: 3, image: "/PlayerB.png", title: "Ver Player", eventName: "filtrarPlayer" },
  { id: 4, image: "/FanB.png", title: "Ver Fan", eventName: "filtrarFan" },
  { id: 5, image: "/NacionalB.png", title: "Ver Nacional", eventName: "filtrarNacional" }
];

export default function Bienvenido() {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigation = () => {
    window.dispatchEvent(new CustomEvent(slides[index].eventName));
  };

  return (
    <section className="relative w-full h-full sm:min-h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* 🖼️ FONDO RESPONSIVE */}
      <div className="absolute inset-0 z-0">
        <img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="Fondo FutStore"
          className="w-full h-full object-fill brightness-[0.5]" 
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      {/* 🔹 CONTENIDO PRINCIPAL */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full pt-16 md:pt-32">
        
        {/* IZQUIERDA: TEXTOS */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="mt-2 mb-16 md:mt-0 md:mb-0 text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
              BIENVENIDO
            </h1>
            <h2 className="-mt-10 mb-6 md:mt-0 md:mb-0 text-4xl md:text-6xl font-light text-gray-200 mt-2">
              a <span className="font-serif italic text-white">FutStore</span>
            </h2>
            <p className="-mt-3 mb-3 md:mt-0 md:mb-0 text-gray-300 text-lg md:text-xl max-w-md mx-auto md:mx-0 font-medium">
              La élite del fútbol, en tu piel.
            </p>
          </motion.div>
        </div>

        {/* DERECHA: CAMISETAS + BOTÓN */}
        <div className="relative h-[400px] md:h-[600px] flex items-center justify-center order-1 md:order-2 mt-36 md:mt-0">
          
          <AnimatePresence mode="wait">
            {slides[index].isOffer ? (
              /* 🧩 COMBO DE 3 CAMISETAS PARA OFERTAS (SLIDE 1) */
              <motion.div 
                key="combo-ofertas"
                className="relative w-full h-full flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {/* 1. Retro */}
                <motion.img 
                  src="/RetroB.png" 
                  initial={{ x: -50, rotate: -15, opacity: 0 }}
                  animate={{ x: isMobile ? -40 : -80, rotate: -15, opacity: 0.8 }}
                  className="absolute w-2/3 md:w-full max-h-[70%] object-contain z-0 filter blur-[1px]"
                />
                {/* 2. Fan */}
                <motion.img 
                  src="/FanB.png" 
                  initial={{ x: 50, rotate: 15, opacity: 0 }}
                  animate={{ x: isMobile ? 40 : 80, rotate: 15, opacity: 0.8 }}
                  className="absolute w-2/3 md:w-full max-h-[70%] object-contain z-0 filter blur-[1px]"
                />
                {/* 3. Nacional (Adelante) */}
                <motion.img 
                  src="/NacionalB.png" 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{ filter: "drop-shadow(0px 20px 40px rgba(0,0,0,0.8))" }}
                  className="relative w-full max-h-[85%] object-contain z-10"
                />
              </motion.div>
            ) : (
              /* 👕 CAMISETA INDIVIDUAL (PARA EL RESTO) */
              <motion.img
                key={slides[index].id}
                src={slides[index].image}
                initial={{ opacity: 0, x: 100, rotate: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, rotate: -10, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                style={{ filter: "drop-shadow(0px 20px 40px rgba(0,0,0,0.7))" }}
                className="max-h-full max-w-full object-contain relative z-10"
              />
            )}
          </AnimatePresence>

          {/* 🔘 BOTÓN FLOTANTE DINÁMICO */}
          <div className="absolute bottom-10 right-4 md:right-12 z-20">
            <AnimatePresence mode="wait">
              <motion.button
                key={slides[index].id}
                onClick={handleNavigation}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-8 py-3 rounded-full font-black text-lg shadow-2xl transition-all uppercase tracking-tighter ring-2 ring-black
                  ${slides[index].isOffer 
                    ? "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]" 
                    : "bg-gradient-to-r from-gray-200 via-white to-gray-300 text-black hover:bg-white"
                  }`}
              >
                {slides[index].title}
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}