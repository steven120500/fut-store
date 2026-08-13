import React from 'react';
import { FaTimes, FaUserTie, FaChevronDown, FaCheck, FaSpinner, FaIdCard, FaPhone, FaUser, FaPlus, FaSearch, FaTshirt, FaTags, FaImage } from 'react-icons/fa';

export default function NewApartadoModal({
  showAddModal,
  setShowAddModal,
  form,
  setForm,
  handleCrearApartado,
  employeeDropdownRef,
  showEmployeeDropdown,
  setShowEmployeeDropdown,
  listaEmpleados,
  buscandoCedula,
  handleCedulaChange,
  agregarOtraChema,
  searchRef,
  productosStock,
  eliminarChema,
  actualizarProducto,
  seleccionarProductoDelStock,
  handleImageChange,
  totalCalculado,
  faltanteCalculado,
  activeDropdownIndex,
  setActiveDropdownIndex
}) {
  if (!showAddModal) return null;

  // Lista de tallas predeterminada para pedidos especiales de Tacos
  const TALLAS_TACOS = ['7 US (40)', '7,5 US (40,5)', '8 US (41)', '8,5 US (42)', '9 US (42,5)', '9,5 US (43)', '10 US (44)', '10,5 US (44,5)', '11 US (45)', '11,5 US (45,5)', '12 US (46)'];

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto">
      {/* Usamos my-8 para que tenga margen arriba y abajo al hacer scroll */}
      <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col my-8 relative animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[2rem] shrink-0">
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight text-black">Registrar Nuevo Apartado</h3>
          </div>
          <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-black hover:text-white flex items-center justify-center transition cursor-pointer">
            <FaTimes size={12} />
          </button>
        </div>

        <form onSubmit={handleCrearApartado} className="flex flex-col">
          
          <div className="p-4 sm:p-6 space-y-5 bg-white">
            
            {/* EMPLEADO */}
            <div className="relative z-50" ref={employeeDropdownRef}>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Asignar venta a empleado *</label>
              <div 
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-bold bg-white cursor-pointer flex justify-between items-center relative"
              >
                <div className="flex items-center gap-2 text-gray-700">
                  <FaUserTie className="text-gray-400" size={14}/>
                  {form.vendedor || "Seleccionar..."}
                </div>
                <FaChevronDown className="text-gray-400" size={10} />
              </div>
              
              {showEmployeeDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-y-auto max-h-48 z-[200]">
                  {listaEmpleados.map(emp => (
                    <div 
                      key={emp}
                      onClick={() => { setForm({...form, vendedor: emp}); setShowEmployeeDropdown(false); }}
                      className={`p-3 text-xs font-bold cursor-pointer flex items-center justify-between transition ${form.vendedor === emp ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                    >
                      {emp}
                      {form.vendedor === emp && <FaCheck className="text-green-500" size={10} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DATOS DEL CLIENTE */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 relative z-0">
              <h4 className="text-[11px] font-black uppercase text-gray-700 mb-3 border-b pb-2">Datos del Cliente</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between items-center">
                    Cédula *
                    {buscandoCedula && <span className="text-blue-500 flex items-center gap-1"><FaSpinner className="animate-spin" size={10}/> TSE</span>}
                  </label>
                  <div className="relative">
                    <FaIdCard className="absolute left-3 top-3 text-gray-400" size={12}/>
                    <input 
                      type="text" required placeholder="101110111" 
                      value={form.cedula} onChange={handleCedulaChange} 
                      className="w-full border p-2 pl-8 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Teléfono *</label>
                  <input type="tel" required placeholder="88888888" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full border p-2 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Completo *</label>
                <div className="relative">
                  <FaUserTie className="absolute left-3 top-3 text-gray-400" size={12}/>
                  <input type="text" required placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="w-full border p-2 pl-8 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" />
                </div>
              </div>
            </div>

            {/* PRODUCTOS */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[11px] font-black uppercase text-gray-700">Artículos del Pedido ({form.productos.length})</h4>
                <button type="button" onClick={agregarOtraChema} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1">
                  <FaPlus /> Agregar Otro
                </button>
              </div>

              <div className="space-y-4" ref={searchRef}>
                {form.productos.map((prod, index) => {
                  
                  // 🏆 VALIDACIÓN: ¿ES UN TACO?
                  const isTaco = prod.tipoPedido === 'nuevo' 
                    ? prod.version === 'Tacos' 
                    : (prod.type || '').toLowerCase().includes('tacos') || (prod.busqueda || '').toLowerCase().includes('tacos');

                  const queryText = (prod.busqueda || "").trim().toLowerCase();
                  const sugerencias = queryText.length === 0
                    ? productosStock 
                    : productosStock.filter(cat => {
                        const nombreMatch = cat.name && cat.name.toLowerCase().includes(queryText);
                        const tipoMatch = cat.type && cat.type.toLowerCase().includes(queryText);
                        return nombreMatch || tipoMatch;
                      });
                  
                  const productoVinculado = prod.productoObj;
                  const tallasDisponibles = productoVinculado && productoVinculado.stock 
                    ? Object.keys(productoVinculado.stock).filter(talla => Number(productoVinculado.stock[talla]) > 0)
                    : ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28', '3', '4', '5', '7 US (40)', '7,5 US (40,5)', '8 US (41)', '8,5 US (42)', '9 US (42,5)', '9,5 US (43)', '10 US (44)', '10,5 US (44,5)', '11 US (45)', '11,5 US (45,5)', '12 US (46)'];

                  return (
                    <div key={prod.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/85 shadow-sm relative z-0">
                      
                      {form.productos.length > 1 && (
                        <button type="button" onClick={() => eliminarChema(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-200 transition shadow cursor-pointer z-10">
                          <FaTimes size={10} />
                        </button>
                      )}

                      <div className="flex items-center gap-6 mb-4 border-b pb-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                          <input type="radio" checked={prod.tipoPedido === 'stock'} onChange={() => actualizarProducto(index, 'tipoPedido', 'stock')} className="accent-black w-3.5 h-3.5" />
                          Stock
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                          <input type="radio" checked={prod.tipoPedido === 'nuevo'} onChange={() => { actualizarProducto(index, 'tipoPedido', 'nuevo'); actualizarProducto(index, 'productoObj', null); }} className="accent-gray-700 w-3.5 h-3.5" />
                          Pedido Especial
                        </label>
                      </div>

                      {prod.tipoPedido === 'stock' && prod.productoObj && (
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-green-300 text-xs mb-3">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">
                              {prod.type || 'Camiseta'}
                            </span>
                            <span className="font-bold text-gray-800 truncate">{prod.busqueda}</span>
                          </div>
                        </div>
                      )}

                      {prod.tipoPedido === 'stock' ? (
                        <div className="mb-4 relative">
                          <div className="relative">
                            <input 
                              type="text" placeholder="Toca para ver todo el catálogo o busca..." value={prod.busqueda}
                              onChange={(e) => { actualizarProducto(index, 'busqueda', e.target.value); setActiveDropdownIndex(index); }}
                              onFocus={() => setActiveDropdownIndex(index)}
                              className={`w-full border p-2.5 rounded-xl text-xs font-bold outline-none pr-7 ${
                                prod.productoObj ? 'bg-green-50/30 border-green-400 text-green-900' : 'bg-white border-gray-300 focus:border-black'
                              }`}
                            />
                            <FaSearch className="absolute right-3 top-3 text-gray-400" size={12} />
                          </div>

                          {!prod.productoObj && activeDropdownIndex === index && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-gray-100">
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
                                      onClick={() => seleccionarProductoDelStock(index, cat)}
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
                        <div className="mb-4 space-y-3">
                          <textarea 
                            required rows="2" placeholder={isTaco ? "Describe los zapatos (Ej: Nike Mercurial Azules...)" : "Describe la chema (Ej: Barcelona 2009 Visitante...)"}
                            value={prod.descripcionManual} onChange={e => actualizarProducto(index, 'descripcionManual', e.target.value)}
                            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-black resize-none bg-white"
                          ></textarea>
                          
                          {/* 🚫 SE OCULTAN LOS NOMBRES Y NÚMEROS SI ES TACO */}
                          {!isTaco && (
                            <div className="grid grid-cols-2 gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                              <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Nombre Dorsal</label>
                                <input type="text" placeholder="Ej: MESSI" value={prod.nombreCamiseta} onChange={e => actualizarProducto(index, 'nombreCamiseta', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none uppercase bg-white focus:border-black" />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Número Dorsal</label>
                                <input type="text" placeholder="Ej: 10 o N/A" value={prod.numeroCamiseta} onChange={e => actualizarProducto(index, 'numeroCamiseta', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none bg-white focus:border-black" />
                              </div>
                            </div>
                          )}

                          <div className={`grid ${isTaco ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mb-3`}>
                            <div>
                              <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Categoría / Versión</label>
                              <select 
                                value={prod.version} onChange={e => actualizarProducto(index, 'version', e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-xl text-xs font-bold outline-none focus:border-black bg-white"
                              >
                                <option value="Player">Player (Ajustada)</option>
                                <option value="Fan">Fan (Normal)</option>
                                <option value="Retro">Retro</option>
                                <option value="Mujer">Mujer</option>
                                <option value="Niño">Niño</option>
                                <option value="Tacos">Tacos / Zapatos</option>
                              </select>
                            </div>
                            
                            {/* 🚫 SE OCULTAN LOS PARCHES SI ES TACO */}
                            {!isTaco && (
                              <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FaTags size={10}/> Parches (Opcional)</label>
                                <input 
                                  type="text" placeholder="Ej: Champions..." 
                                  value={prod.parches} onChange={e => actualizarProducto(index, 'parches', e.target.value)}
                                  className="w-full border border-gray-300 p-2 rounded-xl text-xs font-bold outline-none focus:border-black" 
                                />
                              </div>
                            )}
                          </div>

                          {/* SISTEMA DE DOBLE FOTO PARA ESTE PRODUCTO */}
                          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 mt-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FaImage /> Referencias Visuales</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border border-gray-200 rounded-lg p-2 bg-white text-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Foto Principal</span>
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index, 1)} className="text-[9px] w-full cursor-pointer file:rounded file:border-0 file:bg-gray-200 text-gray-500" />
                                {prod.previewImg1 && <img src={prod.previewImg1} alt="Referencia 1" className="mt-2 w-full h-12 object-cover rounded border" />}
                              </div>
                              <div className="border border-gray-200 rounded-lg p-2 bg-white text-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Foto Secundaria</span>
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index, 2)} className="text-[9px] w-full cursor-pointer file:rounded file:border-0 file:bg-gray-200 text-gray-500" />
                                {prod.previewImg2 && <img src={prod.previewImg2} alt="Referencia 2" className="mt-2 w-full h-12 object-cover rounded border" />}
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      <div className="grid grid-cols-12 gap-1.5 items-center mt-2">
                        <div className="col-span-4">
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Talla</label>
                          {prod.tipoPedido === 'stock' ? (
                            <select 
                              value={prod.talla} onChange={e => actualizarProducto(index, 'talla', e.target.value)}
                              className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold outline-none focus:border-black bg-white h-8"
                            >
                              {tallasDisponibles.length === 0 ? (
                                <option value="">Agotado</option>
                              ) : (
                                tallasDisponibles.map(t => <option key={t} value={t}>{t}</option>)
                              )}
                            </select>
                          ) : isTaco ? (
                            // 🏆 SELECTOR ESPECIAL SÓLO PARA PEDIDOS DE TACOS
                            <select 
                              value={prod.talla} onChange={e => actualizarProducto(index, 'talla', e.target.value)}
                              className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold outline-none focus:border-black bg-white h-8"
                            >
                              <option value="">Selec...</option>
                              {TALLAS_TACOS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : (
                            // INPUT NORMAL PARA CAMISETAS ESPECIALES
                            <input 
                              type="text" value={prod.talla} onChange={e => actualizarProducto(index, 'talla', e.target.value.toUpperCase())}
                              placeholder="Ej: L" className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold outline-none focus:border-black bg-white h-8 text-center"
                            />
                          )}
                        </div>
                        <div className="col-span-3">
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 text-center">Cant.</label>
                          <input 
                            type="number" min="1" required value={prod.cantidad} 
                            onChange={e => {
                              const val = e.target.value;
                              actualizarProducto(index, 'cantidad', val);
                              if (prod.tipoPedido === 'stock' && prod.productoObj) {
                                const pr = prod.productoObj.discountPrice ? prod.productoObj.discountPrice : (prod.productoObj.price || 15000);
                                actualizarProducto(index, 'precioItem', pr * (Number(val) || 1));
                              }
                            }}
                            className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-black text-center outline-none focus:border-black bg-amber-50 h-8" 
                          />
                        </div>
                        <div className="col-span-5">
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Precio (₡)</label>
                          <input 
                            type="number" required placeholder="15000" value={prod.precioItem} onChange={e => actualizarProducto(index, 'precioItem', e.target.value)}
                            className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-black outline-none focus:border-black bg-white h-8" 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      checked={form.requiereEnvio} 
                      onChange={() => setForm({...form, requiereEnvio: true})} 
                      className="accent-black cursor-pointer" 
                    />
                    Sí
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-gray-700">
                    <input 
                      type="radio" 
                      checked={!form.requiereEnvio} 
                      onChange={() => setForm({...form, requiereEnvio: false, costoEnvio: 0, direccionEnvio: ''})} 
                      className="accent-black cursor-pointer" 
                    />
                    No
                  </label>
                </div>
              </div>

              {/* 📍 SE MUESTRA SOLO SI REQUIERE ENVÍO */}
              {form.requiereEnvio && (
                <div className="space-y-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100 mb-2 animate-in fade-in zoom-in duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dirección de Envío *</label>
                    <textarea 
                      required={form.requiereEnvio}
                      rows="2"
                      value={form.direccionEnvio} 
                      onChange={e => setForm({...form, direccionEnvio: e.target.value})} 
                      placeholder="Ej: San José, Escazú, 100m sur del parque..." 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold focus:border-black outline-none bg-white resize-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Costo de Envío (₡)</label>
                    <input 
                      type="number" 
                      required={form.requiereEnvio}
                      value={form.costoEnvio} 
                      onChange={e => setForm({...form, costoEnvio: e.target.value})} 
                      placeholder="0" 
                      className="w-full border border-blue-200 p-2 rounded-lg text-xs font-bold text-blue-600 focus:border-black outline-none bg-white" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TOTALES */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-2">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-green-800 tracking-wider">Total Pedido:</p>
                  <p className="text-[9px] font-bold text-green-600">{form.productos.reduce((sum, p) => sum + Number(p.cantidad), 0)} artículos en total</p>
                </div>
                <p className="text-xl font-black text-green-700">₡{totalCalculado.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-green-200 pt-3">
                <div>
                  <label className="text-[10px] font-bold text-green-800 uppercase mb-1 block">Abono Inicial (₡) *</label>
                  <input type="number" required placeholder="Ej: 15000" value={form.abono} onChange={e => setForm({...form, abono: e.target.value})} className="w-full border border-green-300 p-2 rounded-xl text-sm font-black text-green-700 bg-white outline-none focus:border-green-600" />
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Saldo Faltante</p>
                  <p className="text-lg font-black text-red-600">₡{faltanteCalculado > 0 ? faltanteCalculado.toLocaleString() : 0}</p>
                </div>
              </div>
            </div>

          </div>

          {/* PIE DEL MODAL */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 rounded-b-[2rem] shrink-0">
            <button 
              type="button" 
              onClick={() => setShowAddModal(false)} 
              className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-200 transition cursor-pointer bg-white shadow-sm"
            >
              Cancelar
            </button>
            <button type="submit" className="w-2/3 py-3 bg-black hover:bg-gray-600 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-widest cursor-pointer">
              Registrar 
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}