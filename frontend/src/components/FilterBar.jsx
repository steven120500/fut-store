import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

const filterOptions = [
  "Player",
  "Fan",
  "Mujer",
  "Niño",
  "Retro",
  "Abrigos",
  "Nacional",
  "Ofertas",
  "NBA",
  "MLB",
  "NFL",
  "Todos",
];

const tallaOptions = [
  "16",
  "18",
  "20",
  "22",
  "24",
  "26",
  "28",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
];

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterSizes,
  setFilterSizes,
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-4 mb-8">
      {/* Input de búsqueda */}
      <motion.input
        type="text"
        placeholder="Buscar por nombre o equipo"
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      />

      {/* Botones de filtros */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 w-full px-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filterOptions.map((label) => {
          const isActive =
            filterType === label || (label === "Todos" && filterType === "");
          return (
            <button
              key={label}
              onClick={() => setFilterType(label === "Todos" ? "" : label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition whitespace-nowrap shadow-sm font-medium ${
                isActive
                  ? "bg-white text-black border-[#d4af37]"
                  : "bg-white text-black border-gray-300 hover:border-[#d4af37] hover:text-[#d4af37]"
              }`}
              style={{
                backgroundColor: "#d4af37",
                color: "#000",
                fontSize: "0.9rem",
              }}
            >
              {/* Caja con check */}
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-sm border ${
                  isActive
                    ? "bg-[#d4af37] border-[#d4af37]"
                    : "border-[#d4af37] bg-white"
                }`}
                style={{
                  backgroundColor: "#d4af37",
                  color: "#000",
                  fontSize: "0.9rem",
                }}
              >
                {isActive && <FaCheck className="text-black text-sm" />}
              </span>
              {label}
            </button>
          );
        })}
      </motion.div>

      {/* Botones de tallas */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 w-full px-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {tallaOptions.map((size) => {
          const isActive = filterSizes.includes(size);
          return (
            <button
              key={size}
              onClick={() => {
                setFilterSizes((prev) =>
                  isActive ? prev.filter((s) => s !== size) : [...prev, size]
                );
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded-md border transition font-medium ${
                isActive
                  ? "bg-white text-black border-[#d4af37]"
                  : "bg-white text-black border-gray-300 hover:border-[#d4af37] hover:text-[#d4af37]"
              }`}
              style={{
                backgroundColor: "#d4af37",
                color: "#000",
                fontSize: "0.9rem",
              }}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-sm border ${
                  isActive
                    ? "bg-[#d4af37] border-[#d4af37]"
                    : " bg-white"
                }`}
                style={{
                  backgroundColor: "#d4af37",
                  color: "#000",
                  fontSize: "0.9rem",
                }}
              >
                {isActive && <FaCheck className="text-black text-sm" />}
              </span>
              {size}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
