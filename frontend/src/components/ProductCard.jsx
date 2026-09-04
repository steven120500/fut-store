import { motion } from "framer-motion";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

// 🔽 Helper para Cloudinary
const cldUrl = (url, w, h) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  return url.replace(
    /\/upload\/(?!.*(f_auto|q_auto|w_|h_))/,
    // 🔥 FIX: c_fill y g_north mantienen el cuello siempre visible
    `/upload/f_auto,q_auto:eco,c_fill,g_north,e_sharpen:60,w_${w},h_${h}/`
  );
};

// 🛡️ HELPER INTELIGENTE: Busca el stock ignorando la diferencia entre puntos y comas
const getStockDisponible = (stockObj, tallaBuscada) => {
  if (!stockObj) return null;

  if (stockObj[tallaBuscada] !== undefined && stockObj[tallaBuscada] !== null) {
    return Number(stockObj[tallaBuscada]);
  }

  const normBuscada = String(tallaBuscada).replace(/,/g, '.').trim().toLowerCase();
  const keyReal = Object.keys(stockObj).find(k => 
    k.replace(/,/g, '.').trim().toLowerCase() === normBuscada
  );

  return keyReal !== undefined && stockObj[keyReal] !== null ? Number(stockObj[keyReal]) : null;
};

export default function ProductCard({ product, onClick, canEdit }) {
  // 🔥 FIX: Aumentamos la altura a 800 para formato 4/5 (corta mucho menos abajo)
  const H = 800;

  // 1. IMAGEN PRINCIPAL (Frontal)
  const imgMain =
    Array.isArray(product.images) && product.images.length > 0
      ? cldUrl(
          typeof product.images[0] === "string"
            ? product.images[0]
            : product.images[0]?.url,
          640,
          H
        )
      : product.imageSrc || null;

  // 2. IMAGEN SECUNDARIA (Trasera/Hover)
  const imgHover =
    Array.isArray(product.images) && product.images.length > 1
      ? cldUrl(
          typeof product.images[1] === "string"
            ? product.images[1]
            : product.images[1]?.url,
          640,
          H
        )
      : null;

  const hasDiscount = Number(product.discountPrice) > 0;
  const isNew = Boolean(product.isNew);

  // Definición de Tallas y Stock
  const tallasAdulto = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const tallasNino = ["16", "18", "20", "22", "24", "26", "28"];
  const tallasBalon = ["3", "4", "5"];
  const tallasTacos = ['7 US (40)', '7.5 US (40.5)', '8 US (41)', '8.5 US (42)', '9 US (42.5)', '9.5 US (43)', '10 US (44)', '10.5 US (44.5)', '11 US (45)', '11.5 US (45.5)', '12 US (46)', '12,5 US (46,5)', '13 US (47)'];

  const type = (product.type || "").trim();
  const typeLower = type.toLowerCase();
  const isNiño = typeLower === "niño";
  const isBalon = typeLower === "balón";
  const isTacos = typeLower === "tacos";

  const ALL_SIZES = isBalon ? tallasBalon : isTacos ? tallasTacos : isNiño ? tallasNino : tallasAdulto;

  const stockEntries = ALL_SIZES.map((size) => [
    size,
    getStockDisponible(product.stock, size),
  ]);

  const soldOutSizes = stockEntries
    .filter(([_, qty]) => qty == null || qty <= 0)
    .map(([size]) => size);

  const lowStockSizes = stockEntries
    .filter(([_, qty]) => Number(qty) === 1)
    .map(([size]) => size);

  const totalStock = stockEntries.reduce((acc, [_, qty]) => acc + (Number(qty) || 0), 0);
  const isOutOfStock = totalStock <= 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl w-full h-full flex flex-col md:hover:-translate-y-2 transition-all duration-300 ease-out border border-gray-100 cursor-pointer"
      onClick={() => onClick(product)}
    >
      {/* 📸 SECCIÓN DE IMAGEN: aspectRatio 4/5 para dar más espacio vertical */}
      <div 
        className="relative w-full bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center"
        style={{ aspectRatio: "4/5" }}
      >
        
        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <span className="text-white font-bold uppercase tracking-widest border-2 border-white text-xs px-4 py-2 sm:text-lg">
              Agotado
            </span>
          </div>
        )}

        {/* Separamos el sticker "Nuevo" ligeramente del borde para que respire */}
        {!isOutOfStock && isNew && (
          <div className="sticker-new z-20 absolute top-2 left-2">
            <span>Nuevo</span>
          </div>
        )}

        {!isOutOfStock && hasDiscount && (
          <span
            className="absolute top-2 right-2 text-white font-bold z-10 text-[10px] sm:text-xs px-2.5 py-1 rounded shadow-lg tracking-wider"
            style={{
              background: "linear-gradient(90deg, #d10000 0%, #ff3030 50%, #d10000 100%)",
            }}
          >
            OFERTA
          </span>
        )}

        {/* Imágenes */}
        {imgMain ? (
          <img
            src={imgMain}
            alt={product.name}
            className={`w-full h-full object-cover object-top transition-all duration-700 ease-in-out md:group-hover:scale-105 ${
              imgHover && !isOutOfStock ? "group-hover:opacity-0" : "" 
            } ${isOutOfStock ? "opacity-60 grayscale" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-300">
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {imgHover && !isOutOfStock && (
          <img
            src={imgHover}
            alt={`${product.name} vista trasera`}
            className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100 md:group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* 🔥 FRANJA SÓLIDA PARA EL TIPO (Letra pequeña en móvil) */}
        {type && (
          <div className="absolute bottom-0 left-0 w-full text-center py-1.5 text-xs sm:text-xl font-black uppercase tracking-[0.2em] fondo-plateado text-black z-40">
            {type}
          </div>
        )}
      </div>

      {/* 📝 INFORMACIÓN */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow bg-white text-left">
        
        {/* Título */}
        <h3 className="text-xs sm:text-xl font-black text-black uppercase tracking-tight line-clamp-2 leading-snug h-[2rem] sm:h-[2.2rem] overflow-hidden group-hover:text-black transition-colors shrink-0">
          {product.name}
        </h3>

        {/* Precios y Botón de "+" */}
        <div className="flex items-end justify-between mt-auto pt-3">
          <div className="flex flex-col items-start">
            {hasDiscount ? (
              <>
                <span className="text-xs sm:text-xl text-gray-400 line-through decoration-red-400">
                  ₡{Number(product.price).toLocaleString("de-DE")}
                </span>
                <span className="text-xs sm:text-xl font-black text-red-600 leading-none mt-0.5">
                  ₡{Number(product.discountPrice).toLocaleString("de-DE")}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-xl font-black text-gray-500 leading-none">
                ₡{Number(product.price).toLocaleString("de-DE")}
              </span>
            )}
          </div>

          {/* Botón flotante derecho */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gray-50 rounded shadow-sm border border-gray-100 text-gray-400 group-hover:bg-[#1a237e] group-hover:text-white transition-colors">
            <FaPlus className="text-[9px] sm:text-[10px]" />
          </div>
        </div>
      </div>

      {/* 🔥 CAJA ADMIN */}
      {canEdit && (
        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 text-[10px] space-y-1 shrink-0 h-[56px] flex flex-col justify-center overflow-hidden text-center">
            {isOutOfStock ? (
              <p className="text-red-600 font-bold">🔴 SIN STOCK</p>
            ) : (
              <>
              {soldOutSizes.length > 0 && (
                <p className="text-red-600 truncate">
                  <span className="font-bold">Agotado:</span> {soldOutSizes.join(", ")}
                </p>
              )}
              {lowStockSizes.length > 0 && (
                <p className="text-orange-500 truncate">
                  <span className="font-bold">Queda 1:</span> {lowStockSizes.join(", ")}
                </p>
              )}
              {soldOutSizes.length === 0 && lowStockSizes.length === 0 && (
                <p className="text-green-600 font-medium">✅ Stock completo</p>
              )}
              </>
            )}
        </div>
      )}
    </motion.div>
  );
}