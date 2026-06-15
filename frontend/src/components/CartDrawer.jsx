import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FaTimes, FaTrash, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify'; // 🏆 Importamos toast para las alertas

const API_BASE = "https://fut-store.onrender.com"; // Conexión a tu backend

export default function CartDrawer() {
  const { cart, removeFromCart, isCartOpen, toggleCart, cartTotal } = useCart();
  const [isValidating, setIsValidating] = useState(false); // 🏆 Estado para proteger el botón mientras revisa el stock

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsValidating(true); // Bloqueamos el botón para que no hagan doble click

    try {
      // 🛡️ VALIDACIÓN EN TIEMPO REAL: Revisamos el stock en tu base de datos antes de dejarlo avanzar
      for (const item of cart) {
        const res = await fetch(`${API_BASE}/api/products/${item._id || item.id}`);
        
        if (!res.ok) throw new Error("Error al consultar el producto");
        
        const dbProduct = await res.json();
        
        // Buscamos la talla exacta ignorando mayúsculas/minúsculas para evitar errores
        const cleanSize = item.selectedSize.trim().toLowerCase();
        const claveReal = Object.keys(dbProduct.stock || {}).find(k => k.trim().toLowerCase() === cleanSize);
        const stockDisponible = claveReal ? Number(dbProduct.stock[claveReal]) : 0;

        // Si la persona pide más camisas de las que realmente te quedan en la tienda física:
        if (stockDisponible < item.quantity) {
          toast.error(`¡Ups! Ya no nos queda stock de "${item.name}" en talla ${item.selectedSize}.`);
          setIsValidating(false);
          return; // 🛑 DETIENE LA COMPRA AQUÍ MISMO
        }
      }

      // ✅ SI PASA LA VALIDACIÓN (Hay stock de todo), armamos el mensaje y lo mandamos a WhatsApp
      let mensaje = "👋 *¡Hola! Quiero realizar el siguiente pedido:*\n\n";
      cart.forEach((item) => {
        const price = item.discountPrice || item.price;
        mensaje += `▪️ ${item.quantity}x ${item.name} (Talla: ${item.selectedSize}) - ₡${(price * item.quantity).toLocaleString()}\n`;
      });
      mensaje += `\n💰 *TOTAL: ₡${cartTotal.toLocaleString()}*`;
      
      window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');

    } catch (error) {
      console.error("Error validando el stock:", error);
      toast.error("Hubo un problema al verificar el inventario. Intenta de nuevo.");
    } finally {
      setIsValidating(false); // Liberamos el botón
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Fondo oscuro (Overlay) */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
            onClick={toggleCart}
          />
          
          {/* Panel del Carrito */}
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            {/* Header del Carrito */}
            <div className="p-5 bg-black text-white flex justify-between items-center shadow-md">
              <h2 className="text-xl font-black italic uppercase">Tu Carrito 🛒</h2>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-800 rounded-full transition">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Lista de Productos */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <p className="text-6xl mb-4">🛒</p>
                  <p>Tu carrito está vacío.</p>
                  <button onClick={toggleCart} className="mt-4 text-black font-bold underline">Volver a la tienda</button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item._id}-${item.selectedSize}-${index}`} className="flex gap-4 border-b pb-4">
                    <img src={item.imageSrc || "https://via.placeholder.com/100"} alt={item.name} className="w-20 h-20 object-cover rounded-md border" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm uppercase">{item.name}</h3>
                      <p className="text-xs text-gray-500">Talla: <span className="font-bold text-black">{item.selectedSize}</span></p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-green-700">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">x{item.quantity}</span>
                           <button onClick={() => removeFromCart(item._id || item.id, item.selectedSize)} className="text-red-500 hover:text-red-700">
                             <FaTrash size={14} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con Total y Botón */}
            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between items-center mb-4 text-xl font-black">
                  <span>TOTAL:</span>
                  <span>₡{cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isValidating}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg 
                    ${isValidating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'}`}
                >
                  {isValidating ? (
                    "VERIFICANDO STOCK..."
                  ) : (
                    <>
                      <FaWhatsapp size={24} /> COMPLETAR PEDIDO
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}