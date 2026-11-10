import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes, FaPlus, FaCloudUploadAlt, FaSave, FaMapMarkerAlt } from "react-icons/fa";
import ModalShell from "./ModalShell";
import { API_ORIGIN } from "../config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tallaPorTipo from "../utils/tallaPorTipo";

const API_BASE = API_ORIGIN;
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
  
  // 📍 NUEVO: Estado para la ubicación o caja
  const [ubicacion, setUbicacion] = useState("");
  
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
      
      // 📍 NUEVO: Enviar ubicación al backend
      if (ubicacion) formData.append("ubicacion", ubicacion.trim());
      
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
    <ModalShell
      onClose={onCancel}
      title="Agregar producto"
      subtitle={`Hasta ${MAX_IMAGES} imágenes · se convierten a WebP`}
      icon={FaPlus}
      size="lg"
      zIndex={99999}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="fs-btn fs-btn-ghost px-5">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="fs-btn fs-btn-primary flex-1">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FaSave />}
            {loading ? "Guardando…" : "Guardar producto"}
          </button>
        </div>
      }
    >
      <div ref={modalRef} className="space-y-6">
        {/* Imágenes */}
        <section>
          <p className="fs-label">Imágenes</p>
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={`preview-${i}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                <img src={img.previewUrl} alt={`preview-${i}`} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                  {i === 0 ? "Frontal" : "Trasera"}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                  aria-label="Quitar imagen"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
                >
                  <FaTimes size={11} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-700"
              >
                <FaCloudUploadAlt size={26} />
                <span className="text-xs font-bold uppercase tracking-wider">Subir imagen</span>
                <span className="text-[10px] text-zinc-400">{images.length === 0 ? "Frontal" : "Trasera"}</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </section>

        {/* Datos */}
        <section className="space-y-3">
          <div>
            <label className="fs-label">Nombre</label>
            <input type="text" placeholder="Ej: Messi Argentina Local 2026" value={name} onChange={(e) => setName(e.target.value)} className="fs-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="fs-label">Precio normal</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₡</span>
                <input type="text" inputMode="numeric" placeholder="25000" value={price} onChange={(e) => setPrice(e.target.value)} className="fs-input pl-7" />
              </div>
            </div>
            <div>
              <label className="fs-label">Precio oferta</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-400">₡</span>
                <input type="text" inputMode="numeric" placeholder="Opcional" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="fs-input pl-7" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="fs-label">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="fs-input font-semibold">
                {Object.keys({ ...tallaPorTipo, Balón: ["3", "4", "5"], Tacos: [] }).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fs-label">Ubicación / caja</label>
              <div className="relative">
                <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cyan-500" />
                <input type="text" placeholder="Ej: A5 - 3" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} maxLength={100} className="fs-input pl-8" />
              </div>
            </div>
          </div>
        </section>

        {/* Etiquetas */}
        <section className="grid grid-cols-2 gap-2">
          {[
            { checked: isNew, set: setIsNew, label: "Etiqueta NUEVO", sub: "Se muestra en la tarjeta" },
            { checked: isMundial, set: setIsMundial, label: "Mundial 2026", sub: "Colección especial" },
          ].map((t) => (
            <label key={t.label} className={`flex cursor-pointer select-none items-center gap-3 rounded-xl border p-3 transition ${t.checked ? "border-cyan-400 bg-cyan-50/60 ring-2 ring-cyan-400/25" : "border-zinc-200 hover:border-zinc-300"}`}>
              <input type="checkbox" checked={t.checked} onChange={(e) => t.set(e.target.checked)} className="h-4 w-4" />
              <span>
                <span className="block text-xs font-black text-zinc-900">{t.label}</span>
                <span className="block text-[10px] text-zinc-500">{t.sub}</span>
              </span>
            </label>
          ))}
        </section>

        {/* Inventario */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="fs-label mb-0">Inventario por talla</p>
            <span className="text-[10px] font-bold text-zinc-400">
              Total: <span className="text-zinc-900">{Object.values(stock).reduce((a, n) => a + (Number(n) || 0), 0)}</span>
            </span>
          </div>
          <div className={`grid gap-2 ${type === "Tacos" ? "grid-cols-3" : "grid-cols-4 sm:grid-cols-5"}`}>
            {tallas.map((size) => (
              <label key={size} className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 text-center focus-within:border-cyan-400 focus-within:bg-white">
                <span className="mb-1 text-[10px] font-black leading-tight text-zinc-600">{size}</span>
                <input
                  type="number"
                  min="0"
                  value={stock[size] ?? ""}
                  onChange={(e) => handleInvChange(size, e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-full rounded-lg border border-transparent bg-white py-1.5 text-center text-sm font-bold"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}