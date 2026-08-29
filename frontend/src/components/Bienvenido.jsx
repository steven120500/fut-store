import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const slides = [
  { id: 0, image: "/TacosHero.png", title: "Comprar Tacos", eventName: "filtrarTacos" },
  { id: 1, image: "/PlayerB.png", title: "Ver Player", eventName: "filtrarPlayer" },
  { id: 2, image: "/RetroB.png", title: "Ver Retros", eventName: "filtrarRetros" },
  { id: 3, image: "/Descuento.png", title: "Ver Ofertas", eventName: "filtrarOfertas", isOffer: true },
  { id: 4, image: "/FanB.png", title: "Ver Fan", eventName: "filtrarFan" },
  { id: 5, image: "/NacionalB.png", title: "Ver Nacional", eventName: "filtrarNacional" }
];

export default function Bienvenido() {
  const [activeIdx, setActiveIdx] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // ⏱️ Rotación cada 2000ms (2 segundos)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = slides[activeIdx];

  const handleNavigation = (eventName = activeSlide.eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  // Posicionamiento 3D centrado
  const getCardStyle = (index) => {
    const total = slides.length;
    const diff = (index - activeIdx + total) % total;

    // 0 = Activa (Centro)
    if (diff === 0) {
      return {
        zIndex: 30,
        transform: "translate(-50%, -50%) scale(1) rotateY(0deg)",
        opacity: 1,
        filter: "brightness(1)",
        pointerEvents: "auto"
      };
    }
    // 1 = Derecha
    if (diff === 1) {
      return {
        zIndex: 20,
        transform: isMobile 
          ? "translate(calc(-50% + 90px), -50%) scale(0.75) rotate(6deg)" 
          : "translate(calc(-50% + 220px), -50%) scale(0.8) rotateY(-18deg) rotateZ(2deg)",
        opacity: 0.45,
        filter: "brightness(0.65)",
        pointerEvents: "auto"
      };
    }
    // Último = Izquierda
    if (diff === total - 1) {
      return {
        zIndex: 20,
        transform: isMobile 
          ? "translate(calc(-50% - 90px), -50%) scale(0.75) rotate(-6deg)" 
          : "translate(calc(-50% - 220px), -50%) scale(0.8) rotateY(18deg) rotateZ(-2deg)",
        opacity: 0.45,
        filter: "brightness(0.65)",
        pointerEvents: "auto"
      };
    }
    return {
      zIndex: 10,
      transform: "translate(-50%, -50%) scale(0.5)",
      opacity: 0,
      pointerEvents: "none"
    };
  };

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden select-none pt-28 md:pt-36 pb-16 md:pb-24"
    >
      {/* 🔮 Animación de flotación */}
      <style>{`
        @keyframes floatItem {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .anim-float {
          animation: floatItem 4s ease-in-out infinite;
        }
      `}</style>

      {/* 🖼️ FONDO RESPONSIVE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="Fondo FutStore"
          initial={{ scale: 1.05 }} 
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-full h-full object-cover brightness-[0.4]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/80" />
      </div>

      {/* 1️⃣ 🎴 CARRUSEL 3D (Espacio vertical ampliado a 400px para no desbordar) */}
      <div className="relative z-20 w-full max-w-5xl h-60 md:h-60 mx-auto mt-16 [perspective:1400px]">
        {slides.map((slide, i) => {
          const style = getCardStyle(i);
          const isCurrent = i === activeIdx;

          return (
            <div
              key={slide.id}
              onClick={() => setActiveIdx(i)}
              style={style}
              className="absolute top-1/2 left-1/2 cursor-pointer transition-all duration-700 ease- flex items-center justify-center"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-auto object-contain transition-all duration-700 ${
                  isCurrent
                    ? "anim-float max-h-[220px] md:max-h-[320px] drop-shadow-[0_25px_40px_rgba(0,0,0,0.95)]"
                    : "max-h-[150px] md:max-h-[220px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* 2️⃣ ⚡ BOTÓN PRINCIPAL (Bajado con margen amplio) */}
      <div className="relative z-20 flex flex-col items-center w-full mt-6 md:mt-32">
        <AnimatePresence mode="wait">
          <motion.button
            key={activeSlide.id}
            onClick={() => handleNavigation()}
            initial={{ y: 8, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group flex items-center gap-2.5 px-8 py-3 md:px-11 md:py-3.5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl transition-all border cursor-pointer ${
              activeSlide.isOffer
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                : "bg-white text-black border-white/80 shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-gray-100"
            }`}
          >
            <span>{activeSlide.title}</span>
            <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-300" />
          </motion.button>
        </AnimatePresence>
      </div>

      {/* 3️⃣ 🏆 TÍTULO CENTRADO Y SEPARADO */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-3xl mx-auto mt-16 md:mt-30 mb-30">
        <h1 className="text-4xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
          BIENVENIDO
        </h1>
        <h2 className="text-2xl md:text-8xl font-light text-gray-200 mt-1">
          a <span className="font-serif italic text-white font-bold">FutStore</span>
        </h2>
        <p className="text-gray-300 text-xs md:text-3xl font-medium mt-1">
          La élite del fútbol, en tu piel.
        </p>
      </div>

    </section>
  );
}