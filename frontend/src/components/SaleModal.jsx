import React from 'react';
import { FaCashRegister, FaIdCard, FaPhone, FaUser, FaMoneyBillWave, FaSpinner, FaEdit } from 'react-icons/fa';
import { motion } from "framer-motion";

export default function SaleModal({
  isRegisteringSale,
  setIsRegisteringSale,
  inventoryChanges,
  handleOpenSaleForm,
  handleSave,
  loadingAction,
  setShowConfirmSave,
  handleRegisterSaleSubmit,
  displayName,
  saleForm,
  setSaleForm,
  loadingCedula,
  tallasVisibles,
  handleQuantityChange,
  handleCedulaChange, // Pasamos la función para manejar el cambio de cédula
  totalConEnvio
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full text-center text-black overflow-hidden relative">
        
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
          /* 💰 FORMULARIO CON ALINEACIÓN PERFECTA Y SECCIÓN DE DIRECCIÓN */
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
                  <input type="text" required value={saleForm.cedula} onChange={handleCedulaChange} placeholder="Ej: 101110111" className="w-full border p-2 rounded-lg text-xs font-mono focus:border-black outline-none pl-7 h-9.5" />
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
              
              {/* TALLA (Ancho: 5 columnas) */}
              <div className="col-span-5">
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

              {/* CHEMAS (Ancho: 5 columnas) */}
              <div className="col-span-5">
                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 truncate">Chemas (₡)</label>
                <input type="number" required value={saleForm.totalPago} onChange={e => setSaleForm({...saleForm, totalPago: e.target.value})} className="w-full border p-2 rounded-lg text-xs font-bold text-gray-800 focus:border-black outline-none h-9.5 px-1" />
              </div>

            </div>

            {/* 🚚 ENVÍO Y DIRECCIÓN */}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">¿Requiere Envío a Domicilio?</label>
                <div className="flex gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1 cursor-pointer text-gray-700">
                    <input 
                      type="radio" 
                      checked={saleForm.requiereEnvio} 
                      onChange={() => setSaleForm({...saleForm, requiereEnvio: true})} 
                      className="accent-black" 
                    />
                    Sí
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-gray-700">
                    <input 
                      type="radio" 
                      checked={!saleForm.requiereEnvio} 
                      onChange={() => setSaleForm({...saleForm, requiereEnvio: false, costoEnvio: 0, direccionEnvio: ''})} 
                      className="accent-black" 
                    />
                    No
                  </label>
                </div>
              </div>

              {/* 📍 SE MUESTRA SOLO SI REQUIERE ENVÍO */}
              {saleForm.requiereEnvio && (
                <div className="space-y-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100 mb-2 animate-in fade-in zoom-in duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dirección de Envío *</label>
                    <textarea 
                      required={saleForm.requiereEnvio}
                      rows="2"
                      value={saleForm.direccionEnvio} 
                      onChange={e => setSaleForm({...saleForm, direccionEnvio: e.target.value})} 
                      placeholder="Ej: San José, Escazú, 100m sur del parque..." 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold focus:border-black outline-none bg-white resize-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Costo de Envío (₡)</label>
                    <input 
                      type="number" 
                      required={saleForm.requiereEnvio}
                      value={saleForm.costoEnvio} 
                      onChange={e => setSaleForm({...saleForm, costoEnvio: e.target.value})} 
                      placeholder="0" 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold text-blue-600 focus:border-black outline-none bg-white" 
                    />
                  </div>
                </div>
              )}
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
              <button type="button" onClick={() => setIsRegisteringSale(false)} className="w-1/3 py-2.5 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition cursor-pointer">Atrás</button>
              <button type="submit" disabled={loadingAction || loadingCedula} className="w-2/3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer">
                {loadingAction ? 'Guardando...' : 'CONFIRMAR VENTA '}
              </button>
            </div>
          </form>
        )}

      </div>
    </motion.div>
  );
}