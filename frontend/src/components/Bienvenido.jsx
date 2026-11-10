import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaArrowRight, FaWhatsapp, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { WHATSAPP_URL } from "./Contacto";

// 📦 Slides del hero
const slides = [
  { id: 0, image: "/TacosHero.png", label: "Tacos", title: "Comprar tacos", eventName: "filtrarTacos" },
  { id: 1, image: "/PlayerB.png", label: "Player", title: "Ver Player", eventName: "filtrarPlayer" },
  { id: 2, image: "/RetroB.png", label: "Retro", title: "Ver Retros", eventName: "filtrarRetros" },
  { id: 3, image: "/Descuento.png", label: "Ofertas", title: "Ver ofertas", eventName: "filtrarOfertas", isOffer: true },
  { id: 4, image: "/FanB.png", label: "Fan", title: "Ver Fan", eventName: "filtrarFan" },
  { id: 5, image: "/NacionalB.png", label: "Nacional", title: "Ver Nacional", eventName: "filtrarNacional" },
];

const N = slides.length;
const STEP = 360 / N;
const SLIDE_MS = 2600;
const mod = (n, m) => ((n % m) + m) % m;

// Partículas deterministas (sin Math.random en render)
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 2 + (i % 3),
  delay: (i * 0.53) % 6,
  duration: 7 + (i % 5) * 1.6,
}));

// ✍️ Texto con letras que giran en 3D al entrar
function FlipText({ text, charClass = "", delay = 0 }) {
  return (
    <span className="inline-block [perspective:600px]" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={`inline-block origin-bottom ${charClass}`}
          initial={{ rotateX: -95, y: 30, opacity: 0 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 14, delay: delay + i * 0.035 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

// 👕 Camiseta del anillo.
// La posición "3D" se calcula con matemática 2D (x, escala, profundidad) en vez de translateZ + perspectiva:
// se ve igual, pero la camiseta del frente queda a escala 1 (tamaño nativo) y nunca se agranda un bitmap,
// que era lo que la hacía verse borrosa en Safari/iPhone. Sin blur y sin filtros en la del frente.
function RingItem({ slide, index, ring, radius, size, isActive, onClick }) {
  const angle = index * STEP;
  const theta = useTransform(ring, (r) => ((angle + r) * Math.PI) / 180);
  const depth = useTransform(theta, (t) => (Math.cos(t) + 1) / 2); // 1 = al frente, 0 = atrás
  const x = useTransform(theta, (t) => Math.sin(t) * radius);
  const y = useTransform(depth, (d) => -(1 - d) * size * 0.14); // las de atrás un poco más arriba (horizonte)
  const scale = useTransform(depth, (d) => 0.42 + 0.58 * d);
  const opacity = useTransform(depth, (d) => 0.1 + 0.9 * Math.pow(d, 2));
  const zIndex = useTransform(depth, (d) => Math.round(d * 100));
  const filter = useTransform(depth, (d) => (d > 0.97 ? "none" : `brightness(${(0.3 + 0.7 * d * d).toFixed(2)})`));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isActive ? slide.title : `Ver ${slide.label}`}
      style={{ x, y, scale, opacity, zIndex, width: size, height: size, left: -size / 2, top: -size / 2 }}
      className="absolute rounded-none border-0 bg-transparent p-0 will-change-transform"
    >
      <motion.img
        src={slide.image}
        alt={slide.label}
        style={{ filter }}
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_24px_24px_rgba(0,0,0,0.8)]"
        animate={isActive ? { y: [0, -10, 0] } : { y: 0 }}
        transition={isActive ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
      />
    </motion.button>
  );
}

export default function Bienvenido() {
  const [pos, setPos] = useState(0); // contador continuo (gira siempre hacia adelante sin "rebobinar")
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const touch = useRef({ start: 0, end: 0 });

  const activeIdx = mod(pos, N);
  const activeSlide = slides[activeIdx];

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Rotación automática
  useEffect(() => {
    const t = setTimeout(() => setPos((p) => p + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [pos]);

  // Anillo 3D con resorte
  const ring = useSpring(0, { stiffness: 55, damping: 16, mass: 1 });
  useEffect(() => { ring.set(-pos * STEP); }, [pos, ring]);

  // Parallax con el mouse
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const stageX = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 80, damping: 18 });
  const stageY = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), { stiffness: 80, damping: 18 });
  const floorTilt = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 80, damping: 18 });
  const bgX = useSpring(useTransform(mx, [-0.5, 0.5], [18, -18]), { stiffness: 60, damping: 20 });
  const bgY = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 60, damping: 20 });

  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const goTo = (i) => {
    const delta = mod(i - activeIdx + N / 2, N) - N / 2; // camino más corto
    setPos((p) => p + delta);
  };
  const handleNavigation = (eventName) => window.dispatchEvent(new CustomEvent(eventName));

  const scrollToCatalog = () => {
    const el = document.getElementById("categorias");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };

  // 📱 Swipe
  const onTouchStart = (e) => { touch.current = { start: e.targetTouches[0].clientX, end: 0 }; };
  const onTouchMove = (e) => { touch.current.end = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    const { start, end } = touch.current;
    if (start && end) {
      const d = start - end;
      if (d > 50) setPos((p) => p + 1);
      if (d < -50) setPos((p) => p - 1);
    }
  };

  const stage = useMemo(
    () => (isMobile ? { radius: 150, size: 170, height: 330, floor: 105 } : { radius: 270, size: 250, height: 560, floor: 150 }),
    [isMobile]
  );

  const titleSize = { fontSize: "clamp(2.4rem, min(5.4vw, 8.2vh), 5.25rem)" };

  return (
    <section
      className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden bg-black select-none"
      style={{ paddingTop: "var(--nav-h)" }}
      onPointerMove={onPointerMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      {/* 🏟️ Estadio con parallax */}
      <motion.picture style={{ x: bgX, y: bgY }} className="pointer-events-none absolute -inset-8 -z-20">
        <source media="(min-width: 768px)" srcSet="/FondoD.jpg" />
        <img src="/FondoM.jpg" alt="" className="h-full w-full object-cover opacity-40" />
      </motion.picture>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_55%,transparent_0%,rgba(0,0,0,0.6)_45%,#000_85%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black to-transparent" />

      {/* Texto gigante en contorno, desplazándose */}
      <div className="pointer-events-none absolute bottom-[6%] left-0 -z-10 flex w-max animate-marquee whitespace-nowrap" style={{ animationDuration: "60s" }}>
        {[0, 1].map((k) => (
          <span key={k} className="text-outline pr-16 font-display text-[22vw] uppercase leading-none md:text-[16vw]">
            FutStore · La élite del fútbol · FutStore · La élite del fútbol ·
          </span>
        ))}
      </div>

      {/* Partículas de luz */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full bg-white"
            style={{ left: `${p.left}%`, width: p.size, height: p.size, boxShadow: i % 3 === 0 ? "0 0 10px rgba(34,211,238,0.9)" : "0 0 8px rgba(255,255,255,0.8)", background: i % 3 === 0 ? "#67e8f9" : undefined }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: "-105vh", opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-2 px-5 pb-20 pt-6 sm:px-8 md:grid-cols-[1fr_1.1fr] md:gap-6 md:pb-16 lg:px-12">
        {/* ✍️ Texto */}
        <div className="relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/90 sm:text-[11px]"
          >
           
          </motion.div>

          <h1 className="font-display uppercase leading-[1.08] tracking-wide text-white" style={titleSize}>
            <FlipText text="La élite" charClass="text-3d" />
            <br />
            <FlipText text="del fútbol," charClass="text-3d" delay={0.25} />
          </h1>
          <h2 className="mt-1 font-display uppercase leading-[1.08] tracking-wide" style={titleSize}>
            <FlipText text="en tu piel." charClass="text-silver text-3d-silver" delay={0.6} />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-5 hidden max-w-md text-sm text-white/60 sm:text-base md:block"
          >
            Camisetas Player, Fan, Retro y de la Selección. Más de 6000 en stock y envíos a todo el país.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.6 }}
            className="mt-8 hidden items-center gap-3 md:flex"
          >
            <button
              onClick={scrollToCatalog}
              className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_40px_rgba(255,255,255,0.2)] transition hover:scale-[1.03]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Ver catálogo <FaArrowRight className="transition group-hover:translate-x-1" />
              </span>
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-white/50 hover:bg-white/5"
            >
              <FaWhatsapp className="text-[#25D366]" /> Pedir por WhatsApp
            </a>
          </motion.div>
        </div>

        {/* 🧊 Escenario 3D */}
        <div
          className="relative flex flex-col items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative w-full" style={{ height: stage.height }}>
            <motion.div
              className="absolute inset-0"
              style={{ x: stageX, y: stageY, perspective: isMobile ? 700 : 1100 }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {/* Piso: círculo central de la cancha en perspectiva */}
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{ x: "-50%", y: stage.floor - (stage.radius * 2.7) / 2, rotateX: 78, rotateZ: floorTilt, transformOrigin: "50% 50%" }}
              >
                <div className="relative" style={{ width: stage.radius * 2.7, height: stage.radius * 2.7 }}>
                  <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22)_0%,rgba(255,255,255,0.06)_40%,transparent_65%)]" />
                  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
                    <motion.circle
                      cx="100" cy="100" r="62" fill="none" stroke="rgba(34,211,238,0.7)" strokeWidth="0.8"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut" }}
                    />
                    <motion.line
                      x1="-40" y1="100" x2="240" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.9 }}
                    />
                    <circle cx="100" cy="100" r="2" fill="#22d3ee" />
                  </svg>
                  <motion.div
                    className="absolute inset-[8%] rounded-full border border-dashed border-white/15"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-[30%] rounded-full border border-cyan-300/40"
                    animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Anillo de camisetas */}
              <div className="absolute left-1/2 top-1/2">
                {slides.map((s, i) => (
                  <RingItem
                    key={s.id}
                    slide={s}
                    index={i}
                    ring={ring}
                    radius={stage.radius}
                    size={stage.size}
                    isActive={i === activeIdx}
                    onClick={() => (i === activeIdx ? handleNavigation(s.eventName) : goTo(i))}
                  />
                ))}
              </div>
            </motion.div>

            {/* Flechas */}
            <button
              onClick={() => setPos((p) => p - 1)}
              aria-label="Anterior"
              className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-white/50 md:grid"
            >
              <FaChevronLeft size={13} />
            </button>
            <button
              onClick={() => setPos((p) => p + 1)}
              aria-label="Siguiente"
              className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-white/50 md:grid"
            >
              <FaChevronRight size={13} />
            </button>
          </div>

          {/* Etiqueta + CTA de la camiseta activa */}
          <div className="relative z-10 -mt-4 flex flex-col items-center gap-4 md:-mt-8">
            <button
              onClick={() => handleNavigation(activeSlide.eventName)}
              className={`group inline-flex items-center gap-3 rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.18em] shadow-2xl transition hover:scale-[1.03] sm:text-sm ${
                activeSlide.isOffer
                  ? "bg-gradient-to-r from-red-700 to-red-500 text-white shadow-red-600/40"
                  : "border border-cyan-400/40 bg-white/10 text-white backdrop-blur hover:border-cyan-300 hover:bg-white hover:text-black"
              }`}
            >
              {activeSlide.title}
              <FaArrowRight className="transition group-hover:translate-x-1" />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  aria-label={`Ver ${s.label}`}
                  className={`relative h-1.5 overflow-hidden rounded-full border-0 bg-white/20 p-0 transition-all duration-300 ${i === activeIdx ? "w-10" : "w-4 hover:bg-white/50"}`}
                >
                  {i === activeIdx && (
                    <motion.span
                      key={`prog-${pos}`}
                      className="absolute inset-y-0 left-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
