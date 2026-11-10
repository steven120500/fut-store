import { cld } from "../utils/cloudinary";
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FaTimes, FaTrash, FaWhatsapp, FaShoppingBag } from 'react-icons/fa';
import { API_ORIGIN } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify'; // 🏆 Importamos toast para las alertas

const API_BASE = API_ORIGIN;

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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
            onClick={toggleCart}
          />

          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-[101] flex h-full w-full flex-col bg-white shadow-2xl sm:w-[420px]"
          >
            <div className="relative overflow-hidden bg-black px-6 pb-5 pt-6 text-white">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30"><FaShoppingBag size={15} /></span>
                <div>
                  <h2 className="font-display text-2xl uppercase leading-none tracking-wide text-silver">Tu carrito</h2>
                  <p className="mt-1 text-xs text-white/55">{cart.length} {cart.length === 1 ? "producto" : "productos"}</p>
                </div>
              </div>
              <button onClick={toggleCart} aria-label="Cerrar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:text-cyan-300">
                <FaTimes size={14} />
              </button>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0" />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="mt-20 flex flex-col items-center text-center">
                  <span className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-zinc-100 text-zinc-300"><FaShoppingBag size={30} /></span>
                  <p className="font-display text-2xl uppercase text-zinc-300">Carrito vacío</p>
                  <button onClick={toggleCart} className="fs-btn fs-btn-ghost mt-5">Volver a la tienda</button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item._id}-${item.selectedSize}-${index}`} className="flex gap-4 rounded-2xl border border-zinc-100 p-3">
                    <img src={cld(item.imageSrc, "thumb") || "https://via.placeholder.com/100"} alt={item.name} className="h-20 w-16 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-xs font-bold uppercase leading-tight">{item.name}</h3>
                      <div className="mt-1.5 flex gap-1.5">
                        <span className="bg-silver rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-black">{item.selectedSize}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black">x{item.quantity}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-black">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item._id || item.id, item.selectedSize)} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-zinc-100 bg-zinc-50 p-5">
                <div className="mb-4 flex items-end justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total</span>
                  <span className="font-display text-3xl tracking-wide">₡{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} disabled={isValidating} className="fs-btn w-full bg-[#25D366] py-4 text-white hover:bg-[#1ebe5a]">
                  {isValidating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FaWhatsapp size={18} />}
                  {isValidating ? "Verificando stock…" : "Completar pedido"}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
