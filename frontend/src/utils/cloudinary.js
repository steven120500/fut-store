// src/utils/cloudinary.js
// Entrega de imágenes optimizadas desde Cloudinary.
//
// Muchas fotos originales son PNG de ~2 MB. Pedir una versión transformada (formato
// automático WebP/AVIF, calidad automática y tamaño justo) baja eso a ~5–90 KB.
// Se usan POCOS tamaños fijos a propósito: cada combinación distinta cuenta como una
// transformación nueva en Cloudinary, así que reutilizarlas también ahorra créditos.

const PRESETS = {
  card: "f_auto,q_auto:eco,c_fill,g_north,e_sharpen:60,w_640,h_800", // tarjeta del catálogo (igual que antes: reusa lo ya generado)
  detail: "f_auto,q_auto:good,c_limit,w_1000", // foto grande en la ficha del producto
  thumb: "f_auto,q_auto:eco,c_fill,g_north,w_160,h_200", // miniaturas (checkout, carrito, paneles)
};

/**
 * Devuelve la URL optimizada. Si no es una imagen de Cloudinary (data: de una vista previa,
 * otra web, etc.) o ya trae transformaciones, la devuelve tal cual.
 */
export function cld(url, preset = "thumb") {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  // Ya transformada (p. ej. "/upload/f_auto,..." o "/upload/w_300/")
  if (/\/upload\/[a-z]{1,2}_[^/]+\//.test(url)) return url;
  const t = PRESETS[preset] || PRESETS.thumb;
  return url.replace("/upload/", `/upload/${t}/`);
}

/** Primera imagen de un producto, venga en el formato que venga. */
export function productImage(product) {
  if (!product) return "";
  const first = Array.isArray(product.images) && product.images.length ? product.images[0] : null;
  return (typeof first === "string" ? first : first?.url) || product.imageSrc || "";
}
