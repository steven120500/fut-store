import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaShoppingCart, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
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

  // Modales Locales
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState(0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState('');
  const [editedType, setEditedType] = useState('Player');
  const [editedStock, setEditedStock] = useState({});
  const [editedIsNew, setEditedIsNew] = useState(false);
  const [localImages, setLocalImages] = useState([]);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");
  const canSeeHistory = user?.isSuperUser || user?.roles?.includes("edit");

  // 🛠️ REPARADO: Sincronización de datos al cargar
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProduct(data);
        syncEditState(data); // 👈 ESTO ES LO QUE FALTABA
      } catch (err) {
        console.error(err);
        toast.error("Error cargando producto");
      } finally {
        setLoadingFetch(false);
      }
    };
    fetchProduct();
  }, [id]);

  const syncEditState = (data) => {
    setEditedName(data.name || '');
    setEditedPrice(data.price ?? 0);
    setEditedDiscountPrice(data.discountPrice ?? '');
    setEditedType(data.type || 'Player');
    setEditedStock({ ...(data.stock || {}) });
    setEditedIsNew(Boolean(data.isNew));
    
    let imgs = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      imgs = data.images.map(img => (typeof img === 'object' ? img.url : img)).filter(url => url && url.startsWith('http'));
    }
    if (imgs.length === 0 && data.imageSrc && data.imageSrc.startsWith('http')) {
      imgs.push(data.imageSrc);
    }
    setLocalImages(imgs.map(src => ({ src, isNew: false })));
  };

  const handleSave = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const payload = {
        name: editedName.trim(),
        price: parseInt(editedPrice, 10) || 0,
        discountPrice: editedDiscountPrice ? parseInt(editedDiscountPrice, 10) : null,
        type: editedType,
        stock: editedStock,
        images: localImages.map(i => i.src), 
        isNew: editedIsNew,
      };
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user': user?.username || 'Admin' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      const updated = await res.json();
      setProduct(updated);
      syncEditState(updated);
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
      toast.success("Guardado correctamente");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const executeDelete = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user': user?.username || 'Admin' },
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

  if (loadingFetch) return <div className="h-screen flex items-center justify-center font-bold text-xl">Cargando...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Producto no encontrado</div>;

  const currentSrc = localImages[idx]?.src || PLACEHOLDER_IMG;
  const currentType = isEditing ? editedType : product.type;
  const tallasVisibles = currentType === 'Balón' ? TALLAS_BALON : (currentType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);

  return (
    <>
      <TopBanner/>
      
      {showLogin && (
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onLoginSuccess={() => window.location.reload()} 
          onRegisterClick={() => { setShowLogin(false); setTimeout(() => setShowRegisterUserModal(true), 100); }} 
        />
      )}
      {showRegisterUserModal && <RegisterUserModal onClose={() => setShowRegisterUserModal(false)} />}
      {showMedidas && <Medidas open={showMedidas} onClose={() => setShowMedidas(false)} currentType={product.type || "Todos"} />}

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
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition font-medium">
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
                  <button onClick={() => setIdx((i) => (i - 1 + localImages.length) % localImages.length)} className="absolute left-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100"><FaChevronLeft /></button>
                  <button onClick={() => setIdx((i) => (i + 1) % localImages.length)} className="absolute right-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100"><FaChevronRight /></button>
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded tracking-widest">{product.type}</span>
                  {product.isNew && <span className="px-2 py-1 bg-black text-white font-bold text-[10px] uppercase rounded tracking-widest">NUEVO</span>}
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-tight">{product.name}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                {product.discountPrice ? (
                  <>
                    <span className="text-4xl font-light text-red-600">₡{product.discountPrice.toLocaleString()}</span>
                    <span className="text-xl text-gray-400 line-through">₡{product.price.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-4xl font-light">₡{product.price.toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              {product.type === "Player" && (
                <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800 shadow-sm">
                  <FaExclamationTriangle className="flex-shrink-0 text-blue-400" />
                  <p className="text-xs font-bold leading-relaxed">
                    VERSIÓN PLAYER (Slim Fit): Se recomienda elegir una talla más de la habitual para un ajuste cómodo.
                  </p>
                </div>
              )}

              <p className="font-bold text-xs mb-3 uppercase tracking-wide text-gray-500">Selecciona tu talla:</p>
              <div className="flex flex-wrap gap-2">
                {tallasVisibles.map(size => {
                  const qty = (product.stock?.[size] || 0);
                  return (
                    <button
                      key={size}
                      disabled={qty <= 0}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[45px] h-[45px] px-2 border rounded-lg font-bold text-sm transition-all relative
                        ${qty <= 0 ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 line-through text-gray-400' : ''}
                        ${selectedSize === size ? 'bg-black text-white border-black shadow-md transform scale-105' : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'}
                      `}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
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
                  <button onClick={() => setIsEditing(true)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm"><FaEdit /> EDITAR</button>
                  <button onClick={() => setShowConfirmDelete(true)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"><FaTrash /> ELIMINAR</button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Modales de Decisión */}
        <AnimatePresence>
          {showDecisionModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><FaShoppingCart size={30} /></div>
                <h3 className="text-xl font-black italic uppercase mb-2">¡Agregado al carrito!</h3>
                <div className="flex flex-col gap-3">
                  <button onClick={() => navigate('/checkout')} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">FINALIZAR COMPRA</button>
                  <button onClick={() => { setShowDecisionModal(false); navigate('/'); }} className="w-full bg-white text-black border-2 border-black py-3 rounded-xl font-bold hover:bg-gray-50 transition">SEGUIR VIENDO</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer /> 
    </>
  );
}