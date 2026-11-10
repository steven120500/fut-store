import React from "react";

const CATEGORY_BOXES = [
  { label: "Todos", value: "", sub: "Catálogo completo" },
  { label: "Retro", value: "Retro", sub: "Clásicos" },
  { label: "Fan", value: "Fan", sub: "Aficionado" },
  { label: "Player", value: "Player", sub: "Jugador" },
  { label: "Mujer", value: "Mujer", sub: "Corte dama" },
  { label: "Nacional", value: "Nacional", sub: "Fútbol nacional" },
  { label: "Ofertas", value: "Ofertas", sub: "Precios especiales", isOffer: true },
  { label: "Tacos", value: "Tacos", sub: "Calzado pro" },
  { label: "Niño", value: "Niño", sub: "Infantil" },
];

// Cuántas veces se repite la lista en CADA mitad del riel.
// Con 2 copias por mitad (~3500px) el riel cubre incluso monitores 4K sin huecos.
const COPIES_PER_HALF = 2;

export default function CatalogHeader({ filterType, setFilterType, setPage }) {
  const current = (filterType || "").toLowerCase();

  const handleSelectCategory = (val) => {
    setFilterType((prev) => (prev === val && val !== "" ? "" : val));
    setPage?.(1);
    const catalogo = document.getElementById("catalogo-top");
    if (catalogo) {
      window.scrollTo({ top: catalogo.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    }
  };

  const activeCategory = CATEGORY_BOXES.find((c) => c.value.toLowerCase() === current) || CATEGORY_BOXES[0];

  const renderPill = (cat, key, focusable) => {
    const isSelected = current === cat.value.toLowerCase();

    // 🔥 Ofertas: tarjeta propia, roja, animada
    if (cat.isOffer) {
      return (
        <button
          key={key}
          onClick={() => handleSelectCategory(cat.value)}
          tabIndex={focusable ? 0 : -1}
          aria-pressed={isSelected}
          className={`offer-pill group relative flex h-[84px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border px-4 text-white transition-all duration-300 hover:-translate-y-1 sm:h-[96px] sm:w-[180px] ${
            isSelected ? "border-white ring-2 ring-white/70 shadow-[0_0_45px_rgba(239,68,68,0.7)]" : "border-red-400/40 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
          }`}
        >
          <span className="relative flex flex-col items-center leading-none">
            <span className="font-display text-2xl uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] sm:text-[28px]">Ofertas</span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/85 sm:text-[10px]">Hasta agotar</span>
          </span>
        </button>
      );
    }

    return (
      <button
        key={key}
        onClick={() => handleSelectCategory(cat.value)}
        tabIndex={focusable ? 0 : -1}
        aria-pressed={isSelected}
        className={`group relative flex h-[84px] w-[150px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border px-4 transition-all duration-300 sm:h-[96px] sm:w-[180px] ${
          isSelected
            ? "bg-silver border-cyan-300 text-black shadow-[0_0_35px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/60"
            : "border-white/10 bg-[#141414] text-white hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-[#1b1b1b]"
        }`}
      >
        <span className="font-display text-xl uppercase tracking-wider sm:text-2xl">{cat.label}</span>
        <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] sm:text-[10px] ${isSelected ? "text-zinc-700" : "text-zinc-500"}`}>
          {cat.sub}
        </span>
      </button>
    );
  };

  // Dos mitades idénticas → la animación se desplaza -50% y vuelve sin salto
  const halves = [0, 1].map((half) => (
    <div key={half} className="flex shrink-0 gap-4 pr-4" aria-hidden={half === 1 ? "true" : undefined}>
      {Array.from({ length: COPIES_PER_HALF }).flatMap((_, copy) =>
        CATEGORY_BOXES.map((cat) => renderPill(cat, `${half}-${copy}-${cat.label}`, half === 0 && copy === 0))
      )}
    </div>
  ));

  return (
    <section id="categorias" className="relative w-full overflow-hidden border-y border-white/5 bg-[#0b0b0b] py-12 select-none sm:py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="mx-auto mb-8 flex max-w-7xl flex-col gap-2 px-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400 sm:text-xs">Explorá por categoría</p>
          <h3 className="font-display text-3xl uppercase tracking-wide text-white sm:text-5xl">
            {activeCategory.label} <span className="text-zinc-600">/</span>{" "}
            <span className={activeCategory.isOffer ? "text-red-500" : "text-silver"}>{activeCategory.sub}</span>
          </h3>
        </div>
      </div>

      {/* ♾️ Riel infinito (se pausa al pasar el mouse o tocar) */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-[#0b0b0b] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-[#0b0b0b] to-transparent sm:w-32" />
        <div
          className="flex w-max animate-marquee py-4 hover:[animation-play-state:paused] active:[animation-play-state:paused]"
          style={{ animationDuration: "70s" }}
        >
          {halves}
        </div>
      </div>
    </section>
  );
}
