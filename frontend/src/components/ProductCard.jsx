import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

// 🔽 Helper para Cloudinary
const cldUrl = (url, w, h) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  return url.replace(
    /\/upload\/(?!.*(f_auto|q_auto|w_|h_))/,
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

export default function ProductCard({ product, onClick }) {
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

  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice) || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPct = hasDiscount ? Math.round((1 - discountPrice / price) * 100) : 0;
  const fmt = (n) => `₡${Number(n).toLocaleString("de-DE")}`;
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

  const totalStock = stockEntries.reduce((acc, [, qty]) => acc + (Number(qty) || 0), 0);
  const isOutOfStock = totalStock <= 0;

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white transition-all duration-300 ease-out hover:border-cyan-300/70 hover:shadow-[0_20px_40px_-12px_rgba(6,182,212,0.35)] md:hover:-translate-y-1.5"
      onClick={() => onClick(product)}
    >
      {/* 📸 Imagen */}
      <div className="relative w-full shrink-0 overflow-hidden bg-zinc-100" style={{ aspectRatio: "4/5" }}>
        {imgMain ? (
          <img
            src={imgMain}
            alt={product.name}
            className={`h-full w-full object-cover object-top transition-all duration-700 ease-out md:group-hover:scale-105 ${
              imgHover && !isOutOfStock ? "md:group-hover:opacity-0" : ""
            } ${isOutOfStock ? "opacity-60 grayscale" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-zinc-400">Sin imagen</div>
        )}

        {imgHover && !isOutOfStock && (
          <img
            src={imgHover}
            alt={`${product.name} vista trasera`}
            className="absolute inset-0 hidden h-full w-full object-cover object-top opacity-0 transition-all duration-700 ease-out md:block md:group-hover:scale-105 md:group-hover:opacity-100"
            loading="lazy"
          />
        )}

        {/* Degradado inferior para legibilidad */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-80" />

        {/* Etiquetas: misma familia visual (cápsula de vidrio negro) */}
        <div className="absolute left-2 top-2 z-20 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {!isOutOfStock && isNew && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/80 py-1 pl-2 pr-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md sm:text-[10px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              Nuevo
            </span>
          )}
        </div>

        {!isOutOfStock && hasDiscount && (
          <span className="absolute right-2 top-2 z-20 flex items-stretch overflow-hidden rounded-full shadow-[0_6px_18px_rgba(220,38,38,0.45)] ring-1 ring-white/20 sm:right-3 sm:top-3">
            <span className="bg-black/80 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md sm:text-[10px]">Oferta</span>
            <span className="bg-gradient-to-r from-red-600 to-red-500 px-2 py-1 text-[10px] font-black text-white sm:text-[11px]">-{discountPct}%</span>
          </span>
        )}

        {/* Ver producto (desktop hover) */}
        {!isOutOfStock && (
          <span className="absolute bottom-3 right-3 z-20 hidden h-9 w-9 translate-y-2 place-items-center rounded-full bg-cyan-400 text-black opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:grid">
            <FaArrowRight size={12} />
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/70 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white sm:text-xs">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* 📝 Información */}
      <div className="flex grow flex-col p-3 sm:p-4">
        {type && (
          <span className="bg-silver mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-zinc-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rotate-45 bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            {type}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.5em] text-[13px] font-bold uppercase leading-tight tracking-tight text-zinc-900 sm:text-[15px]">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {hasDiscount ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-black leading-none text-red-600 sm:text-lg">{fmt(discountPrice)}</span>
              <span className="text-[11px] text-zinc-400 line-through sm:text-xs">{fmt(price)}</span>
            </div>
          ) : (
            <span className="text-base font-black leading-none text-zinc-900 sm:text-lg">{fmt(price)}</span>
          )}
        </div>
      </div>

    </motion.article>
  );
}
