import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tallaPorTipo from "../utils/tallaPorTipo";

const API_BASE = import.meta.env.VITE_API_BASE || "https://fut-store.onrender.com";
const MAX_IMAGES = 2;
const MAX_WIDTH = 1000;
const QUALITY = 0.75;

// 🔹 Convierte File -> WebP
async function convertToWebpBlob(file, maxWidth = MAX_WIDTH, quality = QUALITY) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Formato no soportado"));
    i.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    const tryType = "image/webp";
    canvas.toBlob(
      (b) => resolve(b),
      canvas.toDataURL(tryType).startsWith("data:image/webp") ? tryType : "image/png",
      quality
    );
  });

  if (!blob) throw new Error("No se pudo convertir la imagen");
  return blob;
}

// 🔹 Convierte src a Blob
async function srcToBlob(src) {
  if (!src) throw new Error("Imagen sin src");

  if (src.startsWith("blob:") || src.startsWith("http")) {
    const r = await fetch(src);
    if (!r.ok) throw new Error("No se pudo leer blob/url");
    return await r.blob();
  }

  if (src.startsWith("data:")) {
    const parts = src.split(",");
    if (parts.length < 2) throw new Error("dataURL inválido");
    const meta = parts[0];
    const b64 = parts[1];
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  throw new Error("Formato de imagen no soportado");
}

export default function AddProductModal({ onAdd, onCancel, user }) {
  const [images, setImages] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [type, setType] = useState("Player");
  const [isNew, setIsNew] = useState(false);
  const [isMundial, setIsMundial] = useState(false);
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      setImages((prev) => {
        prev.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
        return [];
      });
    };
  }, []);

  // 🏆 Tallas con COMAS
  const tallas = useMemo(() => {
    const TACO_SIZES = ['7 US (40)', '7,5 US (40,5)', '8 US (41)', '8,5 US (42)', '9 US (42,5)', '9,5 US (43)', '10 US (44)', '10,5 US (44,5)', '11 US (45)', '11,5 US (45,5)', '12 US (46)', '12,5 US (46,5)', '13 US (47)'];
    const tipos = { ...tallaPorTipo, Balón: ["3", "4", "5"], Tacos: TACO_SIZES };
    return tipos[type] || [];
  }, [type]);

  const handleFiles = async (filesLike) => {
    const files = Array.from(filesLike).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;

    try {
      setLoading(true);
      const converted = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error("Formato de imagen no soportado");
          continue;
        }
        const blob = await convertToWebpBlob(file);
        const previewUrl = URL.createObjectURL(blob);
        converted.push({ blob, previewUrl });
      }

      if (converted.length) {
        setImages((prev) => [...prev, ...converted].slice(0, MAX_IMAGES));
        toast.success("Imágenes optimizadas a WebP");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "No se pudo optimizar la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFiles([file]);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const copy = prev.slice();
      const item = copy[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // ✅ Captura de inventario
  const handleInvChange = (size, value) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setStock((prev) => ({ ...prev, [size]: num }));
  };

  // ✅ Envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      if (!name.trim() || !price || !type.trim()) {
        toast.error("Completá nombre, precio y tipo.");
        return;
      }
      if (!images.length) {
        toast.error("Agregá al menos una imagen.");
        return;
      }

      const displayName = user?.username || "ChemaSportER";

      // ✅ Asegurar stock completo
      const stockFinal = Object.keys(stock).length
        ? stock
        : Object.fromEntries(tallas.map((t) => [t, 0]));

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", String(price).trim());
      if (discountPrice) formData.append("discountPrice", String(discountPrice).trim());
      formData.append("type", type.trim());
      formData.append("stock", JSON.stringify(stockFinal));
      formData.append("isNew", isNew ? "true" : "false");
      formData.append("isMundial", isMundial ? "true" : "false"); 

      for (let i = 0; i < images.length; i++) {
        const blob = images[i].blob || (await srcToBlob(images[i].src));
        formData.append("images", blob, `product-${i}.webp`);
      }

      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "x-user": displayName },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Error al guardar producto (${res.status}). ${txt || ""}`.trim());
      }

      const data = await res.json();
      onAdd?.(data);
      onCancel?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error guardando el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-6"
      // 🔥 FIX 1: style nativo para obligar al navegador a poner esto por encima del Header sin importar Tailwind
      style={{ zIndex: 99999 }} 
    >
      {/* 🔥 FIX 2: Agregamos mt-16 para empujar la caja blanca un poco hacia abajo y max-h-[85vh] para que no se salga de la pantalla en laptops pequeñas */}
      <div className="relative bg-white p-6 sm:p-8 mt-16 rounded-lg shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
        
        {/* Botón de cerrar bien posicionado arriba a la derecha */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-black hover:text-red-600 transition-colors"
        >
          <FaTimes size={24} />
        </button>

        <h2 className="text-xl font-bold mb-2">Agregar producto</h2>

        <p className="text-sm text-gray-500 mb-6 leading-tight">
          Arrastrá y soltá hasta {MAX_IMAGES} imagen(es) o hacé clic para seleccionar (se convertirán a WebP)
        </p>

        <div className="flex gap-2 justify-center flex-wrap mb-4">
          {images.map((img, i) => (
            <div key={`preview-${i}`} className="relative">
              <img src={img.previewUrl} alt={`preview-${i}`} className="w-24 h-24 object-cover rounded shadow-md border" />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                className="absolute -top-2 -right-2 text-white text-xs rounded-full p-1 shadow-lg bg-red-500 hover:bg-red-600"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>

        {images.length < MAX_IMAGES && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 text-gray-600 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium py-3 rounded-lg w-full text-center transition-colors"
            >
              Seleccionar imagen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="Nombre del producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          />

          <input
            type="text"
            placeholder="Precio normal (Ej. 25000)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          />

          <input
            type="text"
            placeholder="Precio con descuento (opcional)"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black font-semibold"
          >
            {Object.keys({ ...tallaPorTipo, Balón: ["3", "4", "5"], Tacos: [] }).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 mb-6 border bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 text-black border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800">
              Mostrar etiqueta <strong>NUEVO</strong>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isMundial}
              onChange={(e) => setIsMundial(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded"
            />
            <span className="text-sm text-amber-700 font-bold">
              Asignar Colección MUNDIAL 2026
            </span>
          </label>
        </div>

        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Inventario por talla</h3>
        <div className={`grid gap-3 mb-8 ${type === 'Tacos' ? 'grid-cols-3' : 'grid-cols-4 sm:grid-cols-5'}`}>
          {tallas.map((size) => (
            <label key={size} className="text-center flex flex-col justify-end h-full">
              <span className="block mb-1 text-[11px] font-bold text-gray-600 leading-tight flex items-end justify-center">{size}</span>
              <input
                type="number"
                min="0"
                value={stock[size] ?? ""}
                onChange={(e) => handleInvChange(size, e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-center bg-gray-50 focus:border-black focus:bg-white outline-none font-medium"
                inputMode="numeric"
              />
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 fondo-plateado font-bold text-black py-3 rounded-lg hover:brightness-105 shadow-sm transition disabled:opacity-50"
          >
            {loading ? "Agregando..." : "GUARDAR PRODUCTO"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border bg-red-50 font-bold text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}