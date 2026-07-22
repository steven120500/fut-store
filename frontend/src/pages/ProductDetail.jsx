import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaShoppingCart, FaArrowLeft, FaExclamationTriangle, FaCashRegister, FaUser, FaIdCard, FaPhone, FaMoneyBillWave } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from '../context/CartContext';

// Componentes
import Header from '../components/Header'; 
import TopBanner from '../components/TopBanner'; 
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal'; 
import RegisterUserModal from '../components/RegisterUserModal'; 
import Medidas from '../components/Medidas';

const API_BASE = "https://fut-store.onrender.com";
const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const TALLAS_NINO   = ['16', '18', '20', '22', '24', '26', '28'];
const TALLAS_BALON  = ['3', '4', '5'];
const ACCEPTED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/heic'];
const PLACEHOLDER_IMG = "https://via.placeholder.com/600x600?text=No+Image";

export default function ProductDetail({ 
  user, 
  onUpdate,
  onLogout,
  setShowUserListModal,
  setShowHistoryModal
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [idx, setIdx] = useState(0); 
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // Estados para Modales Locales
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false); 

  // 🏆 ESTADOS ACTUALIZADOS PARA REGISTRO DE VENTAS
  const [isRegisteringSale, setIsRegisteringSale] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false); 
  const [saleForm, setSaleForm] = useState({
    cedula: '',
    nombre: '',
    numero: '',
    totalPago: 0,
    costoEnvio: 0, 
    tallaVendida: '',
    cantidadVendida: 1
  });

  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState(0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState('');
  const [editedType, setEditedType] = useState('Player');
  const [editedStock, setEditedStock] = useState({});
  const [editedIsNew, setEditedIsNew] = useState(false);
  const [editedIsMundial, setEditedIsMundial] = useState(false); 
  const [localImages, setLocalImages] = useState([]);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");
  const canSeeHistory = user?.isSuperUser || user?.roles?.includes("edit");
  
  const displayName = user?.username || user?.email || 'Admin';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProduct(data);
        syncEditState(data);
      } catch (err) {
        console.error(err);
        toast.error("Error cargando producto");
      } finally {
        setLoadingFetch(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const handleUnload = () => {
      if (isEditing) {
        navigator.sendBeacon(`${API_BASE}/api/products/${id}/unlock`);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (isEditing) unlockProduct(); 
    };
  }, [isEditing, id]);

  // 🇨🇷 EFECTO PARA BUSCAR CÉDULA AUTOMÁTICAMENTE EN COSTA RICA (TSE)
  useEffect(() => {
    const checkCedulaTSE = async () => {
      const cleanCedula = saleForm.cedula.replace(/\D/g, '');
      if (cleanCedula.length === 9) {
        setLoadingCedula(true);
        try {
          const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanCedula}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.nombre) {
              setSaleForm(prev => ({ ...prev, nombre: data.nombre }));
              toast.success("Cliente encontrado en el registro");
            }
          }
        } catch (error) {
          console.error("No se pudo obtener el nombre de la cédula:", error);
        } finally {
          setLoadingCedula(false);
        }
      }
    };
    
    checkCedulaTSE();
  }, [saleForm.cedula]);

  const syncEditState = (data) => {
    setEditedName(data.name || '');
    setEditedPrice(data.price ?? 0);
    setEditedDiscountPrice(data.discountPrice ?? '');
    setEditedType(data.type || 'Player');
    setEditedStock({ ...(data.stock || {}) });
    setEditedIsNew(Boolean(data.isNew));
    setEditedIsMundial(Boolean(data.isMundial)); 
    
    setSaleForm(prev => ({
      ...prev,
      totalPago: data.discountPrice || data.price || 0,
      costoEnvio: 0,
      tallaVendida: selectedSize || 'L',
      cantidadVendida: 1
    }));
    
    let imgs = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      imgs = data.images.map(img => (typeof img === 'object' ? img.url : img)).filter(url => url && url.startsWith('http'));
    }
    if (imgs.length === 0 && data.imageSrc && data.imageSrc.startsWith('http')) {
      imgs.push(data.imageSrc);
      if (data.imageSrc2 && data.imageSrc2.startsWith('http')) imgs.push(data.imageSrc2);
    }
    if (imgs.length === 0) imgs.push(PLACEHOLDER_IMG);
    setLocalImages(imgs.map(src => ({ src, isNew: false })));
  };

  const lockProduct = async () => {
    if (!id) return false;
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user": displayName },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`🔒 ${data.lockedBy || 'Alguien'} ya está editando este producto.`);
        setLoadingAction(false);
        return false;
      }
      setLoadingAction(false);
      return true;
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
      setLoadingAction(false);
      return false;
    }
  };

  const unlockProduct = async () => {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/api/products/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user": displayName },
      });
    } catch (error) {
      console.error("Error desbloqueando el producto", error);
    }
  };

  const handleEditClick = async () => {
    const hasLock = await lockProduct();
    if (hasLock) {
      setIsEditing(true);
    }
  };

  const handleCancelEditClick = () => {
    setIsEditing(false);
    setIsRegisteringSale(false);
    unlockProduct();
    if (product) syncEditState(product);
  };

  const getInventoryChanges = () => {
    const changes = [];
    const tallas = editedType === 'Balón' ? TALLAS_BALON : (editedType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);
    tallas.forEach((size) => {
      const oldStock = parseInt(product?.stock?.[size] ?? 0, 10);
      const newStock = parseInt(editedStock?.[size] ?? 0, 10);
      if (oldStock !== newStock) {
        changes.push(`Stock [${size}]: ${oldStock} ➔ ${newStock}`);
      }
    });
    return changes;
  };

  // 🏆 ESCÁNER MULTI-TALLA: Detecta si restaste 1 talla, o varias diferentes (Ej: 1 XL y 1 M)
  const handleOpenSaleForm = () => {
    let detectedSizes = [];
    let totalQty = 0;

    if (product && editedStock) {
      const tallas = editedType === 'Balón' ? TALLAS_BALON : (editedType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);
      for (const t of tallas) {
        const oldQty = parseInt(product?.stock?.[t] ?? 0, 10);
        const newQty = parseInt(editedStock?.[t] ?? 0, 10);
        if (oldQty > newQty) {
          const diff = oldQty - newQty;
          detectedSizes.push(`${t} (${diff})`);
          totalQty += diff; 
        }
      }
    }

    let finalSizeStr = selectedSize || 'L';
    let finalQty = 1;

    if (detectedSizes.length === 1) {
      // Solo 1 talla modificada (ej: 2 chemas talla XL)
      finalSizeStr = detectedSizes[0].split(' ')[0];
      finalQty = totalQty;
    } else if (detectedSizes.length > 1) {
      // Múltiples tallas modificadas (ej: 1 XL y 1 M)
      finalSizeStr = detectedSizes.join(', ');
      finalQty = totalQty;
    }

    const precioBase = product?.discountPrice || product?.price || 0;

    setSaleForm(prev => ({
      ...prev,
      tallaVendida: finalSizeStr,
      cantidadVendida: finalQty,
      totalPago: precioBase * finalQty
    }));

    setIsRegisteringSale(true);
  };

  const handleQuantityChange = (val) => {
    const newQty = Math.max(1, parseInt(val, 10) || 1);
    const precioBase = product?.discountPrice || product?.price || 0;
    setSaleForm(prev => ({
      ...prev,
      cantidadVendida: newQty,
      totalPago: precioBase * newQty
    }));
  };

  const handleSave = async (overrideStock = null) => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const stockToUse = overrideStock || editedStock;
      const cleanStock = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.max(0, parseInt(v, 10) || 0)]));
      const payload = {
        name: editedName.trim(),
        price: parseInt(editedPrice, 10) || 0,
        discountPrice: editedDiscountPrice ? parseInt(editedDiscountPrice, 10) : null,
        type: editedType,
        stock: cleanStock(stockToUse),
        images: localImages.map(i => i.src), 
        isNew: editedIsNew,
        isMundial: editedIsMundial, 
      };
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(`Producto bloqueado por ${errorData.lockedBy || 'otro usuario'}`);
        }
        throw new Error("Error al actualizar");
      }
      const updated = await res.json();
      setProduct(updated);
      syncEditState(updated);
      setIsEditing(false);
      setShowConfirmSave(false);
      setIsRegisteringSale(false);
      if (onUpdate) onUpdate(updated);
      toast.success("Guardado correctamente");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegisterSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleForm.cedula || !saleForm.nombre || !saleForm.numero) {
      return toast.warning("Por favor completa los datos del cliente.");
    }

    const subtotalPrenda = Number(saleForm.totalPago) || 0;
    const montoEnvio = Number(saleForm.costoEnvio) || 0;
    const granTotal = subtotalPrenda + montoEnvio;
    const cant = Number(saleForm.cantidadVendida) || 1;
    const talla = saleForm.tallaVendida;

    setLoadingAction(true);
    try {
      const salePayload = {
        cedula: saleForm.cedula,
        nombre: saleForm.nombre,
        numero: saleForm.numero,
        totalPago: subtotalPrenda,
        costoEnvio: montoEnvio,    
        montoTotal: granTotal,     
        tallaVendida: talla,
        cantidad: cant,
        productoId: id,
        productoNombre: editedName,
        vendedor: displayName,
        fecha: new Date().toISOString()
      };

      await fetch(`${API_BASE}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify(salePayload),
      });

      let finalStock = { ...editedStock };
      const oldStockSize = parseInt(product?.stock?.[talla] ?? 0, 10);
      const currentEditedStockSize = parseInt(editedStock?.[talla] ?? 0, 10);

      // Si no restaron el stock en los cuadritos y es una sola talla normal, lo rebajamos automáticamente
      if (tallasVisibles.includes(talla) && oldStockSize === currentEditedStockSize) {
        finalStock[talla] = Math.max(0, currentEditedStockSize - cant);
        setEditedStock(finalStock);
      }

      await handleSave(finalStock);
      toast.success(`💰 Venta registrada con éxito por ${displayName}`);
    } catch (err) {
      toast.error("Error al registrar la venta");
      setLoadingAction(false);
    }
  };

  const executeDelete = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Producto eliminado");
      if (onUpdate) onUpdate(null, id);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setShowConfirmDelete(false);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return toast.error("Formato inválido");
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImages(prev => {
        const copy = [...prev];
        if (copy.length === 1 && copy[0].src === PLACEHOLDER_IMG) {
           return [{ src: reader.result, isNew: true }];
        }
        if (index >= copy.length) copy.push({ src: reader.result, isNew: true });
        else copy[index] = { src: reader.result, isNew: true };
        return copy;
      });
      setIdx(index);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    const newImages = localImages.filter((_, i) => i !== index);
    if (newImages.length === 0) newImages.push({ src: PLACEHOLDER_IMG, isNew: false });
    setLocalImages(newImages);
    setIdx(0);
  };

  const handleBuyWhatsApp = () => {
    if (!selectedSize) return toast.warning("Por favor, selecciona una talla.");
    const precioFinal = product.discountPrice || product.price;
    const currentUrl = window.location.href; 
    let mensaje = `👋 Hola, me interesa esta camiseta:\n\n*Modelo:* ${product.name}\n*Versión:* ${product.type}\n*Talla:* ${selectedSize}\n*Precio:* ₡${precioFinal.toLocaleString()}\n*Link:* ${currentUrl}\n\n¿Está disponible? Quedo atento. ✅`;
    window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleAddToCart = () => {
    if (!selectedSize) return toast.warning("Selecciona una talla primero");
    addToCart(product, selectedSize);
    setShowDecisionModal(true);
  };

  if (loadingFetch) return <div className="h-screen flex items-center justify-center font-bold text-xl text-black">Cargando...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center text-black">Producto no encontrado</div>;

  const currentSrc = localImages[idx]?.src || PLACEHOLDER_IMG;
  const currentType = isEditing ? editedType : product.type;
  const tallasVisibles = currentType === 'Balón' ? TALLAS_BALON : (currentType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);
  const stockRestante = selectedSize ? (isEditing ? editedStock[selectedSize] : product.stock?.[selectedSize]) : 0;
  const inventoryChanges = getInventoryChanges();

  const subTotalChema = Number(saleForm.totalPago) || 0;
  const costoDeEnvio = Number(saleForm.costoEnvio) || 0;
  const totalConEnvio = subTotalChema + costoDeEnvio;

  return (
    <>
      <TopBanner/>
      
      {showLogin && (
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onLoginSuccess={() => window.location.reload()} 
          onRegisterClick={() => {
            setShowLogin(false);
            setTimeout(() => setShowRegisterUserModal(true), 100);
          }} 
        />
      )}
      {showRegisterUserModal && (
        <RegisterUserModal onClose={() => setShowRegisterUserModal(false)} />
      )}
      {showMedidas && (
        <Medidas 
          open={showMedidas} 
          onClose={() => setShowMedidas(false)} 
          currentType={product.type || "Todos"} 
        />
      )}

      <Header 
        user={user}
        onLoginClick={() => setShowLogin(true)} 
        onLogout={onLogout}
        isSuperUser={isSuperUser}
        canSeeHistory={canSeeHistory}
        setShowRegisterUserModal={setShowRegisterUserModal}
        setShowUserListModal={setShowUserListModal}
        setShowHistoryModal={setShowHistoryModal}
        onMedidasClick={() => setShowMedidas(true)}
        onLogoClick={() => navigate('/')}
      /> 

      <div className="min-h-screen bg-white pt-36 sm:pt-56 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        <button onClick={() => { if (isEditing) unlockProduct(); navigate(-1); }} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition font-medium">
          <FaArrowLeft /> Volver al catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FOTOS */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center shadow-sm group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSrc}
                  src={currentSrc}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMG; e.target.onerror = null; }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full h-full object-contain p-2"
                />
              </AnimatePresence>
              {!isEditing && localImages.length > 1 && (
                <>
                  <button onClick={() => setIdx((i) => (i - 1 + localImages.length) % localImages.length)} className="absolute left-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100 text-black"><FaChevronLeft /></button>
                  <button onClick={() => setIdx((i) => (i + 1) % localImages.length)} className="absolute right-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100 text-black"><FaChevronRight /></button>
                </>
              )}
            </div>
            {localImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {localImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img.src} onClick={() => setIdx(i)} onError={(e) => e.target.src = PLACEHOLDER_IMG}
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${idx === i ? 'border-black' : 'border-gray-100'}`} 
                    />
                    {isEditing && <button onClick={() => handleImageRemove(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"><FaTimes /></button>}
                  </div>
                ))}
              </div>
            )}
            {isEditing && localImages.length < 5 && (
              <div className="mt-2">
                  <label className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-black text-gray-500 hover:text-black transition gap-2">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, localImages.length)} />
                    <span className="text-sm font-bold">+ AÑADIR FOTO</span>
                  </label>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col">
            {isEditing ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4 text-black">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FaEdit/> Editando Producto</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500">NOMBRE</label>
                          <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full border p-2 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500">TIPO</label>
                              <select value={editedType} onChange={e => setEditedType(e.target.value)} className="w-full border p-2 rounded">
                                  {['Player','Fan','Mujer','Nacional','Abrigos','Retro','Niño','Balón'].map(t => <option key={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500">OPCIONES</label>
                              <div className="flex flex-col gap-2 mt-1">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input type="checkbox" checked={editedIsNew} onChange={e => setEditedIsNew(e.target.checked)} />
                                      <span className="text-xs">¿Etiqueta Nuevo?</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer select-none text-amber-700 font-bold">
                                      <input type="checkbox" checked={editedIsMundial} onChange={e => setEditedIsMundial(e.target.checked)} />
                                      <span className="text-xs">¿Colección Mundial 2026?</span>
                                  </label>
                              </div>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500">PRECIO</label>
                              <input type="number" value={editedPrice} onChange={e => setEditedPrice(e.target.value)} className="w-full border p-2 rounded" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500">OFERTA (Opcional)</label>
                              <input type="number" value={editedDiscountPrice} onChange={e => setEditedDiscountPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="0" />
                          </div>
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-xs font-bold mb-2 uppercase text-center">Inventario por Talla</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {tallasVisibles.map(t => (
                        <div key={t} className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-500 font-bold">{t}</span>
                          <input type="number" className="w-full border text-center p-1 rounded text-sm focus:border-black outline-none" 
                                value={editedStock[t] ?? 0} 
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setEditedStock(prev => ({ ...prev, [t]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button onClick={() => { setIsRegisteringSale(false); setShowConfirmSave(true); }} disabled={loadingAction} className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
                        {loadingAction ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                    </button>
                    <button onClick={handleCancelEditClick} disabled={loadingAction} className="px-4 border border-gray-300 text-red-500 rounded-lg font-bold hover:bg-gray-800">CANCELAR</button>
                  </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded tracking-widest">{product.type}</span>
                      {product.isNew && <span className="px-2 py-1 bg-black text-white font-bold text-[10px] uppercase rounded tracking-widest">NUEVO</span>}
                      {product.isMundial && <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] uppercase rounded tracking-widest shadow">MUNDIAL 2026</span>}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-tight text-black">{product.name}</h1>
                  <div className="mt-4 flex items-baseline gap-3">
                    {product.discountPrice ? (
                      <>
                        <span className="text-4xl font-light text-red-600">₡{product.discountPrice.toLocaleString()}</span>
                        <span className="text-xl text-gray-400 line-through">₡{product.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-light text-black">₡{product.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {product.type === "Player" && (
                    <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800 shadow-sm">
                      <FaExclamationTriangle className="flex-shrink-0 text-blue-400" />
                      <p className="text-xs font-bold leading-relaxed">
                        VERSIÓN PLAYER (Corte Ajustado): Se recomienda elegir una talla más de la habitual para un ajuste óptimo.
                      </p>
                    </div>
                  )}

                  <p className="font-bold text-xs mb-3 uppercase tracking-wide text-gray-500">Selecciona tu talla:</p>
                  <div className="flex flex-wrap gap-2">
                    {tallasVisibles.map(size => {
                      const qty = product.stock?.[size] || 0;
                      return (
                        <button
                          key={size}
                          disabled={qty <= 0}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[45px] h-[45px] px-2 border rounded-lg font-bold text-sm transition-all relative
                            ${qty <= 0 ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 line-through text-gray-400' : ''}
                            ${selectedSize === size ? 'bg-black text-white border-black shadow-md transform scale-105' : 'bg-white border-gray-200 text-black hover:border-black hover:shadow-sm'}
                          `}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                  <AnimatePresence>
                    {selectedSize && stockRestante > 0 && stockRestante < 15 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-100">
                        <p className="font-bold text-xs">¡Date prisa! Solo quedan pocas unidades en talla {selectedSize}.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={handleAddToCart} className="w-full bg-black text-white py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]">
                    <FaShoppingCart /> AÑADIR AL CARRITO
                  </button>
                  <button onClick={handleBuyWhatsApp} className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-lg hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-3 active:scale-[0.98]">
                    <FaWhatsapp size={26} /> COMPRAR DIRECTO
                  </button>
                </div>

                {(isSuperUser || canDelete) && (
                  <div className="mt-12 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center tracking-widest">Zona Administrativa</p>
                    <div className="flex gap-3">
                      {isSuperUser && <button onClick={handleEditClick} disabled={loadingAction} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm"><FaEdit /> EDITAR / VENTAS</button>}
                      {canDelete && <button onClick={() => setShowConfirmDelete(true)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"><FaTrash /> ELIMINAR</button>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* MODAL DECISIÓN */}
        <AnimatePresence>
          {showDecisionModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-black">
                  <FaShoppingCart size={30} />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-2 text-black">¡Agregado al carrito!</h3>
                <p className="text-gray-500 text-sm mb-6">¿Qué te gustaría hacer ahora?</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate('/checkout')} 
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                  >
                    FINALIZAR COMPRA
                  </button>
                  <button 
                    onClick={() => { setShowDecisionModal(false); navigate('/'); }} 
                    className="w-full bg-white text-black border-2 border-black py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                  >
                    SEGUIR VIENDO
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🏆 MODAL DE CONFIRMACIÓN ALINEADO Y CON ESCÁNER MULTI-TALLA */}
        <AnimatePresence>
          {showConfirmSave && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full text-center text-black overflow-hidden">
                
                {!isRegisteringSale ? (
                  <>
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-black"><FaEdit size={24} /></div>
                    <h3 className="text-lg font-black uppercase mb-2">¿Cómo deseas guardar?</h3>
                    
                    {inventoryChanges.length > 0 ? (
                      <div className="text-left bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4 text-xs font-mono text-gray-700 max-h-28 overflow-y-auto shadow-inner">
                        {inventoryChanges.map((change, i) => (<div key={i} className="py-1">{change}</div>))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mb-4 font-medium">Se actualizarán los datos del producto o inventario.</p>
                    )}

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleOpenSaleForm} 
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
                      >
                        <FaCashRegister size={18} /> VENTA
                      </button>

                      <button 
                        onClick={() => handleSave()} 
                        disabled={loadingAction}
                        className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition"
                      >
                        {loadingAction ? '...' : 'SOLO ACTUALIZAR'}
                      </button>

                      <button 
                        onClick={() => setShowConfirmSave(false)} 
                        className="w-full py-2 border border-gray-200 rounded-xl font-bold text-xs text-red-500 hover:text-red-500 hover:bg-gray-800 mt-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  /* 💰 FORMULARIO CON ALINEACIÓN PERFECTA (GRID 12 COLUMNAS + ITEMS-END) */
                  <form onSubmit={handleRegisterSaleSubmit} className="text-left space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                      <h3 className="font-black uppercase text-sm flex items-center gap-2 text-green-700">
                        <FaCashRegister /> Registrar Venta
                      </h3>
                      <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">
                        POR: {displayName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cédula Cliente *</label>
                        <div className="relative">
                          <input type="text" required value={saleForm.cedula} onChange={e => setSaleForm({...saleForm, cedula: e.target.value})} placeholder="Ej: 101110111" className="w-full border p-2 rounded-lg text-xs font-mono focus:border-black outline-none pl-7 h-9.5" />
                          <FaIdCard className="absolute left-2.5 top-3 text-gray-400 text-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Teléfono *</label>
                        <div className="relative">
                          <input type="tel" required value={saleForm.numero} onChange={e => setSaleForm({...saleForm, numero: e.target.value})} placeholder="88888888" className="w-full border p-2 rounded-lg text-xs font-mono focus:border-black outline-none pl-7 h-9.5" />
                          <FaPhone className="absolute left-2.5 top-3 text-gray-400 text-xs" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre del Cliente *</label>
                        {loadingCedula && <span className="text-[9px] font-bold text-amber-600 animate-pulse">Buscando...</span>}
                      </div>
                      <div className="relative">
                        <input type="text" required value={saleForm.nombre} onChange={e => setSaleForm({...saleForm, nombre: e.target.value})} placeholder={loadingCedula ? "Autocompletando..." : "Nombre completo"} className="w-full border p-2 rounded-lg text-xs focus:border-black outline-none pl-7 font-bold h-9.5" />
                        <FaUser className="absolute left-2.5 top-3 text-gray-400 text-xs" />
                      </div>
                    </div>

                    {/* 🏆 FILA ALINEADA QUIRÚRGICAMENTE AL FONDO */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      
                      {/* TALLA (Ancho: 4 columnas) */}
                      <div className="col-span-4">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 truncate">Talla *</label>
                        <select value={saleForm.tallaVendida} onChange={e => setSaleForm({...saleForm, tallaVendida: e.target.value})} className="w-full border p-2 rounded-lg text-xs font-bold focus:border-black outline-none bg-gray-50 h-9.5">
                          {!tallasVisibles.includes(saleForm.tallaVendida) && (
                            <option value={saleForm.tallaVendida}>{saleForm.tallaVendida}</option>
                          )}
                          {tallasVisibles.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="Varias Tallas">Varias Tallas</option>
                        </select>
                      </div>

                      {/* CANTIDAD (Ancho: 2 columnas) */}
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 text-center truncate">Cant.</label>
                        <input type="number" min="1" required value={saleForm.cantidadVendida} onChange={e => handleQuantityChange(e.target.value)} className="w-full border p-2 rounded-lg text-xs font-black text-center text-black focus:border-black outline-none bg-amber-50 h-9.5" />
                      </div>

                      {/* CHEMAS (Ancho: 3 columnas) */}
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 truncate">Chemas (₡)</label>
                        <input type="number" required value={saleForm.totalPago} onChange={e => setSaleForm({...saleForm, totalPago: e.target.value})} className="w-full border p-2 rounded-lg text-xs font-bold text-gray-800 focus:border-black outline-none h-9.5 px-1" />
                      </div>

                      {/* ENVÍO (Ancho: 3 columnas) */}
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 truncate">+ Envío (₡)</label>
                        <input type="number" required value={saleForm.costoEnvio} onChange={e => setSaleForm({...saleForm, costoEnvio: e.target.value})} placeholder="0" className="w-full border p-2 rounded-lg text-xs font-bold text-blue-600 focus:border-black outline-none h-9.5 px-1" />
                      </div>

                    </div>

                    {/* 🏆 CUADRO DE RESUMEN FINAL AUTOMÁTICO */}
                    <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl flex justify-between items-center text-xs mt-2">
                      <span className="font-bold text-green-800 flex items-center gap-1.5">
                        <FaMoneyBillWave /> TOTAL GENERAL:
                      </span>
                      <span className="font-black text-green-700 text-sm">
                        ₡{totalConEnvio.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t mt-3">
                      <button type="button" onClick={() => setIsRegisteringSale(false)} className="w-1/3 py-2.5 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">Atrás</button>
                      <button type="submit" disabled={loadingAction || loadingCedula} className="w-2/3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs shadow-md transition">
                        {loadingAction ? 'Guardando...' : 'CONFIRMAR VENTA '}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showConfirmDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><FaTrash size={24} /></div>
                <h3 className="text-lg font-bold mb-2 text-black">¿Eliminar producto?</h3>
                <p className="text-gray-500 text-xs mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 border rounded-lg font-bold text-sm text-black">Cancelar</button>
                  <button onClick={executeDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">{loadingAction ? '...' : 'Eliminar'}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}