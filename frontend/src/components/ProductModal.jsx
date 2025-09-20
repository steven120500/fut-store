// src/components/ProductModal.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const API_BASE = 'https://fut-store.onrender.com';

const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const TALLAS_NINO   = ['16', '18', '20', '22', '24', '26', '28'];
const ACCEPTED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/heic'];

const MODAL_IMG_MAX_W = 800;
const THUMB_MAX_W     = 240;

function transformCloudinary(url, maxW) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('res.cloudinary.com')) return url;
    const parts = u.pathname.split('/upload/');
    if (parts.length < 2) return url;
    const transforms = `f_auto,q_auto:eco,c_limit,w_${maxW},dpr_auto`;
    u.pathname = `${parts[0]}/upload/${transforms}/${parts[1]}`;
    return u.toString();
  } catch {
    return url;
  }
}

function isLikelyObjectId(v) {
  return typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
}

export default function ProductModal({
  product,
  onClose,
  onUpdate,
  canEdit,
  canDelete,
  user,
}) {
  const modalRef = useRef(null);

  const [viewProduct, setViewProduct] = useState(product);
  const [isEditing, setIsEditing] = useState(false);

  const [editedStock,  setEditedStock]  = useState(product.stock  || {});
  const [editedName,   setEditedName]   = useState(product?.name || '');
  const [editedPrice,  setEditedPrice]  = useState(product?.price ?? 0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState(
    product?.discountPrice ?? ''
  );
  const [editedType,   setEditedType]   = useState(product?.type || 'Player');
  const [loading,      setLoading]      = useState(false);

  const galleryFromProduct = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images
        .map(i => (typeof i === 'string' ? i : i?.url))
        .filter(Boolean);
    }
    return [product?.imageSrc, product?.imageSrc2].filter(Boolean);
  }, [product]);

  const [localImages, setLocalImages] = useState(
    galleryFromProduct.map(src => ({ src, isNew: false }))
  );

  const [idx, setIdx] = useState(0);
  const hasMany = localImages.length > 1;
  const currentSrc = localImages[idx]?.src || '';

  useEffect(() => {
    setViewProduct(product);
    setEditedName(product?.name || '');
    setEditedPrice(product?.price ?? 0);
    setEditedDiscountPrice(product?.discountPrice ?? '');
    setEditedType(product?.type || 'Player');
    setEditedStock({ ...(product?.stock  || {}) });
    setLocalImages(
      product?.images?.length
        ? product.images.map(img => ({ src: typeof img === 'string' ? img : img.url, isNew: false }))
        : [
            ...(product?.imageSrc  ? [{ src: product.imageSrc,  isNew: false }] : []),
            ...(product?.imageSrc2 ? [{ src: product.imageSrc2, isNew: false }] : []),
          ]
    );
    setIdx(0);
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleSave = async () => {
    if (loading) return;

    const id = product?._id || product?.id;
    if (!id || !isLikelyObjectId(id)) {
      toast.error('ID inválido');
      return;
    }

    try {
      setLoading(true);
      const displayName = user?.username || user?.email || 'FutStore';

      const priceInt = Math.max(0, parseInt(editedPrice, 10) || 0);

      // 👇 Nueva lógica: no guardar 0 ni vacío
      let discountInt = null;
      if (editedDiscountPrice !== '' && !isNaN(Number(editedDiscountPrice))) {
        const val = parseInt(editedDiscountPrice, 10);
        if (val > 0) discountInt = val;
      }

      const clean = (obj) =>
        Object.fromEntries(
          Object.entries(obj || {}).map(([k, v]) => [k, Math.max(0, parseInt(v, 10) || 0)])
        );

      const payload = {
        name: (editedName || '').trim(),
        price: priceInt,
        discountPrice: discountInt,
        type: (editedType || '').trim(),
        stock:  clean(editedStock),
        images: localImages.map(i => i?.src).filter(Boolean),
        imageSrc:  localImages[0]?.src || null,
        imageSrc2: localImages[1]?.src || null,
        imageAlt: (editedName || '').trim(),
      };

      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user': displayName,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const updated = await res.json();
      setViewProduct(updated);
      setEditedName(updated.name || '');
      setEditedPrice(updated.price ?? 0);
      setEditedDiscountPrice(updated.discountPrice ?? '');
      setEditedType(updated.type || 'Player');
      setEditedStock({ ...(updated.stock  || {}) });
      setLocalImages(
        updated?.images?.length
          ? updated.images.map(img => ({ src: typeof img === 'string' ? img : img.url, isNew: false }))
          : []
      );
      setIdx(0);

      onUpdate?.(updated);
      setIsEditing(false);
      
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    const id = product?._id || product?.id;
    if (!id || !isLikelyObjectId(id)) {
      toast.error('ID inválido');
      return;
    }
    try {
      setLoading(true);
      const displayName = user?.username || 'FutStore';
      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onUpdate?.(null, id);
      onClose?.();
    } catch {
      toast.error('No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (size, value) => {
    setEditedStock(prev => ({ ...prev, [size]: parseInt(value, 10) || 0 }));
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato no soportado');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImages(prev => {
        const copy = prev.slice();
        if (index >= copy.length) copy.push({ src: reader.result, isNew: true });
        else copy[index] = { src: reader.result, isNew: true };
        return copy;
      });
      setIdx(index);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    setLocalImages(prev => {
      const copy = prev.slice();
      copy.splice(index, 1);
      return copy;
    });
    setIdx(0);
  };

  const isNino = (isEditing ? editedType : viewProduct?.type) === 'Niño';
  const tallasVisibles = isNino ? TALLAS_NINO : TALLAS_ADULTO;
  const displayUrl = currentSrc ? transformCloudinary(currentSrc, MODAL_IMG_MAX_W) : '';

  return (
    <div className="mt-10 mb-16 fixed inset-0 z-50 bg-black/40 flex items-center justify-center py-6">
      <div
        ref={modalRef}
        className="relative bg-white p-6 rounded-lg shadow-md max-w-md w-full max-h-screen overflow-y-auto"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute mr-2 top-12 right-2 text-white bg-black rounded p-1"
          style={{ backgroundColor: "#d4af37", color: "#000" }}
          title="Cerrar"
        >
          <FaTimes size={30} />
        </button>

        {/* Encabezado */}
        <div className="mt-16 mb-2 text-left">
          {isEditing && canEdit ? (
            <>
              <label className="text-sm text-gray-500">Tipo</label>
              <select
                value={editedType}
                onChange={(e) => setEditedType(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-3"
              >
                {['Player','Fan','Mujer','Nacional','Abrigos','Retro','Niño'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className="text-sm text-gray-500">Nombre</label>
              <input
                type="text"
                className="w-full border px-2 py-1 mb-3"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />

              <label className="text-sm text-gray-500">Precio normal</label>
              <input
                type="number"
                className="w-full border px-2 py-1 mb-3"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
              />

              <label className="text-sm text-gray-500">Precio descuento (opcional)</label>
              <input
                type="number"
                className="w-full border px-2 py-1 mb-3"
                value={editedDiscountPrice}
                onChange={(e) => setEditedDiscountPrice(e.target.value)}
                placeholder="Dejar vacío si no tiene"
              />
            </>
          ) : (
            <>
              <span className="block text-xs uppercase text-gray-500">{viewProduct?.type}</span>
              <h2 className="text-xl font-extrabold" style={{ color: '#d4af37' }}>
                {viewProduct?.name}
              </h2>
            </>
          )}
        </div>

        {/* Imagen */}
        {!isEditing ? (
          <div className="relative mb-4 flex items-center justify-center">
            {displayUrl ? (
              <img src={displayUrl} alt={viewProduct?.name} className="rounded max-h-[400px] object-contain"/>
            ) : <div className="h-[300px] grid place-items-center">Sin imagen</div>}
            {hasMany && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + localImages.length) % localImages.length)}
                  className="absolute left-0 px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#d4af37" }}>
                  <FaChevronLeft/>
                </button>
                <button onClick={() => setIdx(i => (i + 1) % localImages.length)}
                  className="absolute right-0 px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#d4af37" }}>
                  <FaChevronRight/>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap mb-4">
            {localImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.src} alt="" className="h-48 object-contain"/>
                <button onClick={() => handleImageRemove(i)}
                  className="absolute top-0 right-0 bg-black text-white rounded-full p-1">
                  <FaTimes />
                </button>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, i)} />
              </div>
            ))}
            {localImages.length < 2 && (
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, localImages.length)} />
            )}
          </div>
        )}

        {/* Precio */}
        {!isEditing && (
          <div className="mt-2 text-right">
            {viewProduct?.discountPrice ? (
              <>
                <p className="text-sm text-gray-500 line-through">
                  ₡{Number(viewProduct?.price).toLocaleString('de-DE')}
                </p>
                <p className="text-lg font-bold text-red-600">
                  ₡{Number(viewProduct?.discountPrice).toLocaleString('de-DE')}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold">
                ₡{Number(viewProduct?.price).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        )}

        {/* Stock */}
        <div className="mt-4">
          <p className="font-semibold mb-2">Stock por talla:</p>
          {tallasVisibles.map((talla) => (
            <div key={talla} className="flex justify-between items-center border rounded px-2 py-1 mb-1 text-[#d4af37]">
              <span>{talla}</span>
              {isEditing ? (
                <input type="number" min="0" className="w-16 border text-center"
                  value={editedStock[talla] ?? ''} onChange={(e) => handleStockChange(talla, e.target.value)} />
              ) : (
                <span>{viewProduct?.stock?.[talla] || 0}</span>
              )}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {canEdit && isEditing ? (
            <button className="col-span-2 bg-green-600 text-white py-2 rounded" onClick={handleSave}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          ) : canEdit && (
            <button className="bg-blue-600 text-white py-2 rounded" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
          {canDelete && (
            <button className="bg-red-600 text-white py-2 rounded" onClick={handleDelete}>
              Eliminar
            </button>
          )}
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/50672327096?text=${encodeURIComponent(
            `¡Hola! Me interesa la camiseta ${product?.name} ${product?.type}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block bg-green-600 text-white py-2 rounded text-center font-bold"
        >
          <FaWhatsapp className="inline mr-2" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}