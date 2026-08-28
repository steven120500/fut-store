import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

// 📦 DATOS DEL CARRUSEL
const slides = [
  { id: 1, image: "/TacosHero.png", title: "Comprar Tacos", eventName: "filtrarTacos" },
  { id: 2, isOffer: true, title: "Ver Ofertas", eventName: "filtrarOfertas" },
  { id: 3, image: "/RetroB.png", title: "Ver Retros", eventName: "filtrarRetros" },
  { id: 4, image: "/PlayerB.png", title: "Ver Player", eventName: "filtrarPlayer" },
  { id: 5, image: "/FanB.png", title: "Ver Fan", eventName: "filtrarFan" },
  { id: 6, image: "/NacionalB.png", title: "Ver Nacional", eventName: "filtrarNacional" }
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

  // 🪄 VARIANTS PARA ANIMACIÓN DE TEXTOS EN CASCADA
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <section className="relative w-full h-full sm:min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* 🖼️ FONDO RESPONSIVE */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="Fondo FutStore"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-full h-full object-fill brightness-[0.5]" 
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      {/* 🔹 CONTENIDO PRINCIPAL */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full pt-16 md:pt-32">

        {/* IZQUIERDA: TEXTOS CON ANIMACIÓN PREMIUM */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
          >
            <motion.h1 variants={itemVariants} className="mt-8 mb-8 md:mt-10 md:mb-10 text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
              BIENVENIDO
            </motion.h1>
            
            <motion.h2 variants={itemVariants} className="-mt-8 mb-6 md:-mt-10 md:mb-10 text-4xl md:text-6xl font-light text-gray-200">
              a <span className="font-serif italic text-white">FutStore</span>
            </motion.h2>
            
            <motion.p variants={itemVariants} className="-mt-8 mb-10 md:mt-0 md:mb-0 text-gray-300 text-lg md:text-xl max-w-md mx-auto md:mx-0 font-medium">
              La élite del fútbol, en tu piel.
            </motion.p>
          </motion.div>
        </div>

        {/* DERECHA: CAMISETAS + BOTÓN */}
        <div className="relative h-[400px] md:h-[600px] flex items-center justify-center order-1 md:order-2 mt-36 md:mt-0">

          <AnimatePresence mode="wait">
            {slides[index].isOffer ? (
              /* 🧩 COMBO DE 3 CAMISETAS PARA OFERTAS (SLIDE 2) */
              <motion.div 
                key="combo-ofertas"
                className="relative w-full h-full flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
              >
                {/* 1. Descuento1 */}
                <motion.img 
                  src="/Descuento1.png" 
                  initial={{ x: 0, y: 30, rotate: 0, opacity: 0, scale: 0.7 }}
                  animate={{ x: isMobile ? -50 : -90, y: 10, rotate: -20, opacity: 0.7, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.1 }}
                  className="absolute w-2/3 md:w-full max-h-[70%] object-contain z-0"
                />
                {/* 2. Descuento2 */}
                <motion.img 
                  src="/Descuento2.png" 
                  initial={{ x: 0, y: 30, rotate: 0, opacity: 0, scale: 0.7 }}
                  animate={{ x: isMobile ? 50 : 90, y: 10, rotate: 20, opacity: 0.7, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.2 }}
                  className="absolute w-2/3 md:w-full max-h-[70%] object-contain z-0"
                />
                {/* 3. Descuento Principal */}
                <motion.img 
                  src="/Descuento.png" 
                  initial={{ y: 80, opacity: 0, scale: 0.8 }}
                  animate={{ y: -10, opacity: 1, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.3 }}
                  style={{ filter: "drop-shadow(0px 30px 40px rgba(0,0,0,0.9))" }}
                  className="relative w-full max-h-[85%] object-contain z-10"
                />
              </motion.div>
            ) : (
              /* 👕 CAMISETA / TACOS INDIVIDUAL (Efecto cinemático premium) */
              <motion.img
                key={slides[index].id}
                src={slides[index].image}
                initial={{ opacity: 0, x: 120, rotate: 15, scale: 0.7, filter: "blur(12px)" }}
                animate={{ opacity: 1, x: 0, rotate: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -120, rotate: -15, scale: 0.7, filter: "blur(12px)" }}
                transition={{ type: "spring", stiffness: 90, damping: 15, mass: 1 }}
                style={{ filter: "drop-shadow(0px 20px 40px rgba(0,0,0,0.7))" }}
                className={`object-contain relative z-10 ${
                  // 🔥 TUS MEDIDAS INTACTAS
                  slides[index].eventName === "filtrarTacos"
                  ? "h-66 md:h-auto md:w-[110%] md:max-w-none" 
                    : "max-h-full max-w-full"
                }`}
              />
            )}
          </AnimatePresence>

          {/* 🔘 BOTÓN FLOTANTE DINÁMICO PREMIUM */}
          <div className="absolute bottom-10 right-4 md:right-12 z-20">
            <AnimatePresence mode="wait">
              <motion.button
                key={slides[index].id}
                onClick={handleNavigation}
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex items-center gap-3 px-8 py-3.5 rounded-full font-black text-sm md:text-base shadow-2xl transition-all uppercase tracking-widest overflow-hidden border
                  ${slides[index].isOffer 
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)]" 
                    : "bg-gradient-to-r from-gray-100 to-white text-black border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]"
                  }`}
              >
                {/* ✨ Efecto de destello de luz al hacer hover (Shimmer) */}
                <div className="absolute top-0 left-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-[-20deg]" />

                <span className="relative z-10">{slides[index].title}</span>

                {/* ➡️ Flecha interactiva */}
                <FaArrowRight className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ⏱️ BARRA DE PROGRESO INFERIOR (Estilo Apple) */}
      <div className="absolute -bottom-0 left-0 w-full z-30 px-6 md:px-12 flex justify-center gap-2 max-w-3xl mx-auto mb-4">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" 
            onClick={() => setIndex(i)}
          >
            {i === index ? (
              <motion.div 
                className="h-full bg-gradient-to-r from-white to-gray-200 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                initial={{ width: "0%" }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 4, ease: "linear" }}
              />
            ) : (
              <div className={`h-full transition-colors duration-300 ${i < index ? "bg-white/60" : "bg-transparent"}`} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}