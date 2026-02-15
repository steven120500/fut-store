// src/components/Medidas.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; 

// 🔽 Importamos las imágenes
import fanImg from "../assets/Fan.png";
import playerImg from "../assets/Player.png";

// 🎨 Gradiente Plateado
const silverGradient = "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #d1d1d1 100%)";

export default function Medidas({ open, onClose }) {
  
  // Bloquear scroll del body (fondo de la web)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);

  if (!open) return null;

  const CATALOG = [
    { key: "Player", label: "Versión Player (Ajustada)", img: playerImg, desc: "Corte más pegado al cuerpo." },
    { key: "Fan", label: "Versión Fan (Estándar)", img: fanImg, desc: "Corte recto y cómodo." },
  ];

  const modal = (
    // 1. Contenedor PRINCIPAL con scroll (overflow-y-auto)
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
      
      {/* 2. Wrapper para centrar y dar margen (min-h-screen permite scroll) */}
      <div 
        className="flex min-h-full items-center justify-center p-4 py-12"
        onClick={onClose} // Cerrar al hacer click fuera
      >
        
        {/* 📦 3. TARJETA DEL MODAL (Sin límite de altura, crece con el contenido) */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Evitar cierre al clickear dentro
        >
          
          {/* ❌ BOTÓN CERRAR */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-gray-100 hover:bg-gray-200 text-black p-2 rounded-full transition-all shadow-sm"
            title="Cerrar"
          >
            <FaTimes size={18} />
          </button>

          {/* HEADER */}
          <div className="text-center pt-8 pb-4 px-6 border-b border-gray-100 bg-white">
            <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Guía de Tallas
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Revisa las medidas para asegurar tu ajuste perfecto.
            </p>
          </div>

          {/* 📜 BODY (Ahora fluye natural, sin scrolleo interno forzado) */}
          <div className="p-6 space-y-8 bg-white">
            {CATALOG.map(({ key, label, img, desc }) => (
              <div key={key} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                
                {/* Título de Sección Plateado */}
                <div 
                  className="py-2 px-4 text-center font-bold text-gray-800 uppercase tracking-wider text-sm shadow-sm"
                  style={{ background: silverGradient }}
                >
                  {label}
                </div>

                {/* Contenido e Imagen */}
                <div className="p-4 flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-3 italic">{desc}</p>
                  <div className="w-full bg-white rounded-lg p-2 border border-gray-100">
                    <img
                      src={img}
                      alt={`Guía de medidas ${label}`}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Botón Cerrar Inferior */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-all shadow-lg"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}