// src/components/FilterBar.jsx
import React, { useState } from "react";

const tipos = [
  "Player", "Fan", "Mujer", "Niño", "Retro", "Abrigos",
  "Nacional", "Ofertas", "NBA", "MLB", "Todos"
];

const tallas = [
  "16","18","20","22","24","26","28", // Niño
  "S","M","L","XL","XXL","3XL","4XL"  // Adulto
];

export default function FilterBar({ 
  searchTerm, setSearchTerm, 
  filterType, setFilterType, 
  filterSizes, setFilterSizes 
}) {
  const [showTipos, setShowTipos] = useState(false);
  const [showTallas, setShowTallas] = useState(false);

  const handleClear = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterSizes([]);
  };

  return (
    <div className="w-full px-4 py-3 bg-white relative z-2 shadow flex flex-col gap-3">
      
      {/* 🔍 Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por equipo o jugador..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      />

      {/* 🔽 Ordenar por + botones */}
      <div className="flex flex-wrap items-center justify-center gap-3">

        {/* Texto ORDENAR POR */}
        <span className="font-medium">Ordenar por:</span>

        {/* Botón TIPOS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTipos(!showTipos);
              setShowTallas(false);
            }}
            className="px-4 py-2 border rounded-md bg-yellow-600 text-black font-medium"
            /*style={{
              backgroundColor: "#9E8F91",
              color: "#000",
              fontSize: "0.9rem",
            }}*/
          >
            {filterType || "Version"}
          </button>
          {showTipos && (
            <div className="absolute mt-1 w-40 bg-white border rounded-md shadow z-40">
              {tipos.map((t) => (
                <div
                  key={t}
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    setFilterType(t === "Todos" ? "" : t);
                    setShowTipos(false);
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón TALLAS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTallas(!showTallas);
              setShowTipos(false);
            }}
            className="px-4 py-2 border rounded-md bg-yellow-600 text-black font-medium"
            /*style={{
              backgroundColor: "#9E8F91",
              color: "#000",
              fontSize: "0.9rem",
            }}*/
          >
            {filterSizes.length > 0 ? filterSizes.join(", ") : "Tallas"}
          </button>
          {showTallas && (
            <div className="absolute mt-1 w-40 max-h-60 overflow-y-auto bg-white border rounded-md shadow z-40">
              
              {tallas.map((t) => (
                <div
                  key={t}
                  className={`px-4 py-2 cursor-pointer ${
                    filterSizes.includes(t) ? "bg-yellow-200 font-semibold" : "hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    if (filterSizes.includes(t)) {
                      setFilterSizes(filterSizes.filter((s) => s !== t));
                    } else {
                      setFilterSizes([...filterSizes, t]);
                    }
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ❌ Limpiar */}
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700"
          style={{
            backgroundColor: "bg-red-600 text-white",
            color: "",
            fontSize: "0.9rem",
          }}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
