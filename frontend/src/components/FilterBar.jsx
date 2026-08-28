import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tipos = [
  "Player", "Fan", "Mujer", "Niño", "Retro",
  "Abrigos", "Nacional", "Balón", "Tacos", "Ofertas",
  "Mundial", "NBA", "MLB", "Todos",
];

// 🗂️ Tallas agrupadas por categoría
const TALLAS_ADULTO = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const TALLAS_NINO = ["16", "18", "20", "22", "24", "26", "28"];
const TALLAS_TACOS = ["7 US", "7.5 US", "8 US", "8.5 US", "9 US", "9.5 US", "10 US", "10.5 US", "11 US", "11.5 US", "12 US", "12,5 US", "13 US"];

// Equivalencias de Tacos para el texto chiquito
const tallasCRC = {
  "7 US": "40", "7.5 US": "40.5", "8 US": "41", "8.5 US": "42", "9 US": "42.5", 
  "9.5 US": "43", "10 US": "44", "10.5 US": "44.5", "11 US": "45", "11.5 US": "45.5", "12 US": "46"
};

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

  const tiposRef = useRef(null);
  const tallasRef = useRef(null);

  const isDisponibles = window.__verDisponiblesActivo === true;

  useEffect(() => {
    if (filterType === "Mundial") {
      setLocalSearch("");
    }
  }, [filterType]);

  useEffect(() => {
    if (localSearch.trim() === "") {
      if (searchTerm !== "") setSearchTerm(""); 
      return;
    }
    const timeout = setTimeout(() => {
      setSearchTerm(localSearch.trim());
    }, 150); 
    return () => clearTimeout(timeout);
  }, [localSearch, searchTerm, setSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tiposRef.current && !tiposRef.current.contains(event.target)) setShowTipos(false);
      if (tallasRef.current && !tallasRef.current.contains(event.target)) setShowTallas(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tipoLabel = isDisponibles ? "Disponibles" : (filterType || "Versión"); 

  const handleClear = () => {
    setLocalSearch("");
    setSearchTerm("");
    setFilterSizes([]);
    if (!isDisponibles) setFilterType("");
  };

  const handleTipoClick = (t) => {
    if (isDisponibles) delete window.__verDisponiblesActivo;
    setFilterType(t === "Todos" ? "" : t);
    setShowTipos(false);
  };

  // 🛠️ HELPER PARA OBTENER EL VALOR EXACTO ALMACENADO (Soluciona el error del 3XL y Tacos)
  const getStoredValue = (t, isTaco) => {
    if (isTaco && tallasCRC[t]) {
      const numOriginal = t.replace(' US', ''); 
      const numConComa = numOriginal.replace('.', ','); 
      const eqConComa = tallasCRC[t].replace('.', ','); 
      return `${numConComa} US (${eqConComa})`;
    }
    return t;
  };

  // Función para manejar clics en tallas
  const toggleSize = (t, isTaco = false) => {
    const valueToFilter = getStoredValue(t, isTaco);
    
    // Agrega o quita la talla de forma exacta
    setFilterSizes(filterSizes.includes(valueToFilter) 
      ? filterSizes.filter((s) => s !== valueToFilter) 
      : [...filterSizes, valueToFilter]
    );
  };

  const renderSizeGroup = (title, sizesArray, isTaco = false) => {
    // Revisa si alguna talla exacta de este grupo está seleccionada para poner el puntito negro
    const hasAnySelected = sizesArray.some(t => filterSizes.includes(getStoredValue(t, isTaco)));

    return (
      <div className="mb-4 last:mb-0">
        <div className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b border-gray-100 pb-1 flex items-center justify-between">
          {title}
          {hasAnySelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {sizesArray.map((t) => {
            const storedVal = getStoredValue(t, isTaco);
            // 👈 AHORA ES UNA COMPARACIÓN EXACTA (Evita que "3XL" seleccione "L" o "XL")
            const isSelected = filterSizes.includes(storedVal);

            return (
              <div
                key={t}
                className={`text-center py-2 px-1 text-xs rounded-lg cursor-pointer transition-all border ${
                  isSelected 
                    ? "bg-black text-white border-black font-bold shadow-md transform scale-[0.98]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-black hover:bg-gray-100"
                }`}
                onClick={() => toggleSize(t, isTaco)}
              >
                <span className={isTaco ? "font-bold" : ""}>{t}</span>
                {isTaco && tallasCRC[t] && (
                  <span className={`block text-[9px] mt-0.5 ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                    ({tallasCRC[t]})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 mt-6 w-full sticky top-[60px] z-40 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* 🔍 BARRA DE BÚSQUEDA */}
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
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-inner text-black font-medium"
          />
        </div>

        {/* 🔽 BOTONES DE FILTRO PLATEADOS */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 hidden sm:block">
            Filtrar:
          </span>

          {/* Versión */}
          <div className="relative" ref={tiposRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowTipos(!showTipos); setShowTallas(false); }}
              className="px-6 py-2 rounded-full text-gray-800 font-bold text-sm shadow-md flex items-center gap-2 border border-gray-300 hover:shadow-lg transition-all"
              style={{ background: silverGradient }}
            >
              {tipoLabel}
              <svg className={`w-4 h-4 transition-transform ${showTipos ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </motion.button>

            <AnimatePresence>
              {showTipos && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto py-1">
                    {tipos.map((t) => (
                      <div key={t} className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer text-gray-700 hover:text-black hover:font-bold transition-colors" onClick={() => handleTipoClick(t)}>
                        {t}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tallas (Mejorado con categorías) */}
          <div className="relative" ref={tallasRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowTallas(!showTallas); setShowTipos(false); }}
              className="px-6 py-2 rounded-full text-gray-800 font-bold text-sm shadow-md flex items-center gap-2 border border-gray-300 hover:shadow-lg transition-all"
              style={{ background: silverGradient }}
            >
              {filterSizes.length > 0 ? `Tallas (${filterSizes.length})` : "Tallas"}
              <svg className={`w-4 h-4 transition-transform ${showTallas ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </motion.button>

            <AnimatePresence>
              {showTallas && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden right-0 md:left-0"
                >
                  <div className="max-h-[350px] overflow-y-auto p-4 custom-scrollbar">
                    {renderSizeGroup("Adulto", TALLAS_ADULTO)}
                    {renderSizeGroup("Niño", TALLAS_NINO)}
                    {renderSizeGroup("Tacos / Zapatos", TALLAS_TACOS, true)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Limpiar */}
          {(localSearch || filterType || filterSizes.length > 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 shadow-md transition-colors cursor-pointer"
            >
              Limpiar
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}