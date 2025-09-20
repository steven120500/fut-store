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

export default function ProductCard({ product, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const H = 700;
  const imgMain = product.images?.[0]?.url
    ? cldUrl(product.images[0].url, 640, H)
    : null;

  const hasDiscount = Number(product.discountPrice) > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="relative bg-white z-0 shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden w-full"
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen con efecto de acercamiento */}
      <div className="relative w-full h-[300px] bg-gray-100 overflow-hidden">
        {/* Badge Oferta */}
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

      {/* Info */}
      <div className="flex flex-col justify-between h-[130px]">
        {/* Tipo */}
        {product.type && (
          <div className="flex justify-center mb-2">
            <div
              className="text-sm text-center font-bold px-4 py-1 w-full shadow-md"
              style={{
                backgroundColor: "#d4af37",
                color: "#000",
                fontSize: "0.9rem",
              }}
            >
              {product.type}
            </div>
          </div>
        )}

        {/* Nombre y precios */}
        <div className="flex p-4 justify-between items-start">
          {/* Nombre */}
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-2 text-left">
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
              <p className="text-base sm:text-lg md:text-xl font-semibold text-black">
                ₡{Number(product.price).toLocaleString("de-DE")}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}