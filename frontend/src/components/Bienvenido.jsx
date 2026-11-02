"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaChevronDown } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";

// 📦 DATOS DE PRODUCTOS
const slides = [
  { id: 0, code: "01", image: "/TacosHero.png", title: "Comprar Tacos", subtitle: "TRACCIÓN & VELOCIDAD PRO", tag: "CALZADO ÉLITE", eventName: "filtrarTacos" },
  { id: 1, code: "02", image: "/PlayerB.png", title: "Ver Player", subtitle: "TECNOLOGÍA DE CAMPO", tag: "VERSIÓN JUGADOR", eventName: "filtrarPlayer" },
  { id: 2, code: "03", image: "/RetroB.png", title: "Ver Retros", subtitle: "LEYENDAS INMORTALES", tag: "ARCHIVO HISTÓRICO", eventName: "filtrarRetros" },
  { id: 3, code: "04", image: "/Descuento.png", title: "Ver Ofertas", subtitle: "OPORTUNIDADES ÚNICAS", tag: "DESCUENTOS", eventName: "filtrarOfertas", isOffer: true },
  { id: 4, code: "05", image: "/FanB.png", title: "Ver Fan", subtitle: "CULTURA DE ESTADIO", tag: "VERSIÓN AFICIONADO", eventName: "filtrarFan" },
  { id: 5, code: "06", image: "/NacionalB.png", title: "Ver Nacional", subtitle: "PASIÓN DE NUESTRA TIERRA", tag: "FÚTBOL NACIONAL", eventName: "filtrarNacional" }
];

export default function Bienvenido() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para Swipe vertical en móvil
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // ⚙️ MOTOR DE MOVIMIENTO CONTINUO SIN PAUSA POR HOVER
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const total = slides.length;
  const activeSlide = slides[activeIdx];

  const handleNavigation = (eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // 📐 MATEMÁTICA CIRCULAR PARA QUE LA BANDA BAJE DE ARRIBA HACIA ABAJO
  const getCircularOffset = (index) => {
    let diff = (activeIdx - index) % total;
    if (diff < 0) diff += total;
    if (diff > total / 2) diff -= total;
    return diff;
  };

  // 📱 Gestos táctiles verticales en la banda derecha
  const handleTouchStart = (e) => setTouchStartY(e.targetTouches[0].clientY);
  const handleTouchMove = (e) => setTouchEndY(e.targetTouches[0].clientY);
  const handleTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;
    const distance = touchEndY - touchStartY;
    if (distance > 40) setActiveIdx((prev) => (prev + 1) % total);
    if (distance < -40) setActiveIdx((prev) => (prev - 1 + total) % total);
    setTouchStartY(0);
    setTouchEndY(0);
  };

  // Distancia ampliada para acomodar las fotos más grandes
  const stepDistance = isMobile ? 165 : 245;

  return (
    <section className="relative w-full h-screen min-h-[620px] grid grid-cols-12 overflow-hidden select-none bg-black pt-20 md:pt-24">
      
      {/* ========================================================
          👈 PANEL IZQUIERDO: PANTALLA COMPLETA DEL ESTADIO
          ======================================================== */}
      <div className="relative col-span-7 md:col-span-8 lg:col-span-9 h-full overflow-hidden flex flex-col justify-between p-5 sm:p-10 lg:p-16 border-r border-gray-800">
        
        {/* 🏟️ IMAGEN DEL ESTADIO A PANTALLA COMPLETA */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            key={`bg-${isMobile}`}
            src={isMobile ? "/FondoM.png" : "/FondoD.png"}
            alt="Estadio FutStore"
            animate={{ scale: [1.02, 1.07, 1.02] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.32) 50%, rgba(0,0,0,0.9) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </div>

        {/* 🔝 BARRA SUPERIOR: ETIQUETA Y CONTADOR EN PLATEADO */}
        <div className="relative z-20 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-gray-600"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: "#E2E8F0" }}
            />
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-gray-200">
              FUTSTORE CR • 2026
            </span>
          </div>

          <div
            className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-gray-400 px-4 py-1.5 rounded-full border border-gray-600"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          >
            <span style={{ color: "#F8FAFC" }}>{activeSlide.code}</span>
            <span className="text-gray-600">/</span>
            <span>0{total}</span>
          </div>
        </div>

        {/* 🏆 CENTRO DEL ESTADIO: BIENVENIDA PRINCIPAL EN PLATEADO METÁLICO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 my-auto flex flex-col items-start sm:items-center sm:text-center max-w-3xl sm:mx-auto pointer-events-none"
        >
          <span
            className="px-3.5 py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest mb-3 border"
            style={{
              backgroundColor: "rgba(226, 232, 240, 0.12)",
              borderColor: "rgba(203, 213, 225, 0.45)",
              color: "#E2E8F0",
            }}
          >
            TIENDA OFICIAL EN COSTA RICA
          </span>

          <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-wider leading-none drop-shadow-2xl">
            BIENVENIDO A{" "}
            <span
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 55%, #94A3B8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 25px rgba(226,232,240,0.35))",
              }}
            >
              FUTSTORE
            </span>
          </h2>

          <p className="mt-3 text-xs sm:text-base lg:text-lg text-gray-300 font-semibold max-w-xl tracking-wide">
            Camisetas Player, Fan, Retros Históricas y Calzado Pro con envíos a todo el país.
          </p>
        </motion.div>

        {/* ✅ ESQUINA INFERIOR IZQUIERDA: "LA ÉLITE DEL FÚTBOL EN TU PIEL" EN PLATEADO */}
        <div className="relative z-20 mt-auto max-w-2xl pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`meta-${activeSlide.id}`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 mb-1.5"
            >
              <span
                className="h-0.5 w-6 inline-block"
                style={{ backgroundColor: "#CBD5E1" }}
              />
              <span
                className="text-[9px] sm:text-xs font-extrabold uppercase tracking-widest"
                style={{ color: "#CBD5E1" }}
              >
                {activeSlide.subtitle}
              </span>
            </motion.div>
          </AnimatePresence>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white uppercase leading-none tracking-tight drop-shadow-2xl">
            LA ÉLITE DEL
            <br />
            <span>FÚTBOL </span>
            <span
              className="italic font-black"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 60%, #94A3B8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.9))",
              }}
            >
              "EN TU PIEL"
            </span>
          </h1>
        </div>

        {/* ⏳ BARRA DE PROGRESO PLATEADA INFERIOR (SIEMPRE EN MOVIMIENTO) */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 z-30">
          <motion.div
            key={`bar-${activeIdx}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.6, ease: "linear" }}
            className="h-full"
            style={{
              background: "linear-gradient(90deg, #94A3B8 0%, #FFFFFF 50%, #CBD5E1 100%)",
              boxShadow: "0 0 12px rgba(226, 232, 240, 0.8)",
            }}
          />
        </div>
      </div>

      {/* ========================================================
          👉 PANEL DERECHO: BANDA VERTICAL CON FOTOS MÁS GRANDES
          ======================================================== */}
      <div
        className="relative col-span-5 md:col-span-4 lg:col-span-3 h-full flex flex-col justify-between overflow-hidden"
        style={{ backgroundColor: "#0c0c0c" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 🎢 RIEL VERTICAL CON DESPLAZAMIENTO CONTINUO HACIA ABAJO */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
          
          {/* Sombras superior e inferior para efecto de túnel oscuro */}
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-20 z-30"
            style={{
              background: "linear-gradient(180deg, #0c0c0c 0%, rgba(12,12,12,0) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-20 z-30"
            style={{
              background: "linear-gradient(0deg, #0c0c0c 0%, rgba(12,12,12,0) 100%)",
            }}
          />

          {/* Halo plateado / rojo detrás de la prenda central */}
          <div
            className="pointer-events-none absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full blur-3xl z-0"
            style={{
              backgroundColor: activeSlide.isOffer
                ? "rgba(220, 38, 38, 0.2)"
                : "rgba(226, 232, 240, 0.14)",
            }}
          />

          {/* Marco central de enfoque más amplio */}
          <div
            className="pointer-events-none absolute w-11/12 h-52 sm:h-64 lg:h-72 rounded-2xl border z-10"
            style={{
              borderColor: "rgba(226,232,240,0.1)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          />

          {/* Prendas moviéndose hacia abajo (TAMAÑO AUMENTADO) */}
          {slides.map((slide, index) => {
            const offset = getCircularOffset(index);
            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 1;
            const isWrapping = offset <= -1;

            return (
              <motion.div
                key={slide.id}
                onClick={() => {
                  if (isCenter) {
                    handleNavigation(slide.eventName);
                  } else {
                    setActiveIdx(index);
                  }
                }}
                animate={{
                  y: offset * stepDistance,
                  scale: isCenter ? 1.15 : 0.68,
                  opacity: isCenter ? 1 : isVisible ? 0.35 : 0,
                  filter: isCenter ? "brightness(1.08)" : "brightness(0.55)",
                  zIndex: isCenter ? 25 : isVisible ? 15 : 0,
                }}
                transition={
                  isWrapping && !isCenter
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 95,
                        damping: 18,
                        mass: 0.9,
                      }
                }
                style={{ pointerEvents: isVisible ? "auto" : "none" }}
                className="absolute w-full px-2 sm:px-4 flex flex-col items-center justify-center cursor-pointer group"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{
                    maxHeight: isMobile ? "155px" : "245px",
                    filter: "drop-shadow(0 25px 30px rgba(0,0,0,0.92))",
                  }}
                  className="w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />

                <AnimatePresence>
                  {isCenter && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mt-2 px-3.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg border"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.88)",
                        borderColor: "rgba(203,213,225,0.45)",
                        color: "#E2E8F0",
                      }}
                    >
                      {slide.tag}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* 🚀 BOTÓN DE ACCIÓN INFERIOR (PLATEADO METÁLICO / ROJO EN OFERTAS) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleNavigation(activeSlide.eventName)}
          style={{
            background: activeSlide.isOffer
              ? "#dc2626"
              : "linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 50%, #94A3B8 100%)",
            color: activeSlide.isOffer ? "#ffffff" : "#000000",
          }}
          className="relative z-40 w-full h-16 sm:h-20 lg:h-24 px-4 sm:px-6 flex items-center justify-between font-black uppercase tracking-wider transition-all duration-300 cursor-pointer group border-t border-black hover:opacity-95"
        >
          <div className="flex flex-col items-start text-left min-w-0 pr-2">
            <span className="text-[8px] sm:text-[10px] font-extrabold tracking-widest uppercase opacity-75">
              EXPLORAR AHORA
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`cta-title-${activeSlide.id}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-xs sm:text-lg lg:text-xl font-black tracking-tight truncate w-full"
              >
                {activeSlide.title}
              </motion.span>
            </AnimatePresence>
          </div>

          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{
              backgroundColor: "#000000",
              color: "#F8FAFC",
            }}
          >
            <FiArrowUpRight className="text-lg sm:text-2xl" />
          </div>
        </motion.button>
      </div>

      {/* 💬 BOTÓN FLOTANTE DE WHATSAPP */}
      <div className="fixed bottom-5 left-5 md:bottom-8 md:left-8 z-50 flex flex-col items-start pointer-events-none">
        <a
          href="https://wa.me/50672327096"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center pointer-events-auto group"
        >
          <div className="absolute inset-0 bg-green-600 rounded-full animate-ping opacity-60" />
          <div className="relative bg-green-600 text-white p-3.5 md:p-4 rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
            <FaWhatsapp className="text-2xl md:text-3xl" />
          </div>
        </a>
      </div>

      {/* ⬇️ INDICADOR DE SCROLL EN PLATEADO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-2 left-1/3 -translate-x-1/2 flex flex-col items-center justify-center z-40 opacity-70 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <FaChevronDown style={{ color: "#E2E8F0" }} className="text-sm" />
        </motion.div>
      </motion.div>
    </section>
  );
}