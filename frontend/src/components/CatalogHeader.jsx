import React from "react";
import { motion } from "framer-motion";

const CATEGORY_BOXES = [
  { label: "TODOS", value: "", sub: "CATALOGO COMPLETO" },
  { label: "RETRO", value: "Retro", sub: "CLASICOS" },
  { label: "FAN", value: "Fan", sub: "AFICIONADO" },
  { label: "PLAYER", value: "Player", sub: "JUGADOR" },
  { label: "MUJER", value: "Mujer", sub: "CORTE DAMA" },
  { label: "NACIONAL", value: "Nacional", sub: "FUTBOL NACIONAL" },
  { label: "OFERTAS", value: "Ofertas", sub: "PRECIOS ESPECIALES", isOffer: true },
  { label: "TACOS", value: "Tacos", sub: "CALZADO PRO" },
  { label: "NIÑO", value: "Niño", sub: "INFANTIL" },
];

export default function CatalogHeader({ filterType, setFilterType, setPage }) {
  const handleSelectCategory = (val) => {
    setFilterType((prev) => (prev === val && val !== "" ? "" : val));
    if (setPage) setPage(1);

    const catalogo = document.getElementById("catalogo-top");
    if (catalogo) {
      const rect = catalogo.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo({ top: rect.top + scrollTop - 90, behavior: "smooth" });
    }
  };

  const activeCategory =
    CATEGORY_BOXES.find(
      (c) => c.value.toLowerCase() === (filterType || "").toLowerCase()
    ) || CATEGORY_BOXES[0];

  return (
    <div
      className="relative w-full py-16 overflow-hidden select-none border-t border-b"
      style={{ backgroundColor: "#0b0b0b", borderColor: "#1f1f1f" }}
    >
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <h3 className="text-white font-black text-lg sm:text-2xl uppercase tracking-wider">
          {activeCategory.label} /{" "}
          <span className="text-gray-400 font-bold">{activeCategory.sub}</span>
        </h3>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-20"
        style={{
          background: "linear-gradient(90deg, #0b0b0b 0%, rgba(11,11,11,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-20"
        style={{
          background: "linear-gradient(270deg, #0b0b0b 0%, rgba(11,11,11,0) 100%)",
        }}
      />

      {/* Contenedor del riel con espacio vertical (my-4) para evitar que la sombra se corte */}
      <div className="w-full overflow-hidden flex my-4">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="flex items-center gap-5 pr-5 py-2"
        >
          {[...CATEGORY_BOXES, ...CATEGORY_BOXES].map((cat, idx) => {
            const isSelected =
              (filterType || "").toLowerCase() === cat.value.toLowerCase();

            return (
              <button
                key={`${cat.label}-${idx}`}
                onClick={() => handleSelectCategory(cat.value)}
                style={{
                  width: "195px",
                  height: "110px",
                  borderColor: isSelected ? "#ffffff" : "#262626",
                  outline: "none",
                }}
                className={`group relative flex-shrink-0 border flex flex-col items-center justify-center p-4 transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isSelected ? "fondo-plateado-redondo text-black font-black shadow-2xl" : "bg-[#141414] text-gray-200 rounded-full"
                }`}
              >
                <span
                  className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                    isSelected ? "text-black" : "text-white"
                  }`}
                >
                  {cat.label}
                </span>

                <span
                  className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                    isSelected ? "text-zinc-800" : "text-gray-500"
                  }`}
                >
                  {cat.sub}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}