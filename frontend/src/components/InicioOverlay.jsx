import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import logo from "../assets/logo.png";

const CAMISAS = ["/Japon.png", "/Mexico.png", "/Espana.png", "/Portugal.png", "/Italia.png", "/Usa.png"];
const DURACION_MS = 3800;

export default function InicioOverlay({ onComplete }) {
  const reduceMotion = useReducedMotion();

  // Radio de la órbita según el tamaño real de la pantalla
  const [radius] = useState(() => {
    if (typeof window === "undefined") return 170;
    const base = Math.min(window.innerWidth, window.innerHeight);
    return Math.max(120, Math.min(260, base * 0.34));
  });

  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), reduceMotion ? 1200 : DURACION_MS);
    return () => clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  // Saltar con Escape / Enter
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter") onComplete?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete]);

  const posiciones = useMemo(
    () =>
      CAMISAS.map((src, i) => {
        const angle = (i / CAMISAS.length) * Math.PI * 2 - Math.PI / 2;
        return { src, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }),
    [radius]
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)", transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }}
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black select-none"
      role="dialog"
      aria-label="Bienvenido a FutStore"
    >
      {/* 🏟️ Estadio de fondo con zoom lento */}
      <motion.picture
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.55 }}
        transition={{ duration: 4.2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <source media="(min-width: 768px)" srcSet="/FondoD.jpg" />
        <img src="/FondoM.jpg" alt="" className="h-full w-full object-cover" />
      </motion.picture>

      {/* Capas de contraste: viñeta + degradado */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.85)_70%,#000_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

      {/* Haces de luz del estadio */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.3] }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[120vh] w-[60vw] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_42%,rgba(255,255,255,0.18)_50%,transparent_58%)] blur-2xl"
      />

      {/* Aura central */}
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute h-[28rem] w-[28rem] rounded-full bg-white/10 blur-[100px]"
      />

      {/* 🌀 Órbita de camisetas: el anillo gira, cada camiseta se mantiene derecha */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ rotate: -20 }}
          animate={{ rotate: reduceMotion ? -20 : 40 }}
          transition={{ duration: DURACION_MS / 1000, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative h-0 w-0"
        >
          {/* Anillo guía */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="absolute rounded-full border border-cyan-300/20 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            style={{ width: radius * 2, height: radius * 2, left: -radius, top: -radius }}
          />

          {posiciones.map(({ src, x, y }, i) => (
            <motion.div
              key={src}
              className="absolute left-0 top-0"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x, y, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.25 + i * 0.08 }}
            >
              <motion.img
                src={src}
                alt=""
                initial={{ rotate: 20 }}
                animate={{ rotate: reduceMotion ? 20 : -40 }}
                transition={{ duration: DURACION_MS / 1000, ease: [0.25, 0.1, 0.25, 1] }}
                className="h-24 w-24 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)] sm:h-28 sm:w-28 md:h-32 md:w-32"
                draggable={false}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ✍️ Centro: logo + bienvenida */}
      <div className="relative z-20 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 13, delay: 0.1 }}
          className="relative mb-4"
        >
          <span className="absolute inset-0 animate-ping rounded-full border border-white/30 [animation-duration:2s]" />
          <img
            src={logo}
            alt="FutStore"
            className="relative h-20 w-20 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.25)] ring-1 ring-white/30 sm:h-24 sm:w-24"
            draggable={false}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.45em" }}
          transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          className="mb-1 text-[10px] font-semibold uppercase text-cyan-300/80 sm:text-xs"
        >
          Bienvenido a
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display text-6xl uppercase leading-none tracking-wide text-silver-animated drop-shadow-[0_6px_30px_rgba(255,255,255,0.15)] sm:text-8xl"
        >
          FutStore
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-3 text-sm font-medium text-white/70 sm:text-base"
        >
          La élite del fútbol, en tu piel.
        </motion.p>
      </div>

      {/* 🌟 Barra de progreso + saltar */}
      <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-4 sm:bottom-14">
        <div className="h-[2px] w-44 overflow-hidden rounded-full bg-white/10 sm:w-56">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: (reduceMotion ? 1200 : DURACION_MS) / 1000, ease: "linear" }}
            className="h-full w-full origin-left bg-gradient-to-r from-cyan-500/40 via-cyan-300 to-white"
          />
        </div>
        <button
          type="button"
          onClick={() => onComplete?.()}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
        >
          Saltar
        </button>
      </div>
    </motion.div>
  );
}
