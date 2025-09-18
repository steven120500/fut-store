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

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="relative bg-white z-0 shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden w-full"
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen con efecto de acercamiento */}
      <div className="w-full h-[300px] bg-gray-100 overflow-hidden">
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
      <div className="flex flex-col justify-between h-[110px]">
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

        {/* Nombre y precio */}
        <div className="flex p-4 justify-between items-center">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-2 text-left">
            {product.name}
          </h3>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-right text-black">
            ₡{product.price?.toLocaleString("de-DE") || product.price}
          </p>
        </div>
      </div>
    </motion.div>
  );
}