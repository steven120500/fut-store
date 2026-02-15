// src/components/FilterBar.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tipos = [
  "Player",
  "Fan",
  "Mujer",
  "Niño",
  "Retro",
  "Abrigos",
  "Nacional",
  "Balón", 
  "Ofertas",
  "NBA",
  "MLB",
  "Todos",
];

const tallas = [
  "16", "18", "20", "22", "24", "26", "28",
  "S", "M", "L", "XL", "XXL", "3XL", "4XL"
];

// 🔹 Mapa de tallas CRC para mostrar visualmente
const tallasCRC = {
  "16": "2",
  "18": "4",
  "20": "6",
  "22": "8",
  "24": "10",
  "26": "12",
  "28": "14"
};

// 🎨 Estilo Plateado Premium (El mismo de tus Cards)
const silverGradient = "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #d1d1d1 100%)";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterSizes,
  setFilterSizes
}) {
  const [showTipos, setShowTipos] = useState(false);
  const [showTallas, setShowTallas] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Referencias para detectar clicks fuera y cerrar menús
  const tiposRef = useRef(null);
  const tallasRef = useRef(null);

  // Detectar modo "Disponibles"
  const isDisponibles = window.__verDisponiblesActivo === true;

  // Debounce para la búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 250);
    return () => clearTimeout(timeout);
  }, [localSearch]);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tiposRef.current && !tiposRef.current.contains(event.target)) {
        setShowTipos(false);
      }
      if (tallasRef.current && !tallasRef.current.contains(event.target)) {
        setShowTallas(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tipoLabel = isDisponibles
    ? "Disponibles"
    : (filterType || "Versión"); 

  const handleClear = () => {
    setLocalSearch("");
    setFilterSizes([]);
    if (!isDisponibles) {
      setFilterType("");
    }
  };

  const handleTipoClick = (t) => {
    if (isDisponibles) delete window.__verDisponiblesActivo;
    if (t === "Todos") {
      setFilterType("");
    } else {
      setFilterType(t);
    }
    setShowTipos(false);
  };

  return (
    <div className="mb-6 mt-6 w-full sticky top-[60px] z-40 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* 🔍 BARRA DE BÚSQUEDA ELEGANTE */}
        <div className="relative w-full md:w-1/3 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar equipo, jugador..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all shadow-inner"
          />
        </div>

        {/* 🔽 BOTONES DE FILTRO PLATEADOS */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
          
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 hidden sm:block">
            Filtrar:
          </span>

          {/* Botón VERSIÓN (Tipos) */}
          <div className="relative" ref={tiposRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowTipos(!showTipos);
                setShowTallas(false);
              }}
              className="px-6 py-2 rounded-full text-gray-800 font-bold text-sm shadow-md flex items-center gap-2 border border-gray-300 hover:shadow-lg transition-all"
              style={{ background: silverGradient }}
            >
              {tipoLabel}
              <svg className={`w-4 h-4 transition-transform ${showTipos ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </motion.button>

            <AnimatePresence>
              {showTipos && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto py-1">
                    {tipos.map((t) => (
                      <div
                        key={t}
                        className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer text-gray-700 hover:text-black hover:font-bold transition-colors"
                        onClick={() => handleTipoClick(t)}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botón TALLAS */}
          <div className="relative" ref={tallasRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowTallas(!showTallas);
                setShowTipos(false);
              }}
              className="px-6 py-2 rounded-full text-gray-800 font-bold text-sm shadow-md flex items-center gap-2 border border-gray-300 hover:shadow-lg transition-all"
              style={{ background: silverGradient }}
            >
              {filterSizes.length > 0 ? `Tallas (${filterSizes.length})` : "Tallas"}
              <svg className={`w-4 h-4 transition-transform ${showTallas ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </motion.button>

            <AnimatePresence>
              {showTallas && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden right-0 md:left-0" // w-48 un poco más ancho
                >
                  <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-2 gap-1">
                    {tallas.map((t) => (
                      <div
                        key={t}
                        className={`text-center py-2 text-xs rounded cursor-pointer transition-all border ${
                          filterSizes.includes(t)
                            ? "bg-black text-white border-black font-bold shadow-md"
                            : "bg-gray-50 text-gray-600 border-transparent hover:border-gray-300 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (filterSizes.includes(t)) {
                            setFilterSizes(filterSizes.filter((s) => s !== t));
                          } else {
                            setFilterSizes([...filterSizes, t]);
                          }
                        }}
                      >
                        {/* ✅ AQUI ESTÁ EL CAMBIO: Muestra la talla original + la tica si existe */}
                        {t} {tallasCRC[t] ? <span className="text-[10px] opacity-70">({tallasCRC[t]})</span> : ""}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ❌ Botón LIMPIAR */}
          {(localSearch || filterType || filterSizes.length > 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 shadow-md transition-colors"
            >
              Limpiar
            </motion.button>
          )}

        </div>
      </div>
    </div>
  );
}