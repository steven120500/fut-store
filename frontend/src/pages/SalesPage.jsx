import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaCashRegister, FaTshirt, FaUserTie, FaTruck, FaMoneyBillWave, FaPlus, FaTimes, FaIdCard, FaPhone, FaUser, FaRedo, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Header from '../components/Header';
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

  // Estados de Modales
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

  // 🛍️ ESTADO MULTIPRODUCTO: Ahora manejamos una lista de chemas en el pedido
  const [quickForm, setQuickForm] = useState({
    cedula: '',
    nombre: '',
    numero: '',
    costoEnvio: 0,
    vendedorAsignado: getInitialVendedor(),
    productos: [
      { nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000 }
    ]
  });

  // Cálculos dinámicos
  const subTotalChemasCalc = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.precioTotal) || 0), 0);
  const totalCantidadChemas = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const costoEnvioCalc = Number(quickForm.costoEnvio) || 0;
  const granTotalConEnvio = subTotalChemasCalc + costoEnvioCalc;

  const totalChemasVendidas = ranking.reduce((acc, curr) => acc + (curr.totalPrendas || 0), 0);
  const totalDineroIngresado = ranking.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");

  useEffect(() => {
    fetchRankingData();
  }, []);

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

  // 🛍️ FUNCIONES PARA AGREGAR / EDITAR / ELIMINAR PRENDAS DEL PEDIDO
  const handleAddProducto = () => {
    setQuickForm(prev => ({
      ...prev,
      productos: [...prev.productos, { nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000 }]
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
    setQuickForm(prev => ({ ...prev, productos: updated }));
  };

  const handleQuickSaleSubmit = async (e) => {
    e.preventDefault();
    if (!quickForm.cedula || !quickForm.nombre || !quickForm.numero) {
      return toast.warning("Por favor completa los datos del cliente.");
    }

    // Validar que todas las chemas tengan nombre
    const hasEmptyChema = quickForm.productos.some(p => !p.nombre || p.nombre.trim() === '');
    if (hasEmptyChema) {
      return toast.warning("Por favor escribe el nombre/modelo de todas las chemas agregadas.");
    }

    setSubmitting(true);
    try {
      // Generar nombre descriptivo combinado si son varias
      const resumenChemas = quickForm.productos
        .map(p => `${p.cantidad}x ${p.nombre} (${p.talla})`)
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
        toast.success(`💰 Venta registrada a nombre de ${quickForm.vendedorAsignado} (${totalCantidadChemas} chemas)`);
        setShowQuickSaleModal(false);
        setQuickForm({
          cedula: '',
          nombre: '',
          numero: '',
          costoEnvio: 0,
          vendedorAsignado: getInitialVendedor(),
          productos: [{ nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000 }]
        });
        fetchRankingData(); 
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
      <Header user={user} onLogout={onLogout} isSuperUser={isSuperUser} />

      <div className="flex-grow pt-40 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* NAVEGACIÓN Y BOTONES SUPERIORES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95"
              >
                <FaRedo size={12} /> Resetear Ventas (Fin de Mes)
              </button>
            )}

            <button 
              onClick={() => setShowQuickSaleModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95"
            >
              <FaPlus size={14} /> Agregar Venta Rápida 🚀
            </button>
          </div>
        </div>

        {/* ENCABEZADO Y TARJETAS DE RESUMEN */}
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

        {/* CONTENIDO: RANKING */}
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

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE CIERRE DE MES */}
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

      {/* 🚀 MODAL DE VENTA RÁPIDA MULTIPRODUCTO */}
      {showQuickSaleModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button 
              type="button"
              onClick={() => setShowQuickSaleModal(false)}
              className="absolute bg-gray-100 text-black top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition font-bold"
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

              {/* SECCIÓN DE DATOS DEL CLIENTE (SE LLENA 1 SOLA VEZ) */}
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

              {/* 🛍️ SECCIÓN MULTIPRODUCTO: LISTA DINÁMICA DE CHEMAS */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">👕 Chemas del Pedido ({quickForm.productos.length})</label>
                  <button 
                    type="button" 
                    onClick={handleAddProducto} 
                    className="text-[10px] font-black text-green-700 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <FaPlus size={9} /> Agregar Otra Chema
                  </button>
                </div>

                {quickForm.productos.map((prod, index) => (
                  <div key={index} className="border border-gray-200 p-3 rounded-xl bg-gray-50/80 space-y-2 relative">
                    {quickForm.productos.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveProducto(index)} 
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-200 transition shadow"
                        title="Quitar chema"
                      >
                        <FaTimes size={10} />
                      </button>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Modelo #{index + 1} *</label>
                      <input 
                        type="text" 
                        required 
                        value={prod.nombre} 
                        onChange={e => handleProductoChange(index, 'nombre', e.target.value)} 
                        placeholder="Ej: Real Madrid Local 2026" 
                        className="w-full border p-2 rounded-lg text-xs font-bold focus:border-black outline-none bg-white" 
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-1.5 items-center">
                      <div className="col-span-4">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Talla</label>
                        <select 
                          value={prod.talla} 
                          onChange={e => handleProductoChange(index, 'talla', e.target.value)} 
                          className="w-full border p-1.5 rounded-lg text-xs font-bold focus:border-black outline-none bg-white h-8"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 text-center">Cant.</label>
                        <input 
                          type="number" 
                          min="1" 
                          required 
                          value={prod.cantidad} 
                          onChange={e => handleProductoChange(index, 'cantidad', e.target.value)} 
                          className="w-full border p-1.5 rounded-lg text-xs font-black text-center focus:border-black outline-none bg-amber-50 h-8" 
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Precio (₡)</label>
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
                ))}
              </div>

              {/* ENVÍO ÚNICO POR PEDIDO */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">🚚 Costo de Envío del Pedido (₡)</label>
                <input 
                  type="number" 
                  required 
                  value={quickForm.costoEnvio} 
                  onChange={e => setQuickForm({...quickForm, costoEnvio: e.target.value})} 
                  placeholder="0" 
                  className="w-full border p-2.5 rounded-xl text-xs font-bold text-blue-600 focus:border-black outline-none bg-blue-50/30" 
                />
              </div>

              {/* TOTAL GENERAL */}
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex justify-between items-center text-xs mt-3">
                <div>
                  <span className="font-bold text-green-800 flex items-center gap-1.5">
                    <FaMoneyBillWave /> TOTAL PEDIDO:
                  </span>
                  <span className="text-[10px] text-green-600 font-medium">{totalCantidadChemas} chemas en total</span>
                </div>
                <span className="font-black text-green-700 text-base">
                  ₡{granTotalConEnvio.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowQuickSaleModal(false)} 
                  className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || loadingCedula} 
                  className="w-2/3 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider"
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