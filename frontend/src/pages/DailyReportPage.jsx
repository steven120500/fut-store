import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaMoneyBillWave, FaTshirt, FaTruck, FaCashRegister, FaFilePdf, FaRedo, FaExclamationTriangle, FaTrash, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = "https://fut-store.onrender.com";

// Obtener el mes actual en formato YYYY-MM según hora de Costa Rica
const getCurrentMonthCR = () => {
  const now = new Date();
  const crDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }));
  const year = crDate.getFullYear();
  const month = String(crDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Obtener el YYYY-MM de cualquier fecha guardada en BD
const getItemMonthCR = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const crDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }));
  const year = crDate.getFullYear();
  const month = String(crDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function DailyReportPage({ user, onLogout }) {
  const navigate = useNavigate();
  
  const [sales, setSales] = useState([]);
  const [apartadosActivos, setApartadosActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 📅 Estado para filtrar automáticamente por el mes actual (se resetea solo cada mes)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthCR());

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const displayName = user?.firstName || user?.username || 'Admin';

  useEffect(() => {
    fetchAllSales();
    fetchApartadosActivos();
  }, []);

  const fetchAllSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        throw new Error("Error al obtener datos");
      }
    } catch (error) {
      console.error("Error en reporte:", error);
      toast.error("No se pudo cargar el historial de ventas.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApartadosActivos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/apartados`);
      if (res.ok) {
        const data = await res.json();
        setApartadosActivos(data);
      }
    } catch (error) {
      console.error("Error al cargar apartados:", error);
    }
  };

  // 🗑️ ELIMINAR UNA VENTA INDIVIDUAL
  const handleDeleteSale = async (saleId) => {
    try {
      const res = await fetch(`${API_BASE}/api/sales/${saleId}`, {
        method: 'DELETE',
        headers: { 'x-user': displayName }
      });

      if (res.ok) {
        toast.success("🗑️ Venta eliminada correctamente");
        setSales(prev => prev.filter(s => s._id !== saleId));
        setDeletingId(null);
      } else {
        throw new Error("No se pudo eliminar la venta");
      }
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      toast.error("Error al conectar con el servidor para eliminar la venta.");
    }
  };

  // 🔄 1. COMBINAR Y ORDENAR TODAS LAS VENTAS Y APARTADOS
  const allCombinedHistory = [
    ...sales.map(s => ({ ...s, isApartado: false, sortDate: new Date(s.fecha || s.createdAt || 0).getTime() })),
    ...apartadosActivos.map(a => ({ ...a, isApartado: true, sortDate: new Date(a.fecha || a.fechaCreacion || a.createdAt || 0).getTime() }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  // 🔄 2. FILTRAR POR EL MES SELECCIONADO (RESETEO AUTOMÁTICO MENSUAL)
  const combinedHistory = selectedMonth === 'ALL'
    ? allCombinedHistory
    : allCombinedHistory.filter(item => {
        const dateStr = item.fecha || item.fechaCreacion || item.createdAt;
        return getItemMonthCR(dateStr) === selectedMonth;
      });

  // 👕 FUNCIÓN MEJORADA: Detalle específico y compatible con Ventas Web, Tienda y Apartados
  const getResumenPrendas = (item) => {
    if (item.productos && item.productos.length > 0) {
      return item.productos.map(p => {
        const nombreItem = item.isApartado 
          ? (p.tipoPedido === 'stock' ? p.busqueda : p.descripcionManual) 
          : (p.nombre || p.productoNombre || p.name || item.productoNombre || 'Artículo');
        
        const tallaItem = p.talla || p.tallaVendida || p.size || item.tallaVendida || 'Estándar';
        const versionItem = p.version ? ` [${p.version.toUpperCase()}]` : '';
        const cantItem = p.cantidad || p.quantity || 1;

        return `${cantItem}x ${nombreItem}${versionItem} (${tallaItem})`;
      }).join(' + ');
    }
    return `${item.cantidad || 1}x ${item.productoNombre || 'Camiseta'} (${item.tallaVendida || 'N/A'})`;
  };

  // 🔢 FUNCIÓN AUXILIAR: Contar total de unidades en una transacción
  const getCantidadPrendasItem = (item) => {
    if (item.productos && item.productos.length > 0) {
      return item.productos.reduce((sum, p) => sum + (Number(p.cantidad || p.quantity) || 1), 0);
    }
    return Number(item.cantidad) || 1;
  };

  // 📄 EXPORTAR PDF DIARIO
  const exportDailyPDF = () => {
    const hoyCR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });

    const dailyCombined = allCombinedHistory.filter(item => {
      const dateString = item.fecha || item.fechaCreacion || item.createdAt;
      if (!dateString) return false;
      const itemDateCR = new Date(dateString).toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
      return itemDateCR === hoyCR;
    });

    if (dailyCombined.length === 0) {
      return toast.warning(`No hay transacciones registradas hoy (${hoyCR}) para exportar.`);
    }

    const doc = new jsPDF('landscape');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(`FUTSTORE CR - CORTE DE CAJA DIARIO (${hoyCR})`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${displayName}`, 14, 28);

    const tableData = dailyCombined.map((item, index) => {
      const cantPrendas = getCantidadPrendasItem(item);
      const dateVal = item.fecha || item.fechaCreacion || item.createdAt;
      return [
        index + 1,
        dateVal ? new Date(dateVal).toLocaleTimeString('es-CR', { timeZone: 'America/Costa_Rica', hour: '2-digit', minute: '2-digit' }) : 'N/A',
        `${item.vendedor || 'General'} ${item.isApartado ? '(APARTADO)' : ''}`,
        item.nombre || item.cliente || 'N/A',
        item.cedula || 'N/A',
        item.numero || item.telefono || 'N/A',
        item.direccionEnvio || 'N/A',
        getResumenPrendas(item),
        cantPrendas,
        `CRC ${(item.isApartado ? item.precioTotal : item.totalPago || 0).toLocaleString()}`,
        item.isApartado ? 'N/A' : `CRC ${(item.costoEnvio || 0).toLocaleString()}`,
        `CRC ${(item.isApartado ? item.abono : item.montoTotal || 0).toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Hora', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Dirección', 'Detalle Prendas', 'Cant.', 'Prendas (CRC)', 'Envio (CRC)', 'Caja (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 10 },
      columnStyles: { 6: { cellWidth: 35 } }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemas = dailyCombined.reduce((sum, item) => sum + getCantidadPrendasItem(item), 0);
    const granTotal = dailyCombined.reduce((sum, item) => sum + (Number(item.isApartado ? item.abono : item.montoTotal) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Prendas Movidas Hoy: ${totalChemas} unds`, 14, finalY);
    doc.text(`Gran Total Entrado en Caja Hoy: CRC ${granTotal.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Corte_Diario_${hoyCR}.pdf`);
    toast.success("📄 PDF Diario exportado correctamente");
  };

  // 📄 EXPORTAR PDF MENSUAL (Respeta el mes seleccionado)
  const exportMonthlyPDF = () => {
    if (!combinedHistory || combinedHistory.length === 0) {
      return toast.warning("No hay transacciones registradas en este periodo para exportar.");
    }

    const doc = new jsPDF('landscape');
    const labelPeriodo = selectedMonth === 'ALL' 
      ? 'HISTORIAL COMPLETO' 
      : new Date(`${selectedMonth}-15T12:00:00`).toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(`FUTSTORE CR - REPORTE MENSUAL DE CAJA (${labelPeriodo})`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${displayName}`, 14, 28);

    const tableData = combinedHistory.map((item, index) => {
      const cantPrendas = getCantidadPrendasItem(item);
      const dateVal = item.fecha || item.fechaCreacion || item.createdAt;
      return [
        index + 1,
        dateVal ? new Date(dateVal).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' }) : 'N/A',
        `${item.vendedor || 'General'} ${item.isApartado ? '(APARTADO)' : ''}`,
        item.nombre || item.cliente || 'N/A',
        item.cedula || 'N/A',
        item.numero || item.telefono || 'N/A',
        item.direccionEnvio || 'N/A',
        getResumenPrendas(item),
        cantPrendas,
        `CRC ${(item.isApartado ? item.precioTotal : item.totalPago || 0).toLocaleString()}`,
        item.isApartado ? 'N/A' : `CRC ${(item.costoEnvio || 0).toLocaleString()}`,
        `CRC ${(item.isApartado ? item.abono : item.montoTotal || 0).toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Fecha', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Dirección', 'Detalle Prendas', 'Cant.', 'Prendas (CRC)', 'Envio (CRC)', 'Caja (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 10 },
      columnStyles: { 6: { cellWidth: 35 } }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemasMes = combinedHistory.reduce((sum, item) => sum + getCantidadPrendasItem(item), 0);
    const granTotalMes = combinedHistory.reduce((sum, item) => sum + (Number(item.isApartado ? item.abono : item.montoTotal) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Prendas Movidas en el Mes: ${totalChemasMes} unds`, 14, finalY);
    doc.text(`Ingreso Bruto Total Mensual (Caja): CRC ${granTotalMes.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Reporte_Mensual_Caja_${labelPeriodo.replace(/\s+/g, '_')}.pdf`);
    toast.success("📄 PDF Mensual exportado correctamente");
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
        fetchAllSales(); 
      } else {
        throw new Error("No se pudo resetear");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor para el reseteo.");
    } finally {
      setResetting(false);
    }
  };

  // 🏆 LÓGICA EXACTA DE TOTALES DEL MES SELECCIONADO (SIN MEZCLAR MESES PASADOS)
  const ventasDelPeriodo = combinedHistory.filter(i => !i.isApartado);
  const apartadosDelPeriodo = combinedHistory.filter(i => i.isApartado);

  const totalDineroEnvios = ventasDelPeriodo.reduce((sum, item) => sum + (Number(item.costoEnvio) || 0), 0);
  const totalAbonosActivos = apartadosDelPeriodo.reduce((sum, ap) => sum + (Number(ap.abono) || 0), 0);
  const totalVentasDirectas = ventasDelPeriodo.reduce((sum, item) => sum + (Number(item.montoTotal) || 0), 0);
  const granTotalCaja = totalVentasDirectas + totalAbonosActivos;

  let countTacos = 0;
  let countPrendasGlobal = 0;

  combinedHistory.forEach(s => {
    countPrendasGlobal += getCantidadPrendasItem(s);

    if (s.productos && s.productos.length > 0) {
      s.productos.forEach(p => {
        const nombreAAnalizar = (p.nombre || p.productoNombre || p.descripcionManual || p.busqueda || '').toLowerCase();
        const tipoAAnalizar = (p.type || p.version || '').toLowerCase();
        const tallaAAnalizar = (p.talla || p.tallaVendida || '').toLowerCase();

        if (tipoAAnalizar.includes('tacos') || nombreAAnalizar.includes('tacos') || tallaAAnalizar.includes('us')) {
          countTacos += (Number(p.cantidad || p.quantity) || 1);
        }
      });
    } else if (!s.isApartado) {
      if ((s.productoNombre || '').toLowerCase().includes('tacos')) {
        countTacos += (Number(s.cantidad) || 1);
      }
    }
  });

  const countChemas = Math.max(0, countPrendasGlobal - countTacos);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      <div className="flex-grow pt-40 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase cursor-pointer"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* 📅 SELECTOR DE MES AUTOMÁTICO */}
            <div className="flex items-center gap-2 bg-black border border-gray-700 px-3 py-2 rounded-xl">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Mes:</span>
              <input
                type="month"
                value={selectedMonth === 'ALL' ? '' : selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthCR())}
                className="bg-transparent text-[#D4AF37] font-black text-xs outline-none cursor-pointer"
              />
              <button
                onClick={() => setSelectedMonth(selectedMonth === 'ALL' ? getCurrentMonthCR() : 'ALL')}
                className={`text-[10px] px-2 py-1 rounded font-black uppercase transition cursor-pointer ${
                  selectedMonth === 'ALL' ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800 text-gray-400 hover:text-white'
                }`}
                title="Ver todos los meses o solo el mes actual"
              >
                {selectedMonth === 'ALL' ? 'Viendo Todo' : 'Ver Todo'}
              </button>
            </div>

            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
              >
                <FaRedo size={12} /> Vaciar BD
              </button>
            )}

            <button 
              onClick={exportDailyPDF}
              className="px-4 py-3 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
            >
              <FaFilePdf size={14} /> PDF Diario 
            </button>

            <button 
              onClick={exportMonthlyPDF}
              className="px-4 py-3 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
            >
              <FaFilePdf size={14} /> PDF Mensual 
            </button>
          </div>
        </div>

        <div className="border-b border-gray-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-[#D4AF37] flex items-center gap-3 tracking-tighter">
              <FaCalendarAlt /> Historial y Reportes de Caja
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Mostrando corte automático del periodo: <strong className="text-white uppercase">{selectedMonth === 'ALL' ? 'Todos los meses' : selectedMonth}</strong> (Se reinicia automáticamente el 1° de cada mes).
            </p>
          </div>
        </div>

        {/* 🏆 ENCABEZADO DE TARJETAS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaCashRegister className="text-gray-400"/> Movimientos
            </span>
            <span className="text-2xl font-black text-white">{combinedHistory.length} <span className="text-xs font-normal text-gray-500">reg.</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTshirt className="text-[#D4AF37]"/> Chemas
            </span>
            <span className="text-2xl font-black text-[#D4AF37]">{countChemas} <span className="text-xs font-normal text-gray-500">unds</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <span className="text-gray-300">👟</span> Tacos
            </span>
            <span className="text-2xl font-black text-gray-300">{countTacos} <span className="text-xs font-normal text-gray-500">prs</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTruck className="text-blue-400"/> Envíos
            </span>
            <span className="text-2xl font-black text-blue-400">₡{totalDineroEnvios.toLocaleString()}</span>
          </div>

          <div className="bg-[#111] border border-green-500/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.1)] col-span-2 md:col-span-1">
            <span className="text-[10px] text-green-400 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaMoneyBillWave /> Total Caja
            </span>
            <span className="text-2xl md:text-3xl font-black text-green-500">₡{granTotalCaja.toLocaleString()}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Cargando registros...
          </div>
        ) : combinedHistory.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800 text-gray-500 text-sm font-bold uppercase">
            No se encontraron ingresos registrados en este mes ({selectedMonth}).
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111] border-b border-gray-800 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Fecha / Vendedor</th>
                    <th className="p-4">Cliente / Cédula / Tel</th>
                    <th className="p-4">Dirección</th>
                    <th className="p-4">Detalle Prendas</th>
                    <th className="p-4 text-center">Cant.</th>
                    <th className="p-4 text-right">Prendas</th>
                    <th className="p-4 text-right">Envío</th>
                    <th className="p-4 text-right">Total (Caja)</th>
                    <th className="p-4 text-center">Acción</th> 
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {combinedHistory.map((item) => {
                    const itemId = item._id || item.id;
                    const isApartado = item.isApartado;
                    const isWebSale = (item.vendedor || '').toLowerCase().includes('web');
                    const dateString = item.fecha || item.fechaCreacion || item.createdAt;
                    const cantPrendas = getCantidadPrendasItem(item);

                    return (
                      <tr key={itemId} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4">
                          <span className="font-bold text-white block">
                            {dateString ? new Date(dateString).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' }) : 'N/A'}
                          </span>
                          <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest flex items-center gap-1">
                            {isWebSale && <FaGlobe size={10} className="text-blue-400" />}
                            {item.vendedor}
                          </span>
                          {isApartado && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 mt-1 inline-block font-black uppercase tracking-wider">
                              APARTADO
                            </span>
                          )}
                        </td>
                        <td className="p-4 min-w-[140px]">
                          <span className="font-bold text-gray-200 block uppercase">{item.nombre || item.cliente}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {item.cedula} | Tel: {item.numero || item.telefono}</span>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-start gap-1">
                            {item.direccionEnvio ? <FaMapMarkerAlt className="text-gray-500 mt-0.5 flex-shrink-0" size={10} /> : null}
                            <span className="text-[10px] text-gray-400 block max-w-[140px] truncate" title={item.direccionEnvio || 'No requiere'}>
                              {item.direccionEnvio || 'No requiere'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 max-w-[240px]">
                          <span className="font-black text-white uppercase block leading-snug">
                            {getResumenPrendas(item)}
                          </span>
                        </td>
                        <td className="p-4 text-center font-black text-white text-sm">
                          {cantPrendas}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-300">
                          ₡{(isApartado ? item.precioTotal : item.totalPago)?.toLocaleString()}
                          {isApartado && <span className="block text-[9px] text-gray-500 font-normal">Valor Total</span>}
                        </td>
                        <td className="p-4 text-right font-bold text-blue-400">
                          {isApartado ? 'N/A' : `₡${(item.costoEnvio || 0).toLocaleString()}`}
                        </td>
                        <td className="p-4 text-right font-black text-green-500 text-sm">
                          ₡{(isApartado ? item.abono : item.montoTotal)?.toLocaleString()}
                          {isApartado && <span className="block text-[9px] text-green-400/70 font-black uppercase tracking-wider">Abono</span>}
                        </td>
                        
                        <td className="p-4 text-center">
                          {isApartado ? (
                            <span className="text-[9px] text-gray-500 font-bold uppercase cursor-default block" title="Los apartados se gestionan en el Tablero de Apartados">En Tablero</span>
                          ) : deletingId === itemId ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleDeleteSale(itemId)}
                                className="px-2 py-1 bg-red-600 text-white font-bold rounded text-[10px] hover:bg-red-700 cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-gray-700 text-white font-bold rounded text-[10px] hover:bg-gray-600 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(itemId)}
                              className="p-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition cursor-pointer"
                              title="Eliminar venta"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <FaExclamationTriangle size={24} />
            </div>

            <h3 className="font-black uppercase text-base tracking-tight mb-2">¿Vaciar Base de Datos?</h3>
            <p className="text-xs text-gray-600 font-medium mb-6 px-2">
              El sistema ya separa las ventas por mes automáticamente. Usar este botón borrará <strong className="text-red-600">permanentemente todo el historial</strong> de la base de datos. ¿Estás seguro?
            </p>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowResetModal(false)} 
                className="w-1/2 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={resetting}
                onClick={confirmResetMonthlySales} 
                className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
              >
                {resetting ? 'Vaciando...' : 'SÍ, BORRAR TODO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}