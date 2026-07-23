import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaCashRegister, FaTshirt, FaUserTie, FaTruck, FaMoneyBillWave, FaPlus, FaTimes, FaIdCard, FaPhone, FaUser, FaRedo, FaExclamationTriangle, FaSearch, FaCheckCircle, FaBoxOpen } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';

const API_BASE = "https://fut-store.onrender.com";

const VENDEDORES = [
  'LaR Delflow',
  'Justin Lobo',
  'Carlos Lobo',
  'Alonso Lobo',
  'Dylan Gomez',
  'Steven Corrales'
];

export default function SalesPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const [catalogo, setCatalogo] = useState([]);

  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const displayName = user?.firstName || user?.username || user?.email || 'Steven Corrales';

  const getInitialVendedor = () => {
    const cleanName = displayName.toLowerCase();
    const found = VENDEDORES.find(v => cleanName.includes(v.toLowerCase().split(' ')[0]));
    return found || 'Steven Corrales';
  };

  const [quickForm, setQuickForm] = useState({
    cedula: '',
    nombre: '',
    numero: '',
    costoEnvio: 0,
    vendedorAsignado: getInitialVendedor(),
    productos: [
      { tipoVenta: 'stock', productoId: null, nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000, stockDisponible: null, imageSrc: '', type: '' }
    ]
  });

  const subTotalChemasCalc = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.precioTotal) || 0), 0);
  const totalCantidadChemas = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const costoEnvioCalc = Number(quickForm.costoEnvio) || 0;
  const granTotalConEnvio = subTotalChemasCalc + costoEnvioCalc;

  const totalChemasVendidas = ranking.reduce((acc, curr) => acc + (curr.totalPrendas || 0), 0);
  const totalDineroIngresado = ranking.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");

  useEffect(() => {
    fetchRankingData();
    fetchCatalogoProductos();
  }, []);

  const fetchCatalogoProductos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products/all-pos`);
      if (res.ok) {
        const data = await res.json();
        let listaProductos = Array.isArray(data) ? data : (data.items || data.products || []);
        
        listaProductos.sort((a, b) => {
          const fechaA = new Date(a.createdAt || 0);
          const fechaB = new Date(b.createdAt || 0);
          if (fechaB - fechaA !== 0) return fechaB - fechaA;
          return String(b._id || b.id || '').localeCompare(String(a._id || a.id || ''));
        });

        setCatalogo(listaProductos);
      }
    } catch (error) {
      console.error("No se pudo conectar con el catálogo:", error);
    }
  };

  useEffect(() => {
    const checkCedulaTSE = async () => {
      const cleanCedula = quickForm.cedula.replace(/\D/g, '');
      if (cleanCedula.length === 9) {
        setLoadingCedula(true);
        try {
          const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanCedula}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.nombre) {
              setQuickForm(prev => ({ ...prev, nombre: data.nombre }));
              toast.success("Cliente encontrado en el registro");
            }
          }
        } catch (error) {
          console.error("No se pudo obtener el nombre:", error);
        } finally {
          setLoadingCedula(false);
        }
      }
    };
    checkCedulaTSE();
  }, [quickForm.cedula]);

  const fetchRankingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/ranking`);
      if (res.ok) {
        const data = await res.json();
        setRanking(data);
      }
    } catch (error) {
      console.error("Error cargando ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmResetMonthlySales = async () => {
    setResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/reset/all`, {
        method: 'DELETE',
        headers: { 'x-user': displayName }
      });

      if (res.ok) {
        toast.success("🔄 ¡Ventas reseteadas con éxito para el nuevo mes!");
        setShowResetModal(false);
        fetchRankingData(); 
      } else {
        throw new Error("No se pudo resetear");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor para el reseteo.");
    } finally {
      setResetting(false);
    }
  };

  const handleAddProducto = () => {
    setQuickForm(prev => ({
      ...prev,
      productos: [...prev.productos, { tipoVenta: 'stock', productoId: null, nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000, stockDisponible: null, imageSrc: '', type: '' }]
    }));
  };

  const handleRemoveProducto = (index) => {
    if (quickForm.productos.length === 1) return toast.warning("Debe haber al menos una chema en la venta.");
    setQuickForm(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }));
  };

  const handleProductoChange = (index, field, value) => {
    const updated = [...quickForm.productos];
    updated[index][field] = value;
    
    if (field === 'tipoVenta') {
      // Si cambia entre Stock y Pedido Especial, limpiamos los datos anteriores
      updated[index].productoId = null;
      updated[index].nombre = '';
      updated[index].stockDisponible = null;
      updated[index].imageSrc = '';
      updated[index].type = '';
    }

    if (field === 'nombre' && updated[index].productoId) {
      updated[index].productoId = null;
      updated[index].stockDisponible = null;
      updated[index].imageSrc = '';
      updated[index].type = '';
    }

    if (field === 'talla' && updated[index].productoId) {
      const prodInCat = catalogo.find(p => (p.id || p._id) === updated[index].productoId);
      if (prodInCat && prodInCat.stock) {
        updated[index].stockDisponible = Number(prodInCat.stock[value]) || 0;
      }
    }

    setQuickForm(prev => ({ ...prev, productos: updated }));
  };

  const handleSelectFromCatalogo = (index, itemCat) => {
    const updated = [...quickForm.productos];
    const itemId = itemCat.id || itemCat._id;
    
    const precioFinal = itemCat.discountPrice ? itemCat.discountPrice : (itemCat.price || 15000);
    
    let tallasDisponibles = itemCat.stock ? Object.keys(itemCat.stock).filter(k => Number(itemCat.stock[k]) > 0) : [];
    let tallaAUsar = tallasDisponibles.length > 0 ? tallasDisponibles[0] : (updated[index].talla || 'L');

    const stockActualTalla = itemCat.stock ? (Number(itemCat.stock[tallaAUsar]) || 0) : null;

    updated[index] = {
      ...updated[index],
      productoId: itemId,
      nombre: itemCat.name,
      precioTotal: precioFinal * (Number(updated[index].cantidad) || 1),
      talla: tallaAUsar,
      stockDisponible: stockActualTalla,
      imageSrc: itemCat.imageSrc || (itemCat.images?.[0]?.url || ''),
      type: itemCat.type || 'Camiseta'
    };

    setQuickForm(prev => ({ ...prev, productos: updated }));
  };

  const handleQuickSaleSubmit = async (e) => {
    e.preventDefault();
    if (!quickForm.cedula || !quickForm.nombre || !quickForm.numero) {
      return toast.warning("Por favor completa los datos del cliente.");
    }

    for (const p of quickForm.productos) {
      if (p.tipoVenta === 'stock' && p.productoId && p.stockDisponible !== null) {
        const cantVendida = Number(p.cantidad) || 1;
        if (cantVendida > p.stockDisponible) {
          return toast.error(`Stock insuficiente para "${p.nombre}" en talla ${p.talla}. Disponibles: ${p.stockDisponible} unds.`);
        }
      }
    }

    const hasEmptyChema = quickForm.productos.some(p => !p.nombre || p.nombre.trim() === '');
    if (hasEmptyChema) {
      return toast.warning("Por favor escribe el nombre/modelo de todas las chemas agregadas.");
    }

    setSubmitting(true);
    try {
      const resumenChemas = quickForm.productos
        .map(p => `${p.cantidad}x ${p.nombre} (${p.talla})${p.type ? ` [${p.type}]` : ''}`)
        .join(' + ');

      const salePayload = {
        cedula: quickForm.cedula,
        nombre: quickForm.nombre,
        numero: quickForm.numero,
        totalPago: subTotalChemasCalc,
        costoEnvio: costoEnvioCalc,
        montoTotal: granTotalConEnvio,
        tallaVendida: quickForm.productos[0]?.talla || 'L',
        cantidad: totalCantidadChemas,
        productoNombre: resumenChemas,
        productos: quickForm.productos,
        vendedor: quickForm.vendedorAsignado,
        fecha: new Date().toISOString()
      };

      const res = await fetch(`${API_BASE}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify(salePayload),
      });

      if (res.ok) {
        toast.success(`💰 Venta registrada con éxito. ¡Inventario actualizado!`);
        setShowQuickSaleModal(false);
        setQuickForm({
          cedula: '',
          nombre: '',
          numero: '',
          costoEnvio: 0,
          vendedorAsignado: getInitialVendedor(),
          productos: [{ tipoVenta: 'stock', productoId: null, nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000, stockDisponible: null, imageSrc: '', type: '' }]
        });
        fetchRankingData(); 
        fetchCatalogoProductos(); 
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      toast.error("Error al registrar la venta rápida.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      <div className="flex-grow pt-40 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* NAVEGACIÓN Y BOTONES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase cursor-pointer"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
              >
                <FaRedo size={12} /> Resetear Ventas (Fin de Mes)
              </button>
            )}

            <button 
              onClick={() => setShowQuickSaleModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              <FaPlus size={14} /> Agregar Venta Rápida 🚀
            </button>
          </div>
        </div>

        {/* ENCABEZADO */}
        <div className="border-b border-gray-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-[#D4AF37] flex items-center gap-3 tracking-tighter">
              <FaTrophy /> Ranking de Empleados
            </h1>
            <p className="text-gray-400 text-xs mt-1">Monitoreo de rendimiento del equipo y total de ventas registradas.</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-[#111] border border-gray-800 p-4 rounded-xl flex-1 md:w-44 text-center shadow-lg">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block">Total Chemas</span>
              <span className="text-2xl font-black text-white mt-1 block">{totalChemasVendidas} <span className="text-xs text-[#D4AF37] font-normal">unds</span></span>
            </div>
            <div className="bg-[#111] border border-[#D4AF37]/40 p-4 rounded-xl flex-1 md:w-52 text-center shadow-[0_0_15px_rgba(212,175,55,0.08)]">
              <span className="text-[10px] text-[#D4AF37] uppercase font-black tracking-widest block">Ingreso Bruto Total</span>
              <span className="text-2xl font-black text-green-500 mt-1 block">₡{totalDineroIngresado.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* RANKING */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Calculando el ranking del equipo...
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800 text-gray-500 text-sm font-bold uppercase">
            Aún no se han registrado ventas en el sistema.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ranking.map((emp, index) => {
              const esOro = index === 0;
              const esPlata = index === 1;
              const esBronce = index === 2;

              return (
                <div 
                  key={emp._id} 
                  className={`bg-[#0a0a0a] rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    esOro ? 'border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.15)] bg-gradient-to-b from-[#1a1813] to-[#0a0a0a]' :
                    esPlata ? 'border-gray-400 shadow-lg' :
                    esBronce ? 'border-amber-700/60 shadow-md' : 'border-gray-800'
                  }`}
                >
                  <div className="absolute top-4 right-4 text-2xl">
                    {esOro && <span title="1er Lugar">🥇</span>}
                    {esPlata && <span title="2do Lugar">🥈</span>}
                    {esBronce && <span title="3er Lugar">🥉</span>}
                    {index > 2 && <span className="text-xs font-black bg-gray-800 text-gray-400 px-2 py-1 rounded-full">#{index + 1}</span>}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[#D4AF37] font-black text-lg shadow-inner">
                        <FaUserTie />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Vendedor</span>
                        <h3 className="font-black text-lg text-white truncate max-w-[150px] uppercase">{emp._id}</h3>
                      </div>
                    </div>

                    <div className="space-y-2 my-6 border-y border-gray-800/80 py-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><FaCashRegister className="text-gray-600"/> Transacciones:</span>
                        <span className="font-bold text-white">{emp.totalVentas}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><FaTshirt className="text-gray-600"/> Chemas movidas:</span>
                        <span className="font-black text-[#D4AF37] text-sm">{emp.totalPrendas} unds</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><FaTruck className="text-gray-600"/> Envíos cobrados:</span>
                        <span className="font-bold text-blue-400">₡{emp.enviosGenerados?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/60 p-3 rounded-xl border border-gray-800 flex justify-between items-center mt-2">
                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Aporte Total</span>
                    <span className="text-lg font-black text-green-500">₡{emp.montoTotal?.toLocaleString() || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ⚠️ MODAL DE RESETEO */}
      {showResetModal && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <FaExclamationTriangle size={24} />
            </div>

            <h3 className="font-black uppercase text-base tracking-tight mb-2">¿Realizar Cierre de Mes?</h3>
            <p className="text-xs text-gray-600 font-medium mb-6 px-2">
              Esta acción borrará <strong className="text-red-600">todas las ventas y comisiones</strong> del ranking actual para dejar las cuentas en cero. ¿Estás completamente seguro?
            </p>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowResetModal(false)} 
                className="w-1/2 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={resetting}
                onClick={confirmResetMonthlySales} 
                className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider"
              >
                {resetting ? 'Vaciando...' : 'SÍ, RESETEAR ⚠️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL DE VENTA RÁPIDA (SIN ESPACIO EXCESIVO, PB-6) */}
      {showQuickSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto pb-6">
            
            <button 
              type="button"
              onClick={() => setShowQuickSaleModal(false)}
              className="absolute bg-gray-100 text-black top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition font-bold z-10 cursor-pointer"
            >
              <FaTimes size={14} />
            </button>

            <div className="flex items-center gap-3 border-b pb-3 mb-4 pr-10">
              <div className="w-10 h-10 bg-black text-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCashRegister size={18} />
              </div>
              <div>
                <h3 className="font-black uppercase text-sm tracking-tight">Registro de Venta Rápida</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Sesión: {displayName}</p>
              </div>
            </div>

            <form onSubmit={handleQuickSaleSubmit} className="space-y-3">
              
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
                <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider block border-b pb-1">👤 Datos del Cliente</span>
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
                    {loadingCedula && <span className="text-[9px] font-bold text-amber-600 animate-pulse">🇨🇷 Buscando en TSE...</span>}
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
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">👕 Chemas del Pedido ({quickForm.productos.length})</label>
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
                    <div key={index} className="border border-gray-200 p-3 rounded-xl bg-gray-50/80 space-y-2 relative">
                      {quickForm.productos.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveProducto(index)} 
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-200 transition shadow cursor-pointer"
                          title="Quitar chema"
                        >
                          <FaTimes size={10} />
                        </button>
                      )}

                      {/* 🔘 SELECTOR DE PUNTOS: STOCK VS PEDIDO ESPECIAL */}
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

                      {/* VISTA MINIMALISTA SI ESTÁ VINCULADO (MODO STOCK) */}
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

                      {/* CAMPO DE BUSCADOR (SI ES STOCK) O INPUT LIBRE (SI ES PEDIDO ESPECIAL) */}
                      {prod.tipoVenta === 'stock' ? (
                        <div className="relative">
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

                          {/* 📋 LISTA DESPLEGABLE */}
                          {!prod.productoId && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100">
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
                        /* MODO PEDIDO ESPECIAL (TEXTO LIBRE) */
                        <div>
                          <input 
                            type="text" 
                            required 
                            value={prod.nombre} 
                            onChange={e => handleProductoChange(index, 'nombre', e.target.value)} 
                            placeholder="Escribe el nombre del encargo o pedido especial..." 
                            className="w-full border p-2 rounded-lg text-xs font-bold bg-blue-50/40 border-blue-300 text-blue-900 outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {/* TALLA / CANTIDAD / PRECIO */}
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

              {/* ENVÍO */}
              <div className="pt-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">🚚 Costo de Envío (₡)</label>
                <input 
                  type="number" 
                  required 
                  value={quickForm.costoEnvio} 
                  onChange={e => setQuickForm({...quickForm, costoEnvio: e.target.value})} 
                  placeholder="0" 
                  className="w-full border p-2 rounded-xl text-xs font-bold text-blue-600 focus:border-black outline-none bg-blue-50/30" 
                />
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

              {/* BOTONES FINALES STICKY */}
              <div className="flex gap-2 pt-3 border-t mt-4 bg-white sticky bottom-0 pb-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickSaleModal(false)} 
                  className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || loadingCedula} 
                  className="w-2/3 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'CONFIRMAR VENTA 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}