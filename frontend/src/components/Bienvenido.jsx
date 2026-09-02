"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

// 📦 DATOS DE PRODUCTOS
const slides = [
  { id: 0, image: "/TacosHero.png", title: "Comprar Tacos", eventName: "filtrarTacos" },
  { id: 1, image: "/PlayerB.png", title: "Ver Player", eventName: "filtrarPlayer" },
  { id: 2, image: "/RetroB.png", title: "Ver Retros", eventName: "filtrarRetros" },
  { id: 3, image: "/Descuento.png", title: "Ver Ofertas", eventName: "filtrarOfertas", isOffer: true },
  { id: 4, image: "/FanB.png", title: "Ver Fan", eventName: "filtrarFan" },
  { id: 5, image: "/NacionalB.png", title: "Ver Nacional", eventName: "filtrarNacional" }
];

export default function Bienvenido() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para Swipe en celular
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Detección de pantalla
  useEffect(() => {
    let timeoutId;
    const checkSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => {
      window.removeEventListener("resize", checkSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // ⏱️ Rotación automática rápida (2 segundos)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 3000); 
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = slides[activeIdx];

  const handleNavigation = (eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // 📱 Lógica Táctil (Móvil)
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };
  
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPaused(false);
      return;
    }
    const distance = touchStart - touchEnd;
    if (distance > 75) setActiveIdx((prev) => (prev + 1) % slides.length);
    if (distance < -75) setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
    setTouchStart(0);
    setTouchEnd(0);
    setIsPaused(false);
  };

  // 📐 Estilos del carrusel 3D (Móvil)
  const getCardStyle = (index) => {
    const total = slides.length;
    const diff = (index - activeIdx + total) % total;

    if (diff === 0) return { zIndex: 30, transform: "translate(-50%, -50%) scale(1) rotateY(0deg)", opacity: 1, filter: "brightness(1)", pointerEvents: "auto" };
    if (diff === 1) return { zIndex: 20, transform: "translate(calc(-50% + 90px), -50%) scale(0.75) rotate(6deg)", opacity: 0.45, filter: "brightness(0.65)", pointerEvents: "auto" };
    if (diff === total - 1) return { zIndex: 20, transform: "translate(calc(-50% - 90px), -50%) scale(0.75) rotate(-6deg)", opacity: 0.45, filter: "brightness(0.65)", pointerEvents: "auto" };
    return { zIndex: 10, transform: "translate(-50%, -50%) scale(0.5)", opacity: 0, pointerEvents: "none" };
  };

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden select-none bg-black pt-20"
    >
      {/* 🖼️ FONDO GENERAL */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <img src={isMobile ? "/FondoM.png" : "/FondoD.png"} alt="Fondo FutStore" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* ========================================================
          📱 VERSIÓN CELULAR (Texto Arriba, Imágenes Centro, Botón Abajo)
          ======================================================== */}
      <div className="md:hidden flex flex-col items-center justify-between w-full h-[70vh] z-20 px-6">
        
        {/* Título Arriba */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mt-4"
        >
          <h1 className="text-5xl font-black text-white leading-none tracking-tighter drop-shadow-xl">
            BIENVENIDO
          </h1>
          <h2 className="text-2xl font-light text-gray-200 mt-1">
            a <span className="font-serif italic text-white font-bold">FutStore</span>
          </h2>
        </motion.div>

        {/* Carrusel Móvil en el Centro */}
        <div 
          className="relative w-full max-w-sm h-96 mx-auto [perspective:1000px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => setActiveIdx(i)}
              style={getCardStyle(i)}
              className="absolute top-1/2 left-1/2 cursor-pointer transition-all duration-700 ease-out flex items-center justify-center"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-auto object-contain transition-all duration-700 ${
                  i === activeIdx
                    ? "max-h-[220px] drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)]"
                    : "max-h-[150px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Botón Abajo de las imágenes */}
        <div className="mb-4 h-12">
          <AnimatePresence mode="wait">
            <motion.button
              key={`btn-mob-${activeSlide.id}`}
              onClick={() => handleNavigation(activeSlide.eventName)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
              className={`flex items-center gap-2.5 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl border ${
                activeSlide.isOffer
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500/50"
                  : "bg-white text-black border-white/80"
              }`}
            >
              <span>{activeSlide.title}</span>
              <FaArrowRight className="text-xs" />
            </motion.button>
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================
          💻 VERSIÓN DESKTOP (Split Screen - Sin Cambios)
          ======================================================== */}
      <div className="hidden md:grid relative z-10 w-full max-w-7xl mx-auto px-12 grid-cols-2 gap-12 items-center h-full">
        
        {/* Columna Izquierda: Texto y Botón Agrupados */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start text-left"
        >
          <h1 className="text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
            BIENVENIDO
          </h1>
          <h2 className="text-4xl lg:text-6xl font-light text-gray-200 mt-2">
            a <span className="font-serif italic text-white font-bold">FutStore</span>
          </h2>
          <p className="text-gray-400 text-lg lg:text-xl font-medium mt-4 max-w-md">
            La élite del fútbol, en tu piel. Equipate con lo mejor de esta temporada.
          </p>

          <div className="mt-10 h-16">
            <AnimatePresence mode="wait">
              <motion.button
                key={`btn-desk-${activeSlide.id}`}
                onClick={() => handleNavigation(activeSlide.eventName)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl border transition-all ${
                  activeSlide.isOffer
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                    : "bg-white text-black border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-gray-200"
                }`}
              >
                <span>{activeSlide.title}</span>
                <FaArrowRight />
              </motion.button>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Columna Derecha: Animación de Imagen */}
        <div className="relative flex flex-col items-center justify-center h-[500px] lg:h-[600px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide.id}
              src={activeSlide.image}
              alt={activeSlide.title}
              initial={{ opacity: 0, scale: 0.4, y: 150, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4, y: -150, rotate: 15 }}
              transition={{ type: "spring", stiffness: 90, damping: 12 }}
              className="max-h-[400px] lg:max-h-[500px] object-contain drop-shadow-[0_20px_40px_rgba(255,255,255,0.15)] z-20"
            />
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}