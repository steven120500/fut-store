import { motion } from "framer-motion";
import { useState } from "react";

// 🔽 Helper para Cloudinary
const cldUrl = (url, w, h) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  return url.replace(
    /\/upload\/(?!.*(f_auto|q_auto|w_|h_))/,
    `/upload/f_auto,q_auto:eco,c_fill,g_auto,e_sharpen:60,w_${w},h_${h}/`
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
  const H = 700;

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
  const tallasTacos = ['7 US (40)', '7.5 US (40.5)', '8 US (41)', '8.5 US (42)', '9 US (42.5)', '9.5 US (43)', '10 US (44)', '10.5 US (44.5)', '11 US (45)', '11.5 US (45.5)', '12 US (46)'];

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

  const silverGradient = "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #d1d1d1 100%)";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      // 🔥 BLOQUEO 1: h-full y flex-col para que la tarjeta sea estructuralmente rígida
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer w-full h-full flex flex-col border border-gray-100"
      onClick={() => onClick(product)}
    >
      {/* 📸 SECCIÓN DE IMAGEN (Protegida por aspect-[4/5]) */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden shrink-0">
        
        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <span className="text-white font-bold uppercase tracking-widest border-2 border-white text-xs px-4 py-2 sm:text-lg">
              Agotado
            </span>
          </div>
        )}

        {!isOutOfStock && isNew && (
          <div className="sticker-new z-20">
            <span>Nuevo</span>
          </div>
        )}

        {!isOutOfStock && hasDiscount && (
          <span
            className="absolute top-2 right-2 text-white font-bold z-10 text-xs sm:text-sm px-3 py-1 rounded-md overflow-hidden shadow-lg"
            style={{
              background: "linear-gradient(90deg, #d10000 0%, #ff3030 50%, #d10000 100%)",
              boxShadow: "0 0 15px rgba(255,0,0,0.7)",
            }}
          >
            OFERTA
            <span
              className="shine-effect"
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "50%",
                height: "100%",
                background: "linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.2) 100%)",
                transform: "skewX(-20deg)",
                animation: "shineMove 5s infinite",
              }}
            />
          </span>
        )}

        {imgMain ? (
          <img
            src={imgMain}
            alt={product.name}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-in-out group-hover:scale-110 ${
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
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-110"
            loading="lazy"
          />
        )}
      </div>

      {/* 📝 INFORMACIÓN (Estructura Flex Rígida) */}
      <div className="flex flex-col flex-grow">
        {type && (
          <div 
            className="w-full text-center py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm z-10 relative shrink-0"
            style={{ background: silverGradient, color: "#333" }}
          >
            {type}
          </div>
        )}

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* 🔥 BLOQUEO 2: Altura exacta y fija para el título (h-[2.5rem] sm:h-[2.75rem]) */}
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-tight h-[2.5rem] sm:h-[2.75rem] overflow-hidden group-hover:text-black transition-colors shrink-0">
            {product.name}
          </h3>

          {/* 🔥 BLOQUEO 3: mt-auto empuja el precio siempre hasta el fondo del contenedor */}
          <div className="flex items-end justify-end mt-auto pt-2">
            <div className="text-right flex flex-col items-end">
              {hasDiscount ? (
                <>
                  <span className="text-[10px] sm:text-xs text-gray-400 line-through decoration-red-400">
                    ₡{Number(product.price).toLocaleString("de-DE")}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-bold text-red-600 leading-none mt-0.5">
                    ₡{Number(product.discountPrice).toLocaleString("de-DE")}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-none">
                  ₡{Number(product.price).toLocaleString("de-DE")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 BLOQUEO 4: Caja de Admin con altura estática (h-[56px]) para evitar cambios en la grilla */}
        {canEdit && (
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 text-[10px] space-y-1 shrink-0 h-[56px] flex flex-col justify-center overflow-hidden">
             {isOutOfStock ? (
               <p className="text-red-600 font-bold text-center">🔴 SIN STOCK</p>
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
               </>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
}