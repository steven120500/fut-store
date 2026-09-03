"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight, FaWhatsapp } from "react-icons/fa";

// 📦 DATOS DE PRODUCTOS CON COLORES PARA LA LUZ TRASERA
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
  
  // Referencias para Swipe
  const touchStartX = useRef(0);

  // 1️⃣ Detección de pantalla
  useEffect(() => {
    let timeoutId;
    const checkSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 1024);
      }, 150);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => {
      window.removeEventListener("resize", checkSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // 2️⃣ Funciones de Navegación
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

  // 🛠️ Dispara el evento personalizado para el catálogo
  const handleNavigation = (eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // 3️⃣ ROTACIÓN AUTOMÁTICA
  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 3500);
    
    return () => clearInterval(timer);
  }, [isPaused, isAnimating, activeIdx]);

  // 4️⃣ Lógica Táctil (Móvil)
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e) => {
    setIsPaused(false);
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX;
    
    if (distance > 50) nextSlide();
    else if (distance < -50) prevSlide();
  };

  // 🛠️ VARIABLE PARA AJUSTAR LA ALTURA DE LA CAMISETA Y EL TEXTO
  // Un valor negativo (-40) hace que todo el bloque suba para eliminar el espacio muerto de arriba
  const bajar = isMobile ? -40 : 0; 

  // 5️⃣ Motor 3D del Carrusel (Órbita)
  const getCardStyle = (index) => {
    const total = slides.length;
    const diff = (index - activeIdx + total) % total;

    const scaleFactor = isMobile ? 0.85 : 1; 
    const xOffset = isMobile ? 120 : 320;
    const yOffset = isMobile ? 40 : 80;

    if (diff === 0) {
      return { 
        x: 0, 
        y: bajar, 
        scale: 1 * scaleFactor, 
        rotate: 0, 
        zIndex: 30, 
        opacity: 1, 
        filter: "brightness(1) drop-shadow(0 15px 35px rgba(255,255,255,0.4))" 
      };
    }
    if (diff === 1) {
      return { x: xOffset, y: yOffset + bajar, scale: 0.6 * scaleFactor, rotate: -20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    }
    if (diff === total - 1) {
      return { x: -xOffset, y: yOffset + bajar, scale: 0.6 * scaleFactor, rotate: 20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    }
    if (diff === 2) {
      return { x: xOffset - 40, y: yOffset + 100 + bajar, scale: 0.4 * scaleFactor, rotate: -35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    }
    if (diff === total - 2) {
      return { x: -xOffset + 40, y: yOffset + 100 + bajar, scale: 0.4 * scaleFactor, rotate: 35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    }
    return { x: 0, y: 200 + bajar, scale: 0.2, rotate: 0, zIndex: 0, opacity: 0 };
  };

  const activeSlide = slides[activeIdx];
  const displayName = activeSlide.title.replace("Comprar ", "").replace("Ver ", "").toUpperCase();

  return (
    <section 
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black select-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 🖼️ FONDOS */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,#1a1a24_0%,#050505_70%)]">
        <img 
          src={isMobile ? "/FondoM.png" : "/FondoD.png"} 
          alt="Fondo FutStore" 
          className="w-full h-full object-cover opacity-40" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      {/* 🎠 CARRUSEL 3D Y EFECTO DE TEXTO GIGANTE */}
      <div className="relative w-full max-w-7xl h-[60vh] lg:h-[70vh] flex items-center justify-center z-10 lg:mt-0">
        
        

        {/* IMÁGENES DEL CARRUSEL Y LUCES */}
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
            
            {/* ✨ RESPLANDOR TRASERO DINÁMICO (Z-25) ✨ */}
            <motion.div 
              animate={{ 
                scale: i === activeIdx ? [1, 1.15, 1] : 1,
                opacity: i === activeIdx ? [0.6, 0.9, 0.6] : 0
              }}
              transition={{ 
                duration: 2.5, 
                repeat: i === activeIdx ? Infinity : 0, 
                ease: "easeInOut" 
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] lg:w-[450px] lg:h-[450px] rounded-full z-[25] pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(${slide.glowColor}, 0.8) 0%, rgba(${slide.glowColor}, 0.3) 40%, rgba(0,0,0,0) 70%)`,
                filter: "blur(40px)"
              }}
            />

            {/* IMAGEN DEL PRODUCTO (Aumentada a 280px en móvil para llenar más el espacio visual) */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-[280px] h-[280px] lg:w-[350px] lg:h-[350px] object-contain relative z-30"
              draggable="false"
            />
          </motion.div>
        ))}
      </div>

      {/* 🔘 BOTÓN CTA Y TEXTO INFERIOR */}
      {/* 🛠️ FIX: Se movió de bottom-12 a bottom-24 para cerrar el espacio hacia arriba y evitar choques con WhatsApp */}
      <div className="absolute bottom-24 lg:bottom-16 z-[70] flex flex-col items-center justify-center w-full px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeSlide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <button
              onClick={() => handleNavigation(activeSlide.eventName)}
              /* 🛠️ Botón más grande: px-12 py-4 y texto más grande */
              className={`flex items-center gap-3 px-12 py-4 lg:px-14 lg:py-5 rounded-full font-black text-base lg:text-lg uppercase tracking-widest shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeSlide.isOffer
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                  : "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-gray-200"
              }`}
            >
              <span>{activeSlide.title}</span>
              <FaArrowRight className="text-sm lg:text-base" />
            </button>
            
            <p className="text-gray-400 text-xs lg:text-sm mt-5 tracking-widest font-medium uppercase drop-shadow-md text-center">
              La élite del fútbol, en tu piel.
            </p>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 💬 BOTÓN FLOTANTE DE WHATSAPP (Ajustado para que no estorbe el texto inferior) */}
      <a 
        href="https://wa.me/50672327096" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 lg:bottom-10 lg:left-10 z-50 bg-green-500 text-white p-4 lg:p-5 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.8)] transition-all duration-300 flex items-center justify-center cursor-pointer"
      >
        <FaWhatsapp className="text-3xl" />
      </a>
      
    </section>
  );
}