import React from 'react';
import { 
  FaTimes, FaCashRegister, FaUserTie, FaIdCard, 
  FaPhone, FaUser, FaPlus, FaSearch, FaTshirt 
} from 'react-icons/fa';

export default function QuickSaleModal({
  showQuickSaleModal,
  setShowQuickSaleModal,
  quickForm,
  setQuickForm,
  handleQuickSaleSubmit,
  submitting,
  loadingCedula,
  catalogo,
  VENDEDORES,
  displayName,
  totalCantidadChemas,
  granTotalConEnvio,
  handleProductoChange,
  handleRemoveProducto,
  handleAddProducto,
  handleSelectFromCatalogo
}) {
  if (!showQuickSaleModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO NORMAL */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-green-500 flex items-center justify-center shadow-md flex-shrink-0">
              <FaCashRegister size={18} />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-tight">Registro de Venta Rápida</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Sesión: {displayName}</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowQuickSaleModal(false)}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-black hover:text-white text-black flex items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="p-4 sm:p-6 space-y-4">
          <form id="quick-sale-form" onSubmit={handleQuickSaleSubmit} className="space-y-4">
            
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Asignar Venta a Empleado *</label>
              <div className="relative">
                <select 
                  value={quickForm.vendedorAsignado} 
                  onChange={e => setQuickForm({...quickForm, vendedorAsignado: e.target.value})} 
                  className="w-full border p-2.5 rounded-xl text-xs font-bold focus:border-black outline-none bg-gray-50 pl-7"
                >
                  {VENDEDORES.map(vendedor => (
                    <option key={vendedor} value={vendedor}>{vendedor}</option>
                  ))}
                </select>
                <FaUserTie className="absolute left-2.5 top-3 text-gray-400 text-xs" />
              </div>
            </div>

            {/* DATOS DEL CLIENTE */}
            <div className="bg-gray-50 p-3 rounded-xl border space-y-2.5">
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider block border-b pb-1">Datos del Cliente</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cédula *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={quickForm.cedula} 
                      onChange={e => setQuickForm({...quickForm, cedula: e.target.value})} 
                      placeholder="101110111" 
                      className="w-full border p-2 rounded-xl text-xs font-mono focus:border-black outline-none pl-7 bg-white" 
                    />
                    <FaIdCard className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Teléfono *</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required 
                      value={quickForm.numero} 
                      onChange={e => setQuickForm({...quickForm, numero: e.target.value})} 
                      placeholder="88888888" 
                      className="w-full border p-2 rounded-xl text-xs font-mono focus:border-black outline-none pl-7 bg-white" 
                    />
                    <FaPhone className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre Completo *</label>
                  {loadingCedula && <span className="text-[9px] font-bold text-amber-600 animate-pulse">Buscando...</span>}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    value={quickForm.nombre} 
                    onChange={e => setQuickForm({...quickForm, nombre: e.target.value})} 
                    placeholder={loadingCedula ? "Autocompletando..." : "Nombre del cliente"} 
                    className="w-full border p-2 rounded-xl text-xs focus:border-black outline-none pl-7 font-bold bg-white" 
                  />
                  <FaUser className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
                </div>
              </div>
            </div>

            {/* 🛍️ MULTIPRODUCTO */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Chemas del Pedido ({quickForm.productos.length})</label>
                <button 
                  type="button" 
                  onClick={handleAddProducto} 
                  className="text-[10px] font-black text-green-700 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <FaPlus size={9} /> Agregar Otra Chema
                </button>
              </div>

              {quickForm.productos.map((prod, index) => {
                const queryText = (prod.nombre || "").trim().toLowerCase();

                const sugerencias = queryText.length === 0
                  ? catalogo 
                  : catalogo.filter(cat => {
                      const nombreMatch = cat.name && cat.name.toLowerCase().includes(queryText);
                      const tipoMatch = cat.type && cat.type.toLowerCase().includes(queryText);
                      return nombreMatch || tipoMatch;
                    });
                
                const productoVinculado = prod.productoId ? catalogo.find(p => (p.id || p._id) === prod.productoId) : null;
                const tallasDisponibles = productoVinculado && productoVinculado.stock 
                  ? Object.keys(productoVinculado.stock).filter(talla => Number(productoVinculado.stock[talla]) > 0)
                  : ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28', '3', '4', '5'];

                return (
                  <div key={index} className="border border-gray-200 p-3 rounded-xl bg-gray-50/85 space-y-2.5 relative shadow-sm">
                    {quickForm.productos.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveProducto(index)} 
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-200 transition shadow cursor-pointer z-10"
                        title="Quitar chema"
                      >
                        <FaTimes size={10} />
                      </button>
                    )}

                    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border text-xs font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer text-gray-800">
                        <input 
                          type="radio" 
                          name={`tipoVenta-${index}`} 
                          checked={prod.tipoVenta === 'stock'} 
                          onChange={() => handleProductoChange(index, 'tipoVenta', 'stock')}
                          className="accent-black cursor-pointer"
                        />
                        Stock
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                        <input 
                          type="radio" 
                          name={`tipoVenta-${index}`} 
                          checked={prod.tipoVenta === 'pedido'} 
                          onChange={() => handleProductoChange(index, 'tipoVenta', 'pedido')}
                          className="accent-gray-700 cursor-pointer"
                        />
                        Pedido
                      </label>
                    </div>

                    {prod.tipoVenta === 'stock' && prod.productoId && (
                      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-green-300 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">
                            {prod.type || 'Camiseta'}
                          </span>
                          <span className="font-bold text-gray-800 truncate">{prod.nombre}</span>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Stock: {prod.stockDisponible ?? 0} unds
                        </span>
                      </div>
                    )}

                    {prod.tipoVenta === 'stock' ? (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input 
                            type="text" 
                            required 
                            value={prod.nombre} 
                            onChange={e => handleProductoChange(index, 'nombre', e.target.value)} 
                            placeholder="Toca para ver todo el catálogo o busca..." 
                            className={`w-full border p-2 rounded-lg text-xs font-bold focus:border-black outline-none pr-7 ${
                              prod.productoId ? 'bg-green-50/30 border-green-400 text-green-900' : 'bg-white'
                            }`}
                          />
                          <FaSearch className="absolute right-2.5 top-2.5 text-gray-400 text-xs pointer-events-none" />
                        </div>

                        {!prod.productoId && (
                          <div className="bg-white border border-gray-300 rounded-xl shadow-inner max-h-48 overflow-y-auto divide-y divide-gray-100">
                            {sugerencias.length === 0 ? (
                              <div className="p-3 text-center text-xs text-gray-400 italic font-medium">
                                No se encontraron resultados en stock.
                              </div>
                            ) : (
                              sugerencias.map(cat => {
                                const totalEnBodega = cat.stock ? Object.values(cat.stock).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
                                const precioCat = cat.discountPrice ? cat.discountPrice : (cat.price || 15000);
                                const imgCat = cat.imageSrc || (cat.images?.[0]?.url || '');
                                const tipoCat = cat.type || 'Camiseta';

                                return (
                                  <button
                                    key={cat.id || cat._id}
                                    type="button"
                                    onClick={() => handleSelectFromCatalogo(index, cat)}
                                    className="w-full text-left p-2.5 hover:bg-gray-100 transition flex items-center justify-between group text-xs font-bold cursor-pointer bg-white text-gray-900"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                      {imgCat ? (
                                        <img src={imgCat} alt={cat.name} className="w-8 h-8 object-cover rounded-md border flex-shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                                          <FaTshirt size={12} />
                                        </div>
                                      )}
                                      <div className="truncate">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[8px] uppercase font-black px-1.5 py-0.2 bg-gray-200 text-gray-800 rounded">
                                            {tipoCat}
                                          </span>
                                        </div>
                                        <span className="block truncate uppercase mt-0.5 text-gray-900 font-bold">{cat.name}</span>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                          Bodega: <strong className={totalEnBodega > 0 ? 'text-green-600' : 'text-red-500'}>{totalEnBodega} unds</strong>
                                        </span>
                                      </div>
                                    </div>
                                    <span className="font-black text-green-700 whitespace-nowrap text-xs flex-shrink-0">
                                      ₡{precioCat.toLocaleString()}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="text" 
                          required 
                          value={prod.nombre} 
                          onChange={e => handleProductoChange(index, 'nombre', e.target.value)} 
                          placeholder="Escribe el nombre del pedido especial..." 
                          className="w-full border p-2 rounded-lg text-xs font-bold bg-blue-50/40 border-blue-300 text-blue-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-1.5 items-center">
                      <div className="col-span-4">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Talla</label>
                        {prod.tipoVenta === 'stock' ? (
                          <select 
                            value={prod.talla} 
                            onChange={e => handleProductoChange(index, 'talla', e.target.value)} 
                            className="w-full border p-1.5 rounded-lg text-xs font-bold focus:border-black outline-none bg-white h-8"
                          >
                            {tallasDisponibles.length === 0 ? (
                              <option value="">Agotado</option>
                            ) : (
                              tallasDisponibles.map(t => <option key={t} value={t}>{t}</option>)
                            )}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={prod.talla} 
                            onChange={e => handleProductoChange(index, 'talla', e.target.value)} 
                            placeholder="Ej: L" 
                            className="w-full border p-1.5 rounded-lg text-xs font-bold bg-white h-8 text-center"
                          />
                        )}
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 text-center">Cant.</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={prod.tipoVenta === 'stock' && prod.stockDisponible !== null ? prod.stockDisponible : 99}
                          required 
                          value={prod.cantidad} 
                          onChange={e => {
                            const val = e.target.value;
                            handleProductoChange(index, 'cantidad', val);
                            if (prod.tipoVenta === 'stock' && prod.productoId) {
                              const prodCat = catalogo.find(p => (p.id || p._id) === prod.productoId);
                              if (prodCat) {
                                const pr = prodCat.discountPrice ? prodCat.discountPrice : (prodCat.price || 15000);
                                handleProductoChange(index, 'precioTotal', pr * (Number(val) || 1));
                              }
                            }
                          }} 
                          className="w-full border p-1.5 rounded-lg text-xs font-black text-center focus:border-black outline-none bg-amber-50 h-8" 
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Precio Total (₡)</label>
                        <input 
                          type="number" 
                          required 
                          value={prod.precioTotal} 
                          onChange={e => handleProductoChange(index, 'precioTotal', e.target.value)} 
                          className="w-full border p-1.5 rounded-lg text-xs font-bold text-gray-800 focus:border-black outline-none px-2 bg-white h-8" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🚚 ENVÍO Y DIRECCIÓN */}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">¿Requiere Envío a Domicilio?</label>
                <div className="flex gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1 cursor-pointer text-gray-700">
                    <input 
                      type="radio" 
                      checked={quickForm.requiereEnvio} 
                      onChange={() => setQuickForm({...quickForm, requiereEnvio: true})} 
                      className="accent-black cursor-pointer" 
                    />
                    Sí
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-gray-700">
                    <input 
                      type="radio" 
                      checked={!quickForm.requiereEnvio} 
                      onChange={() => setQuickForm({...quickForm, requiereEnvio: false, costoEnvio: 0, direccionEnvio: ''})} 
                      className="accent-black cursor-pointer" 
                    />
                    No
                  </label>
                </div>
              </div>

              {/* 📍 SE MUESTRA SOLO SI REQUIERE ENVÍO */}
              {quickForm.requiereEnvio && (
                <div className="space-y-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100 mb-2 animate-in fade-in zoom-in duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dirección de Envío *</label>
                    <textarea 
                      required={quickForm.requiereEnvio}
                      rows="2"
                      value={quickForm.direccionEnvio} 
                      onChange={e => setQuickForm({...quickForm, direccionEnvio: e.target.value})} 
                      placeholder="Ej: San José, Escazú, 100m sur del parque..." 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold focus:border-black outline-none bg-white resize-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Costo de Envío (₡)</label>
                    <input 
                      type="number" 
                      required={quickForm.requiereEnvio}
                      value={quickForm.costoEnvio} 
                      onChange={e => setQuickForm({...quickForm, costoEnvio: e.target.value})} 
                      placeholder="0" 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold text-blue-600 focus:border-black outline-none bg-white" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL GENERAL */}
            <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl flex justify-between items-center text-xs mt-2">
              <div>
                <span className="font-bold text-green-800">TOTAL PEDIDO:</span>
                <span className="text-[10px] text-green-600 block">{totalCantidadChemas} chemas en total</span>
              </div>
              <span className="font-black text-green-700 text-base">
                ₡{granTotalConEnvio.toLocaleString()}
              </span>
            </div>

          </form>
        </div>

        {/* PIE NORMAL (SIN STICKY) AL FINAL DEL FORMULARIO */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 rounded-b-[2rem]">
          <button 
            type="button" 
            onClick={() => setShowQuickSaleModal(false)} 
            className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-200 transition cursor-pointer bg-white shadow-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="quick-sale-form"
            disabled={submitting || loadingCedula} 
            className="w-2/3 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'CONFIRMAR VENTA '}
          </button>
        </div>

      </div>
    </div>
  );
}