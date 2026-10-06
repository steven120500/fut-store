import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaImage, FaSearch, FaPlus, FaClipboardList, FaTrash, FaBoxOpen, FaTags, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function RestockBoard({ productosStock, onCrearRestock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pedidoProveedor, setPedidoProveedor] = useState([]);
  
  // 🔥 NUEVO ESTADO: Límite de productos visibles para evitar crasheos
  const [visibleCount, setVisibleCount] = useState(15);

  // Estados para el Modalito de Personalización
  const [modalItem, setModalItem] = useState(null);
  const [customForm, setCustomForm] = useState({ 
    nombre: '', numero: '', parches: ''
  });

  // Si el usuario escribe algo en el buscador, reiniciamos el contador a 15
  useEffect(() => {
    setVisibleCount(15);
  }, [searchTerm]);

  // 1. Filtrar los productos críticos
  const productosCriticos = productosStock.map(prod => {
    const stockKeys = Object.keys(prod.stock || {});
    
    const tallasCriticas = stockKeys.filter(talla => {
      const qty = Number(prod.stock[talla]);
      return qty === 0 || qty === 1; // Emergencias: 0 o 1
    }).map(talla => ({ talla, cantidad: Number(prod.stock[talla]) }));

    if (tallasCriticas.length > 0) {
      return { ...prod, tallasCriticas };
    }
    return null;
  }).filter(Boolean);

  // 2. Aplicar buscador
  const productosFiltrados = productosCriticos.filter(prod => 
    prod.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔥 3. Extraer solo los productos que vamos a dibujar en pantalla
  const productosVisibles = productosFiltrados.slice(0, visibleCount);

  // --- LÓGICA DEL TABLERO DE PEDIDOS ---
  const agregarAlPedido = (prod) => {
    const prodId = prod.id || prod._id;
    if (pedidoProveedor.find(item => (item.id || item._id) === prodId)) {
      return toast.info('Esta prenda ya está en tu tablero de encargo.');
    }

    const tallasIniciales = {};
    prod.tallasCriticas.forEach(tc => {
      tallasIniciales[tc.talla] = 1; 
    });

    const img1 = prod.imageSrc || (prod.images && prod.images[0]?.url) || null;
    const img2 = prod.imageSrc2 || (prod.images && prod.images[1]?.url) || null;

    setPedidoProveedor([...pedidoProveedor, { 
      ...prod, 
      tallasPedidas: tallasIniciales,
      nombreCamiseta: '',
      numeroCamiseta: '',
      parches: '',
      imagen1: img1,
      imagen2: img2
    }]);
    toast.success('Agregado a la lista del encargo');
  };

  const removerDelPedido = (prodId) => {
    setPedidoProveedor(pedidoProveedor.filter(item => (item.id || item._id) !== prodId));
  };

  const actualizarTallaPedido = (prodId, talla, cantidadStr) => {
    const cantidad = Math.max(0, parseInt(cantidadStr) || 0);
    setPedidoProveedor(prev => prev.map(item => {
      if ((item.id || item._id) === prodId) {
        return { ...item, tallasPedidas: { ...item.tallasPedidas, [talla]: cantidad } };
      }
      return item;
    }));
  };

  // --- LÓGICA DEL MODAL DE PERSONALIZACIÓN ---
  const openCustomModal = (item) => {
    setModalItem(item);
    setCustomForm({
      nombre: item.nombreCamiseta || '',
      numero: item.numeroCamiseta || '',
      parches: item.parches || ''
    });
  };

  const saveCustomModal = () => {
    setPedidoProveedor(prev => prev.map(i => {
      if ((i.id || i._id) === (modalItem.id || modalItem._id)) {
        return {
          ...i,
          nombreCamiseta: customForm.nombre,
          numeroCamiseta: customForm.numero,
          parches: customForm.parches
        };
      }
      return i;
    }));
    setModalItem(null);
    toast.success("Personalización guardada con éxito");
  };

  const enviarAlTablero = async () => {
    if (pedidoProveedor.length === 0) return toast.warning('El tablero de encargo está vacío');

    let hasItems = false;
    pedidoProveedor.forEach(item => {
       Object.values(item.tallasPedidas).forEach(cant => { if(cant > 0) hasItems = true; });
    });
    
    if(!hasItems) return toast.warning("No has asignado unidades a pedir.");

    const success = await onCrearRestock(pedidoProveedor);
    
    if (success) {
      setPedidoProveedor([]); 
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* 🔴 LADO IZQUIERDO: RADAR DE INVENTARIO Y BUSCADOR */}
      <div className="flex-1 bg-[#111] p-4 sm:p-6 rounded-2xl border border-gray-800">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-6 mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black italic uppercase text-red-500 flex items-center gap-3">
              <FaExclamationTriangle /> Alerta de Re-Stock
            </h2>
            <p className="text-gray-400 text-xs mt-2">
              Inventario crítico. Mostrando artículos con tallas agotadas (0) o última unidad (1).
            </p>
          </div>

          {/* BUSCADOR */}
          <div className="flex items-center gap-2 bg-black border border-gray-700 rounded-xl px-4 py-2.5 w-full sm:w-64 shadow-inner">
            <FaSearch className="text-gray-500" size={14} />
            <input 
              type="text" 
              placeholder="Buscar modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none w-full placeholder-gray-600"
            />
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-[#0a0a0a]">
            <div className="w-16 h-16 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-800/50">
              <FaExclamationTriangle size={24} className="text-green-500"/>
            </div>
            <p className="text-green-500 font-black uppercase tracking-widest text-sm">Todo sano o sin coincidencias</p>
            <p className="text-gray-500 text-xs mt-2 font-bold">No hay tallas críticas que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* 🔥 RECORREMOS SOLO LOS VISIBLES, NO TODOS */}
              {productosVisibles.map((prod) => (
                <div 
                  key={prod.id || prod._id} 
                  className="bg-[#0a0a0a] rounded-2xl p-4 border border-red-900/30 hover:border-red-600/50 transition-colors shadow-lg flex flex-col h-full group"
                >
                  <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center border border-gray-800">
                    {prod.imageSrc || (prod.images && prod.images[0]?.url) ? (
                      <img 
                        src={prod.imageSrc || prod.images[0]?.url} 
                        alt={prod.name} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <FaImage className="text-gray-700 text-4xl" />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] uppercase font-black bg-black/80 backdrop-blur-md text-gray-300 px-2 py-1 rounded border border-gray-700">
                        {prod.type || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-white uppercase text-xs mb-3 line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                    
                    <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800 mb-4">
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block mb-2 border-b border-gray-800 pb-1">
                        En Peligro
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {prod.tallasCriticas.map((tc, idx) => {
                          const isAgotado = tc.cantidad === 0;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                                isAgotado ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-orange-900/20 border-orange-800 text-orange-400'
                              }`}
                            >
                              <span className="font-black text-xs">{tc.talla}</span>
                              <span className="text-[10px] font-bold opacity-80">({tc.cantidad})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      onClick={() => agregarAlPedido(prod)}
                      className="mt-auto w-full py-2.5 bg-white hover:bg-gray-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                    >
                      <FaPlus size={10} /> Añadir a Encargo
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 🔥 BOTÓN PARA CARGAR MÁS PRODUCTOS */}
            {visibleCount < productosFiltrados.length && (
              <div className="mt-8 flex justify-center border-t border-gray-800 pt-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 15)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-[#D4AF37] rounded-xl font-black uppercase tracking-widest text-[10px] transition cursor-pointer shadow-sm hover:shadow-[#D4AF37]/20 hover:bg-[#1a1a1a]"
                >
                  Cargar más modelos <FaArrowDown size={10} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 📋 LADO DERECHO: TABLERO DE PRÓXIMO PEDIDO (STICKY) */}
      <div className="w-full lg:w-[400px] shrink-0">
        <div className="bg-[#111] p-5 rounded-2xl border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.05)] sticky top-28">
          
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/40">
              <FaClipboardList size={18} />
            </div>
            <div>
              <h3 className="font-black text-white uppercase italic tracking-tight">Próximo Proveedor</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {pedidoProveedor.length} Modelos en lista
              </p>
            </div>
          </div>

          {pedidoProveedor.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-gray-800 rounded-xl bg-black">
              <p className="text-gray-500 text-xs font-bold">El tablero está vacío.</p>
              <p className="text-gray-600 text-[10px] mt-1">Selecciona productos de la izquierda para armar tu próximo encargo.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {pedidoProveedor.map((item) => (
                <div key={item.id || item._id} className="bg-black border border-gray-800 rounded-xl p-3 relative group">
                  
                  <button 
                    onClick={() => removerDelPedido(item.id || item._id)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition"
                  >
                    <FaTrash size={12} />
                  </button>

                  <div className="flex gap-3 mb-3 pr-6">
                    <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden flex-shrink-0">
                      {item.imagen1 ? (
                        <img src={item.imagen1} className="w-full h-full object-cover" alt="miniatura" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FaImage className="text-gray-700 text-xs" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-black bg-gray-900 px-1.5 py-0.5 rounded inline-block mb-1">{item.type || 'N/A'}</p>
                      <h4 className="text-[11px] font-bold text-white uppercase leading-tight line-clamp-2">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-[#111] rounded-lg p-2 border border-gray-800">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-2">Unidades a pedir por talla:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {item.tallasCriticas.map((tc) => (
                        <div key={tc.talla} className="flex flex-col">
                          <label className="text-[9px] font-black text-center text-gray-300 mb-1">{tc.talla}</label>
                          <input 
                            type="number" 
                            min="0"
                            value={item.tallasPedidas[tc.talla] ?? 0}
                            onChange={(e) => actualizarTallaPedido(item.id || item._id, tc.talla, e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded text-center text-xs text-white py-1 focus:border-[#D4AF37] outline-none transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🔥 BOTÓN PARA ABRIR MODALITO DE DORSAL/PARCHES */}
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <button 
                      onClick={() => openCustomModal(item)}
                      className="text-[10px] font-bold text-gray-400 hover:text-[#D4AF37] uppercase flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FaTags size={10} /> {(item.nombreCamiseta || item.numeroCamiseta || item.parches) ? 'Editar Personalización' : 'Añadir Dorsal/Parches'}
                    </button>
                    
                    {/* Muestra lo que escribiste */}
                    {(item.nombreCamiseta || item.numeroCamiseta || item.parches) && (
                      <div className="mt-2 text-[9px] bg-gray-900 px-2 py-1.5 rounded border border-[#D4AF37]/30 text-[#D4AF37]">
                        {(item.nombreCamiseta || item.numeroCamiseta) && (
                          <span className="block font-black uppercase">DORSAL: {item.nombreCamiseta} {item.numeroCamiseta ? `#${item.numeroCamiseta}` : ''}</span>
                        )}
                        {item.parches && (
                          <span className="block font-bold opacity-90 mt-0.5 uppercase">PARCHES: {item.parches}</span>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

          {pedidoProveedor.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <button 
                onClick={enviarAlTablero}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <FaBoxOpen size={14} /> Añadir a 'Hacer Pedido'
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 🔥 MODALITO DE PERSONALIZACIÓN */}
      {modalItem && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-700 text-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="font-black uppercase text-lg text-black mb-4 flex items-center gap-2">
              <FaTags /> Personalizar Encargo
            </h3>
            <p className="text-[11px] font-bold text-gray-400 mb-6 line-clamp-2 leading-tight">{modalItem.name}</p>
            
            <div className="space-y-4">
              
              <div className="flex gap-3 mb-2">
                {modalItem.imagen1 && (
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Foto Ref 1</label>
                    <div className="w-full h-20 bg-black rounded-xl overflow-hidden border border-gray-700">
                      <img src={modalItem.imagen1} className="w-full h-full object-cover" alt="ref1" />
                    </div>
                  </div>
                )}
                {modalItem.imagen2 && (
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Foto Ref 2</label>
                    <div className="w-full h-20 bg-black rounded-xl overflow-hidden border border-gray-700">
                      <img src={modalItem.imagen2} className="w-full h-full object-cover" alt="ref2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Textos */}
              <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nombre en Camiseta</label>
                <input 
                  type="text" 
                  value={customForm.nombre} 
                  onChange={e => setCustomForm({...customForm, nombre: e.target.value})} 
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-[#D4AF37] outline-none transition uppercase" 
                  placeholder="Ej: MESSI" 
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Número</label>
                <input 
                  type="number" 
                  value={customForm.numero} 
                  onChange={e => setCustomForm({...customForm, numero: e.target.value})} 
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-[#D4AF37] outline-none transition" 
                  placeholder="Ej: 10" 
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Parches (Opcional)</label>
                <input 
                  type="text" 
                  value={customForm.parches} 
                  onChange={e => setCustomForm({...customForm, parches: e.target.value})} 
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-[#D4AF37] outline-none transition uppercase" 
                  placeholder="Ej: CHAMPIONS LEAGUE" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalItem(null)} className="w-1/2 py-2.5 border border-red-700 rounded-xl bf-red-500 font-bold text-[11px] hover:bg-red-800 transition cursor-pointer text-black">Cancelar</button>
              <button onClick={saveCustomModal} className="w-1/2 py-2.5 bg-gray-300 hover:bg-gray-500 text-black rounded-xl font-black text-[11px] uppercase tracking-widest transition shadow-lg cursor-pointer">Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}