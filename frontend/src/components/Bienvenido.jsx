"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight, FaWhatsapp } from "react-icons/fa";

// 📦 DATOS DE PRODUCTOS
const slides = [
  { id: 0, image: "/TacosHero.png", title: "Comprar Tacos", eventName: "filtrarTacos", glowColor: "99, 102, 241" }, 
  { id: 1, image: "/PlayerB.png", title: "Ver Player", eventName: "filtrarPlayer", glowColor: "255, 255, 255" }, 
  { id: 2, image: "/RetroB.png", title: "Ver Retros", eventName: "filtrarRetros", glowColor: "156, 163, 175" }, 
  { id: 3, image: "/Descuento.png", title: "Ver Ofertas", eventName: "filtrarOfertas", isOffer: true, glowColor: "239, 68, 68" }, 
  { id: 4, image: "/FanB.png", title: "Ver Fan", eventName: "filtrarFan", glowColor: "59, 130, 246" }, 
  { id: 5, image: "/NacionalB.png", title: "Ver Nacional", eventName: "filtrarNacional", glowColor: "220, 38, 38" } 
];

export default function Bienvenido() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const touchStartX = useRef(0);

  useEffect(() => {
    let timeoutId;
    const checkSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth < 1024), 150);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => { window.removeEventListener("resize", checkSize); clearTimeout(timeoutId); };
  }, []);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIdx((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleNavigation = (eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setInterval(() => nextSlide(), 2500);
    return () => clearInterval(timer);
  }, [isPaused, isAnimating, activeIdx]);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e) => {
    setIsPaused(false);
    const distance = touchStartX.current - e.changedTouches[0].clientX;
    if (distance > 50) nextSlide();
    else if (distance < -50) prevSlide();
  };

  // 🛠️ Animaciones con proporciones seguras
  const getCardStyle = (index) => {
    const total = slides.length;
    const diff = (index - activeIdx + total) % total;

    const scaleFactor = isMobile ? 0.85 : 1; 
    const xOffset = isMobile ? 120 : 300;
    const yOffset = isMobile ? 40 : 80;

    if (diff === 0) return { x: 0, y: 0, scale: 1 * scaleFactor, rotate: 0, zIndex: 30, opacity: 1, filter: "brightness(1) drop-shadow(0 15px 35px rgba(255,255,255,0.4))" };
    if (diff === 1) return { x: xOffset, y: yOffset, scale: 0.6 * scaleFactor, rotate: -20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    if (diff === total - 1) return { x: -xOffset, y: yOffset, scale: 0.6 * scaleFactor, rotate: 20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    if (diff === 2) return { x: xOffset - 40, y: yOffset + 100, scale: 0.4 * scaleFactor, rotate: -35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    if (diff === total - 2) return { x: -xOffset + 40, y: yOffset + 100, scale: 0.4 * scaleFactor, rotate: 35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    return { x: 0, y: 200, scale: 0.2, rotate: 0, zIndex: 0, opacity: 0 };
  };

  const activeSlide = slides[activeIdx];
  const displayName = activeSlide.title.replace("Comprar ", "").replace("Ver ", "").toUpperCase();

  return (
    <section 
      /* 🛠️ FIX INFALIBLE: Volvemos a la altura estricta con calc() para que no se aplaste */
      style={{ height: "calc(100vh - 120px)", minHeight: "550px" }}
      className="relative w-full flex flex-col items-center justify-between overflow-hidden bg-black select-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 🖼️ FONDOS */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,#1a1a24_0%,#050505_70%)]">
        <img src={isMobile ? "/FondoM.png" : "/FondoD.png"} alt="Fondo FutStore" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      {/* 🎠 ÁREA CENTRAL (Camiseta y Textos Gigantes) */}
      <div className="relative w-full max-w-7xl flex-1 flex items-center justify-center z-10 mt-6 lg:mt-10">
        
        {/* TEXTO GIGANTE (Fondo) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`txt-container-${activeIdx}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <h2 className="absolute text-center font-black text-white uppercase tracking-tighter leading-none -skew-x-12 z-50" style={{ fontSize: "clamp(50px, 10vw, 130px)", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              {displayName}
            </h2>
            <h2 className="absolute text-center font-black uppercase tracking-tighter leading-none -skew-x-12 z-[60]" style={{ fontSize: "clamp(50px, 10vw, 130px)", color: "transparent", WebkitTextStroke: isMobile ? "1px rgba(255,255,255,0.7)" : "2px rgba(255,255,255,0.7)" }}>
              {displayName}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* CARRUSEL DE PRODUCTOS */}
        {slides.map((slide, i) => (
          <motion.div
            key={slide.id}
            onClick={() => {
              const diff = (i - activeIdx + slides.length) % slides.length;
              if (diff === 1) nextSlide();
              if (diff === slides.length - 1) prevSlide();
            }}
            initial={false}
            animate={getCardStyle(i)}
            transition={{ type: "spring", stiffness: 80, damping: 14, mass: 1 }}
            className={`absolute flex items-center justify-center will-change-transform ${i === activeIdx ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <motion.div 
              animate={{ scale: i === activeIdx ? [1, 1.15, 1] : 1, opacity: i === activeIdx ? [0.6, 0.9, 0.6] : 0 }}
              transition={{ duration: 2.5, repeat: i === activeIdx ? Infinity : 0, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] lg:w-[350px] lg:h-[350px] max-w-[400px] max-h-[400px] rounded-full z-[25] pointer-events-none"
              style={{ background: `radial-gradient(circle, rgba(${slide.glowColor}, 0.8) 0%, rgba(${slide.glowColor}, 0.3) 40%, rgba(0,0,0,0) 70%)`, filter: "blur(40px)" }}
            />
            {/* 🛠️ Imágenes contenidas para que no se desborden en laptops */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-auto h-[25vh] lg:h-[35vh] max-h-[260px] lg:max-h-[320px] object-contain relative z-30 drop-shadow-xl"
              draggable="false"
            />
          </motion.div>
        ))}
      </div>

      {/* 🔘 ÁREA INFERIOR (Botón y Texto) */}
      <div className="relative z-[70] w-full flex flex-col items-center justify-end pb-8 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeSlide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <button
              onClick={() => handleNavigation(activeSlide.eventName)}
              className={`flex items-center gap-3 px-10 py-3 lg:px-12 lg:py-4 rounded-full font-black text-sm lg:text-base uppercase tracking-widest shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap ${
                activeSlide.isOffer
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                  : "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-gray-200"
              }`}
            >
              <span>{activeSlide.title}</span>
              <FaArrowRight className="text-xs lg:text-sm" />
            </button>
            
            <p className="text-gray-400 text-xs lg:text-sm tracking-widest font-medium uppercase drop-shadow-md text-center">
              La élite del fútbol, en tu piel.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 💬 BOTÓN FLOTANTE DE WHATSAPP */}
      <a 
        href="https://wa.me/50672327096" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 lg:bottom-8 lg:left-8 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.8)] transition-all duration-300 flex items-center justify-center cursor-pointer"
      >
        <FaWhatsapp className="text-3xl" />
      </a>
      
    </section>
  );
}