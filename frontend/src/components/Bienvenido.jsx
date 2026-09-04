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
  
  // 🔍 ESTADO DEL ZOOM (móvil, laptop 70%, o Mac 100%)
  const [screenZoom, setScreenZoom] = useState("desktop");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const touchStartX = useRef(0);

  // 1️⃣ DETECCIÓN DE PANTALLA (Para forzar el 70% en Laptops)
  useEffect(() => {
    let timeoutId;
    const checkSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        if (width < 1024) {
          setScreenZoom("mobile");
        } else if (width >= 1024 && width <= 1440) {
          // 💻 Rango de laptops típicas de Windows (1366x768, 1280x720, etc con escala 125%)
          setScreenZoom("laptop70"); 
        } else {
          // 🖥️ Macs y Monitores de escritorio grandes
          setScreenZoom("desktop100"); 
        }
      }, 150);
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

  const handleDragStart = (clientX) => {
    setIsPaused(true);
    touchStartX.current = clientX;
  };
  
  const handleDragEnd = (clientX) => {
    setIsPaused(false);
    const distance = touchStartX.current - clientX;
    if (distance > 40) nextSlide();
    else if (distance < -40) prevSlide();
  };

  // 2️⃣ EL MOTOR 3D CON EL ZOOM DEL 70% INCORPORADO
  const getCardStyle = (index) => {
    const total = slides.length;
    const diff = (index - activeIdx + total) % total;

    // 🔎 LA MAGIA DEL ZOOM EXACTO A 70% (0.7)
    const isMobile = screenZoom === "mobile";
    const isLaptop = screenZoom === "laptop70";

    const scaleFactor = isMobile ? 0.85 : (isLaptop ? 0.70 : 1); // <-- Aquí forzamos el 70% 
    
    // Las distancias también se reducen al 70% para que no se vea vacío
    const xOffset = isMobile ? 120 : (isLaptop ? 220 : 320);
    const yOffset = isMobile ? 30 : (isLaptop ? 50 : 80);

    if (diff === 0) return { x: 0, y: 0, scale: 1 * scaleFactor, rotate: 0, zIndex: 30, opacity: 1, filter: "brightness(1) drop-shadow(0 15px 35px rgba(255,255,255,0.4))" };
    if (diff === 1) return { x: xOffset, y: yOffset, scale: 0.6 * scaleFactor, rotate: -20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    if (diff === total - 1) return { x: -xOffset, y: yOffset, scale: 0.6 * scaleFactor, rotate: 20, zIndex: 20, opacity: 0.5, filter: "brightness(0.4)" };
    if (diff === 2) return { x: xOffset - 30, y: yOffset + 80, scale: 0.4 * scaleFactor, rotate: -35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    if (diff === total - 2) return { x: -xOffset + 30, y: yOffset + 80, scale: 0.4 * scaleFactor, rotate: 35, zIndex: 10, opacity: 0, filter: "brightness(0.1)" };
    return { x: 0, y: 150, scale: 0.2, rotate: 0, zIndex: 0, opacity: 0 };
  };

  const activeSlide = slides[activeIdx];
  const displayName = activeSlide.title.replace("Comprar ", "").replace("Ver ", "").toUpperCase();

  return (
    <section 
      style={{ height: "calc(100vh - 120px)", minHeight: "480px" }}
      className="relative w-full flex flex-col items-center justify-between overflow-hidden bg-black select-none font-sans cursor-grab active:cursor-grabbing"
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseUp={(e) => handleDragEnd(e.clientX)}
      onMouseLeave={() => setIsPaused(false)}
      onMouseEnter={() => setIsPaused(true)}
    >
      {/* 🖼️ FONDOS */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,#1a1a24_0%,#050505_70%)]">
        <img src={screenZoom === "mobile" ? "/FondoM.png" : "/FondoD.png"} alt="Fondo FutStore" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      {/* 🎠 ÁREA CENTRAL */}
      <div className="relative w-full max-w-7xl flex-1 flex items-center justify-center z-10 mt-2 lg:mt-6">
        
        

        {/* CARRUSEL DE PRODUCTOS */}
        {slides.map((slide, i) => (
          <motion.div
            key={slide.id}
            initial={false}
            animate={getCardStyle(i)}
            transition={{ type: "spring", stiffness: 80, damping: 14, mass: 1 }}
            className={`absolute flex items-center justify-center will-change-transform pointer-events-none`}
          >
            {/* ✨ Resplandor simulando el 70% de zoom */}
            <motion.div 
              animate={{ scale: i === activeIdx ? [1, 1.15, 1] : 1, opacity: i === activeIdx ? [0.6, 0.9, 0.6] : 0 }}
              transition={{ duration: 2.5, repeat: i === activeIdx ? Infinity : 0, ease: "easeInOut" }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-[25] 
                ${screenZoom === "mobile" ? "w-[200px] h-[200px]" : (screenZoom === "laptop70" ? "w-[250px] h-[250px]" : "w-[350px] h-[350px]")}`}
              style={{ background: `radial-gradient(circle, rgba(${slide.glowColor}, 0.8) 0%, rgba(${slide.glowColor}, 0.3) 40%, rgba(0,0,0,0) 70%)`, filter: "blur(40px)" }}
            />
            {/* 👕 Camiseta restringida exactamente al equivalente del 70% visual */}
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-auto object-contain relative z-30 drop-shadow-xl 
                ${screenZoom === "mobile" ? "h-[25vh] max-h-[200px]" : (screenZoom === "laptop70" ? "h-[30vh] max-h-[250px]" : "h-[35vh] max-h-[350px]")}`}
              draggable="false"
            />
          </motion.div>
        ))}
      </div>

      {/* 🔘 ÁREA INFERIOR */}
      <div className="relative z-[70] w-full flex flex-col items-center justify-end pb-4 lg:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${activeSlide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-2 lg:gap-4"
          >
            <button
              onClick={() => handleNavigation(activeSlide.eventName)}
              className={`flex items-center gap-2 lg:gap-3 px-8 py-3 lg:px-12 lg:py-4 rounded-full font-black text-xs lg:text-sm uppercase tracking-widest shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap ${
                activeSlide.isOffer
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                  : "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-gray-200"
              }`}
            >
              <span>{activeSlide.title}</span>
              <FaArrowRight className="text-xs" />
            </button>
            
            <p className="text-gray-400 text-[10px] lg:text-xs tracking-widest font-medium uppercase drop-shadow-md text-center">
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
        className="fixed bottom-4 left-4 lg:bottom-8 lg:left-8 z-[100] bg-green-500 text-white p-3 lg:p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.8)] transition-all duration-300 flex items-center justify-center cursor-pointer"
      >
        <FaWhatsapp className="text-2xl lg:text-3xl" />
      </a>
      
    </section>
  );
}