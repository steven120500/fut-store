import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaCashRegister, FaTshirt, FaUserTie, FaTruck, FaMoneyBillWave, FaPlus, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import QuickSaleModal from '../components/QuickSaleModal';

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
  const [apartadosActivos, setApartadosActivos] = useState([]);

  // Estados de modales
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showComisionModal, setShowComisionModal] = useState(false);

  // Estado para guardar datos de comisión dividida
  const [vendedorComision, setVendedorComision] = useState(null);

  const [loadingCedula, setLoadingCedula] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [submittingComision, setSubmittingComision] = useState(false);
  
  // 🏆 Estados separados para comisiones
  const [comisionPorChema, setComisionPorChema] = useState(600);
  const [comisionPorTacos, setComisionPorTacos] = useState(3000);

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
    requiereEnvio: false, 
    direccionEnvio: '',   
    productos: [
      { tipoVenta: 'stock', productoId: null, nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000, stockDisponible: null, imageSrc: '', type: '' }
    ]
  });

  const subTotalPrendasCalc = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.precioTotal) || 0), 0);
  const totalCantidadPrendas = quickForm.productos.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const costoEnvioCalc = quickForm.requiereEnvio ? (Number(quickForm.costoEnvio) || 0) : 0;
  const granTotalConEnvio = subTotalPrendasCalc + costoEnvioCalc;

  // 🏆 LÓGICA DE SEPARACIÓN GLOBAL PARA EL ENCABEZADO
  const totalChemasVendidas = ranking.reduce((acc, curr) => acc + (curr.totalChemas || 0), 0);
  const totalTacosVendidos = ranking.reduce((acc, curr) => acc + (curr.totalTacos || 0), 0);

  const totalAbonosGlobal = apartadosActivos.reduce((acc, curr) => acc + (Number(curr.abono) || 0), 0);
  const totalDineroIngresado = ranking.reduce((acc, curr) => acc + (curr.montoTotal || 0), 0) + totalAbonosGlobal;

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");

  useEffect(() => {
    fetchRankingData();
    fetchCatalogoProductos();
    fetchApartadosActivos();
  }, []);

  const fetchApartadosActivos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/apartados`);
      if (res.ok) {
        const data = await res.json();
        setApartadosActivos(data);
      }
    } catch (error) {
      console.error("No se pudo cargar los abonos:", error);
    }
  };

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
        let data = await res.json();
        
        // 🛡️ Lógica de protección: Si el backend aún no envía la separación, lo simulamos para no romper el sitio
        data = data.map(emp => {
          if (emp.totalTacos === undefined || emp.totalChemas === undefined) {
             return {
               ...emp,
               totalTacos: 0, 
               totalChemas: emp.totalPrendas || 0 
             }
          }
          return emp;
        });

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

  // 🏆 LÓGICA DE REGISTRO SEPARADO (CHEMAS VS TACOS)
  const handleRegistrarComision = async () => {
    const nombreVendedor = vendedorComision?.nombre || 'Vendedor';
    const cantChemas = vendedorComision?.cantidadChemas || 0;
    const cantTacos = vendedorComision?.cantidadTacos || 0;

    const montoChemas = cantChemas * (Number(comisionPorChema) || 0);
    const montoTacos = cantTacos * (Number(comisionPorTacos) || 0);
    const montoTotalComision = montoChemas + montoTacos;
    
    if (montoTotalComision <= 0) {
      return toast.warning("El monto calculado de comisión debe ser mayor a 0.");
    }

    setSubmittingComision(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify({
          categoria: 'Salarios',
          descripcion: `Comisión de ${nombreVendedor} (${cantChemas} chemas x ₡${comisionPorChema} | ${cantTacos} tacos x ₡${comisionPorTacos})`,
          monto: montoTotalComision,
          fecha: new Date().toISOString()
        })
      });

      if (res.ok) {
        toast.success(`💸 Comisión total de ₡${montoTotalComision.toLocaleString()} registrada para ${nombreVendedor}.`);
        setShowComisionModal(false);
        setVendedorComision(null);
      } else {
        throw new Error("No se pudo registrar la comisión");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor para registrar el gasto.");
    } finally {
      setSubmittingComision(false);
    }
  };

  const handleAddProducto = () => {
    setQuickForm(prev => ({
      ...prev,
      productos: [...prev.productos, { tipoVenta: 'stock', productoId: null, nombre: '', talla: 'L', cantidad: 1, precioTotal: 15000, stockDisponible: null, imageSrc: '', type: '' }]
    }));
  };

  const handleRemoveProducto = (index) => {
    if (quickForm.productos.length === 1) return toast.warning("Debe haber al menos una prenda en la venta.");
    setQuickForm(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }));
  };

  const handleProductoChange = (index, field, value) => {
    const updated = [...quickForm.productos];
    updated[index][field] = value;

    if (field === 'tipoVenta') {
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
      return toast.warning("Por favor escribe el nombre/modelo de todas las prendas agregadas.");
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
        totalPago: subTotalPrendasCalc,
        costoEnvio: quickForm.requiereEnvio ? costoEnvioCalc : 0,           
        direccionEnvio: quickForm.requiereEnvio ? quickForm.direccionEnvio : '', 
        montoTotal: granTotalConEnvio,
        tallaVendida: quickForm.productos[0]?.talla || 'L',
        cantidad: totalCantidadPrendas,
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
          requiereEnvio: false, 
          direccionEnvio: '',   
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

        {/* NAVEGACIÓN Y BOTONES SUPERIORES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase cursor-pointer"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
              >
                <FaRedo size={12} /> Resetear Ventas
              </button>
            )}

            <button 
              onClick={() => setShowQuickSaleModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              <FaPlus size={14} /> Agregar Venta Rápida 
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

          {/* 🏆 TARJETAS GLOBALES CON SEPARACIÓN */}
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-[#111] border border-gray-800 p-4 rounded-xl flex-1 md:w-44 text-center shadow-lg">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block">Prendas Movidas</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {totalChemasVendidas + totalTacosVendidos} <span className="text-xs text-[#D4AF37] font-normal">unds</span>
              </span>
              <div className="flex justify-center gap-3 mt-1 text-[10px] text-gray-500 font-bold">
                 <span>👕 {totalChemasVendidas}</span>
                 <span>👟 {totalTacosVendidos}</span>
              </div>
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

              const abonosDelVendedor = apartadosActivos
                .filter(ap => ap.vendedor === emp._id)
                .reduce((acc, curr) => acc + (Number(curr.abono) || 0), 0);

              const aporteTotalReal = (emp.montoTotal || 0) + abonosDelVendedor;

              const numChemas = emp.totalChemas || 0;
              const numTacos = emp.totalTacos || 0;

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
                      
                      {/* 🏆 RENGLONES SEPARADOS PARA CHEMAS Y TACOS */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><FaTshirt className="text-gray-600"/> Chemas movidas:</span>
                        <span className="font-black text-[#D4AF37] text-sm">{numChemas} unds</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><span className="text-gray-600">👟</span> Tacos movidos:</span>
                        <span className="font-black text-[#D4AF37] text-sm">{numTacos} prs</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2"><FaTruck className="text-gray-600"/> Envíos cobrados:</span>
                        <span className="font-bold text-blue-400">₡{emp.enviosGenerados?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-black/60 p-3 rounded-xl border border-gray-800 flex justify-between items-center mt-2">
                      <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Aporte Total</span>
                      <span className="text-lg font-black text-green-500">₡{aporteTotalReal.toLocaleString()}</span>
                    </div>

                    {isSuperUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setVendedorComision({ 
                            nombre: emp._id, 
                            cantidadChemas: numChemas,
                            cantidadTacos: numTacos
                          });
                          setShowComisionModal(true);
                        }}
                        className="w-full mt-3 py-2.5 bg-amber-600/15 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 hover:border-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                         Sacar Comisión 
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 🏆 MODAL DE REGISTRO DE COMISIÓN SEPARADO (CHEMAS VS TACOS) */}
      {showComisionModal && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
              <FaMoneyBillWave size={24} />
            </div>

            <h3 className="font-black uppercase text-base tracking-tight mb-1">
              Comisión para: <span className="text-amber-600">{vendedorComision?.nombre || 'Vendedor'}</span>
            </h3>
            <p className="text-xs text-gray-600 font-medium mb-4 px-2">
              Se calculará la comisión multiplicando las ventas por sus respectivos montos unitarios.
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border text-left mb-6 space-y-4">
              
              {/* Sección Chemas */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><FaTshirt className="text-gray-400"/> Comisión Chemas</label>
                  <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{vendedorComision?.cantidadChemas || 0} vendidas</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={comisionPorChema} 
                  onChange={e => setComisionPorChema(e.target.value)}
                  placeholder="600"
                  className="w-full border p-2 rounded-xl text-sm font-black text-green-700 bg-white focus:border-black outline-none font-mono"
                />
              </div>

              {/* Sección Tacos */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><span className="text-gray-400">👟</span> Comisión Tacos</label>
                  <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{vendedorComision?.cantidadTacos || 0} vendidos</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={comisionPorTacos} 
                  onChange={e => setComisionPorTacos(e.target.value)}
                  placeholder="3000"
                  className="w-full border p-2 rounded-xl text-sm font-black text-green-700 bg-white focus:border-black outline-none font-mono"
                />
              </div>

              {/* Totalizador */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-black">
                <span className="text-gray-600 uppercase text-[10px]">Total a registrar:</span>
                <span className="text-green-600 text-lg">
                  ₡{(((vendedorComision?.cantidadChemas || 0) * (Number(comisionPorChema) || 0)) + ((vendedorComision?.cantidadTacos || 0) * (Number(comisionPorTacos) || 0))).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowComisionModal(false);
                  setVendedorComision(null);
                }} 
                className="w-1/2 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={submittingComision || ((vendedorComision?.cantidadChemas || 0) === 0 && (vendedorComision?.cantidadTacos || 0) === 0)}
                onClick={handleRegistrarComision} 
                className="w-1/2 py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {submittingComision ? 'Guardando...' : 'REGISTRAR GASTO '}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESETEO */}
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
                {resetting ? 'Vaciando...' : 'SÍ, RESETEAR '}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 COMPONENTE DEL MODAL DE VENTA RÁPIDA EXTRAÍDO */}
      <QuickSaleModal 
        showQuickSaleModal={showQuickSaleModal}
        setShowQuickSaleModal={setShowQuickSaleModal}
        quickForm={quickForm}
        setQuickForm={setQuickForm}
        handleQuickSaleSubmit={handleQuickSaleSubmit}
        submitting={submitting}
        loadingCedula={loadingCedula}
        catalogo={catalogo}
        VENDEDORES={VENDEDORES}
        displayName={displayName}
        totalCantidadChemas={totalCantidadPrendas}
        granTotalConEnvio={granTotalConEnvio}
        handleProductoChange={handleProductoChange}
        handleRemoveProducto={handleRemoveProducto}
        handleAddProducto={handleAddProducto}
        handleSelectFromCatalogo={handleSelectFromCatalogo}
      />

      <Footer />
    </div>
  );
}