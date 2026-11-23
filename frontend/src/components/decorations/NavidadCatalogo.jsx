import React, { useId } from "react";
import { FaGift, FaTruck } from "react-icons/fa";
import { NAVIDAD } from "../../navidad";

// 🎄 Decoración navideña del catálogo (fondo blanco). Todo estático en SVG/CSS: liviano en iPhone.

// Copo de nieve celeste (color de la marca) para títulos, banner y tarjetas
export function Copo({ className = "" }) {
  if (!NAVIDAD) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 ${className.includes("h-") ? "" : "h-3 w-3"} ${className}`}
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
      <path d="M9 3.5L12 6l3-2.5M9 20.5L12 18l3 2.5M3.6 10.6L6.8 9.2 6.2 5.6M17.8 18.4l-.6-3.6 3.2-1.4M3.6 13.4l3.2 1.4-.6 3.6M17.8 5.6l-.6 3.6 3.2 1.4" />
    </svg>
  );
}

// Banner navideño del catálogo (negro + celeste de la marca, detalles rojo/verde)
export function BannerNavidad() {
  if (!NAVIDAD) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-black px-5 py-5 text-white shadow-[0_20px_40px_-20px_rgba(6,182,212,0.45)] ring-1 ring-cyan-400/30 sm:px-8 sm:py-6">
      {/* brillo de fondo */}
      <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-red-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[3.25rem] top-1/2 hidden -translate-y-1/2 sm:block">
        <FaGift size={42} className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
      </div>

      <div className="relative flex flex-col gap-3 sm:pr-28 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300">
            <Copo className="h-3 w-3 text-cyan-300" /> Diciembre en FutStore
          </p>
          <h3 className="mt-1 max-w-2xl font-display text-2xl uppercase leading-tight tracking-wide sm:text-3xl">
            El regalo que <span className="text-cyan-300">todo aficionado quiere recibir esta Navidad</span>
          </h3>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            <FaTruck className="text-cyan-300" /> Envíos a todo el país
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/15 px-3 py-1.5 text-red-300">
            🎁 Ideal para regalar
          </span>
        </div>
      </div>
    </div>
  );
}

// Guirnalda de pino con esferas: divisor festivo bajo los títulos de colección
const COLORES_GUIRNALDA = ["#dc2626", "#22d3ee", "#eab308", "#dc2626", "#16a34a", "#22d3ee"];
export function GuirnaldaPino({ className = "" }) {
  if (!NAVIDAD) return null;
  const n = 24;
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 480 22" preserveAspectRatio="none" className="h-5 w-full">
        <defs>
          <pattern id="pino-agujas" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="10" height="10" fill="#166534" />
            <rect width="3" height="10" fill="#15803d" />
            <rect x="6" width="2" height="10" fill="#14532d" />
          </pattern>
        </defs>
        <path d="M0 6 Q 20 16 40 6 T 80 6 T 120 6 T 160 6 T 200 6 T 240 6 T 280 6 T 320 6 T 360 6 T 400 6 T 440 6 T 480 6"
          fill="none" stroke="url(#pino-agujas)" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <div className="relative -mt-3 flex justify-around">
        {Array.from({ length: n }).map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${i % 3 === 2 ? "hidden sm:block" : ""}`}
            style={{ background: COLORES_GUIRNALDA[i % COLORES_GUIRNALDA.length], marginTop: i % 2 ? 4 : 0 }} />
        ))}
      </div>
    </div>
  );
}

// ✨ Hero oscuro: esferas brillantes colgando del techo del estadio (celeste, plata y rojo)
const ESFERAS_HERO = [
  { x: 3, largo: 70, r: 11, color: "#22d3ee" },
  { x: 9, largo: 30, r: 7, color: "#e4e4e7" },
  { x: 44, largo: 55, r: 9, color: "#dc2626" },
  { x: 52, largo: 120, r: 14, color: "#22d3ee", estrella: true },
  { x: 61, largo: 40, r: 8, color: "#e4e4e7" },
  { x: 69, largo: 95, r: 12, color: "#dc2626" },
  { x: 78, largo: 50, r: 9, color: "#22d3ee" },
  { x: 86, largo: 135, r: 15, color: "#e4e4e7" },
  { x: 94, largo: 65, r: 10, color: "#22d3ee" },
];

// Celular: hilos cortos, repartidas y pegadas a los bordes para no tapar "Feliz Navidad"
const ESFERAS_HERO_MOVIL = [
  { x: 5, largo: 34, r: 8, color: "#22d3ee" },
  { x: 17, largo: 12, r: 5, color: "#e4e4e7" },
  { x: 29, largo: 22, r: 6, color: "#dc2626" },
  { x: 66, largo: 18, r: 6, color: "#e4e4e7" },
  { x: 79, largo: 10, r: 5, color: "#dc2626" },
  { x: 90, largo: 38, r: 9, color: "#22d3ee" },
];

function EsferaBrillante({ color, r, estrella }) {
  const w = r * 4;
  const c = w / 2;
  // IDs únicos por esfera: si el degradado se define en una esfera oculta (display:none),
  // Chrome no lo dibuja en las demás y solo se vería el hilo.
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`} className="-mt-[2px]" style={{ marginTop: -r * 0.9 }}>
      <defs>
        <radialGradient id={`halo-${uid}`}>
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`brillo-${uid}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.25" stopColor={color} />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r * 2} fill={`url(#halo-${uid})`} />
      {estrella ? (
        <path
          transform={`translate(${c} ${c}) scale(${r / 10})`}
          d="M0 -11 L3 -3.5 L11 -3.5 L4.6 1.5 L7 9.5 L0 4.6 L-7 9.5 L-4.6 1.5 L-11 -3.5 L-3 -3.5 Z"
          fill={`url(#brillo-${uid})`}
        />
      ) : (
        <>
          <rect x={c - r * 0.25} y={c - r - 3} width={r * 0.5} height="4" rx="1" fill="#a1a1aa" />
          <circle cx={c} cy={c} r={r} fill={`url(#brillo-${uid})`} />
        </>
      )}
    </svg>
  );
}

function FilaEsferas({ esferas, className }) {
  return (
    <div className={className}>
      {esferas.map((e, i) => (
        <div
          key={i}
          className="navidad-esfera absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${e.x}%`, animationDelay: `${(i % 4) * 0.7}s`, animationDuration: `${4 + (i % 3)}s` }}
        >
          <span className="w-px bg-gradient-to-b from-white/10 via-white/40 to-white/60" style={{ height: e.largo }} />
          <EsferaBrillante color={e.color} r={e.r} estrella={e.estrella} />
        </div>
      ))}
    </div>
  );
}

export function EsferasHero() {
  if (!NAVIDAD) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-0 h-56 overflow-hidden" style={{ top: "var(--nav-h)" }} aria-hidden="true">
      <FilaEsferas esferas={ESFERAS_HERO_MOVIL} className="md:hidden" />
      <FilaEsferas esferas={ESFERAS_HERO} className="hidden md:block" />
    </div>
  );
}
