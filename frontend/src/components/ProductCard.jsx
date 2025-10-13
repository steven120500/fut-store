// src/components/ProductCard.jsx
import { motion } from "framer-motion";
import { useState } from "react";

// 🔽 helper para Cloudinary
const cldUrl = (url, w, h) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  return url.replace(
    /\/upload\/(?!.*(f_auto|q_auto|w_|h_))/,
    `/upload/f_auto,q_auto:eco,c_fill,g_auto,e_sharpen:60,w_${w},h_${h}/`
  );
};

export default function ProductCard({ product, onClick, user, canEdit }) {
  const [isHovered, setIsHovered] = useState(false);

  const H = 700;
  const imgMain = product.images?.[0]?.url
    ? cldUrl(product.images[0].url, 640, H)
    : null;

  const hasDiscount = Number(product.discountPrice) > 0;

  // 🔹 Definir tallas según tipo
  const tallasAdulto = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const tallasNino = ["16", "18", "20", "22", "24", "26", "28"];

  const isNiño = product.type?.toLowerCase() === "niño";
  const ALL_SIZES = isNiño ? tallasNino : tallasAdulto;

  // 🔹 Crear stock con todas las tallas posibles (si falta → null)
  const stockEntries = ALL_SIZES.map((size) => [
    size,
    product.stock?.[size] ?? null,
  ]);

  // 🔹 Clasificación
  const soldOutSizes = stockEntries
    .filter(([_, qty]) => qty == null || qty <= 0)
    .map(([size]) => size);

  const lowStockSizes = stockEntries
    .filter(([_, qty]) => qty === 1)
    .map(([size]) => size);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="relative bg-white z-0 shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden w-full"
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen */}
      <div className="relative w-full h-[300px] bg-gray-100 overflow-hidden">
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded shadow-md">
            Oferta
          </span>
        )}

        <motion.img
          src={imgMain}
          alt={product.name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          animate={{ scale: isHovered ? 1.3 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* 🔸 Tipo — pegado directamente a la imagen */}
      {product.type && (
        <div className="w-full">
          <div className="block w-full text-sm text-center text-purple-600 bg-yellow-600 font-bold py-1 shadow-md">
            {product.type}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col justify-between h-auto p-4">
        {/* Nombre */}
        <h3 className="text-xs sm:text-sm md:text-base font-bold text-purple-600 line-clamp-2 text-left">
          {product.name}
        </h3>

        {/* Precios */}
        <div className="text-right">
          {hasDiscount ? (
            <>
              <p className="text-sm sm:text-base line-through text-gray-500">
                ₡{Number(product.price).toLocaleString("de-DE")}
              </p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-red-600">
                ₡{Number(product.discountPrice).toLocaleString("de-DE")}
              </p>
            </>
          ) : (
            <p className="text-base sm:text-lg md:text-xl font-semibold text-yellow-600">
              ₡{Number(product.price).toLocaleString("de-DE")}
            </p>
          )}
        </div>

        {/* 🔹 Avisos de stock SOLO para admins */}
        {canEdit && (
          <div className="mt-2 text-xs space-y-1">
            {soldOutSizes.length > 0 && (
              <p className="text-red-600 flex items-center gap-1">
                ⚠️ Agotado en tallas {soldOutSizes.join(", ")}
              </p>
            )}
            {lowStockSizes.length > 0 && (
              <p className="text-gray-600 flex items-center gap-1">
                ⚠️ Queda 1 en tallas {lowStockSizes.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
