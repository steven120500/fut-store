import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaMoneyBillWave, FaTshirt, FaTruck, FaCashRegister, FaFilePdf, FaRedo, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = "https://fut-store.onrender.com";

export default function DailyReportPage({ user, onLogout }) {
  const navigate = useNavigate();
  
  const [sales, setSales] = useState([]);
  const [apartadosActivos, setApartadosActivos] = useState([]); // ESTADO PARA LOS APARTADOS
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Estado para confirmar la eliminación de una venta específica
  const [deletingId, setDeletingId] = useState(null);

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

  // 🔄 COMBINAR Y ORDENAR VENTAS Y APARTADOS POR FECHA
  const combinedHistory = [
    ...sales.map(s => ({ ...s, isApartado: false, sortDate: new Date(s.fecha || 0).getTime() })),
    ...apartadosActivos.map(a => ({ ...a, isApartado: true, sortDate: new Date(a.fecha || a.fechaCreacion || 0).getTime() }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  // Función auxiliar para obtener el string unificado de las chemas (Sirve para Ventas y Apartados)
  const getResumenPrendas = (item) => {
    if (item.productos && item.productos.length > 0) {
      return item.productos.map(p => {
        const nombreItem = item.isApartado 
          ? (p.tipoPedido === 'stock' ? p.busqueda : p.descripcionManual) 
          : p.nombre;
        return `${p.cantidad}x ${nombreItem} (${p.talla})`;
      }).join(' + ');
    }
    return `${item.productoNombre || 'Camiseta'} (${item.tallaVendida || 'N/A'})`;
  };

  // 📄 EXPORTAR PDF DIARIO
  const exportDailyPDF = () => {
    const hoyCR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });

    const dailyCombined = combinedHistory.filter(item => {
      const dateString = item.fecha || item.fechaCreacion;
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
      const cantPrendas = item.isApartado ? item.productos.reduce((sum, p) => sum + Number(p.cantidad), 0) : (item.cantidad || 1);
      return [
        index + 1,
        item.fecha || item.fechaCreacion ? new Date(item.fecha || item.fechaCreacion).toLocaleTimeString('es-CR', { timeZone: 'America/Costa_Rica', hour: '2-digit', minute: '2-digit' }) : 'N/A',
        `${item.vendedor || 'General'} ${item.isApartado ? '(APARTADO)' : ''}`,
        item.nombre || item.cliente || 'N/A',
        item.cedula || 'N/A',
        item.numero || item.telefono || 'N/A',
        getResumenPrendas(item),
        cantPrendas,
        `CRC ${(item.isApartado ? item.precioTotal : item.totalPago || 0).toLocaleString()}`,
        item.isApartado ? 'N/A' : `CRC ${(item.costoEnvio || 0).toLocaleString()}`,
        `CRC ${(item.isApartado ? item.abono : item.montoTotal || 0).toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Hora', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Detalle Chemas', 'Cant.', 'Chemas (CRC)', 'Envio (CRC)', 'Caja / Total (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemas = dailyCombined.reduce((sum, item) => sum + (item.isApartado ? item.productos.reduce((s, p) => s + Number(p.cantidad), 0) : (item.cantidad || 1)), 0);
    const granTotal = dailyCombined.reduce((sum, item) => sum + (item.isApartado ? item.abono : item.montoTotal || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Chemas Movidas Hoy: ${totalChemas} unds`, 14, finalY);
    doc.text(`Gran Total Entrado en Caja Hoy: CRC ${granTotal.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Corte_Diario_${hoyCR}.pdf`);
    toast.success("📄 PDF Diario exportado correctamente");
  };

  // 📄 EXPORTAR PDF MENSUAL
  const exportMonthlyPDF = () => {
    if (!combinedHistory || combinedHistory.length === 0) {
      return toast.warning("No hay transacciones registradas en el sistema para exportar.");
    }

    const doc = new jsPDF('landscape');
    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(`FUTSTORE CR - REPORTE MENSUAL DE CAJA (${currentMonthName})`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${displayName}`, 14, 28);

    const tableData = combinedHistory.map((item, index) => {
      const cantPrendas = item.isApartado ? item.productos.reduce((sum, p) => sum + Number(p.cantidad), 0) : (item.cantidad || 1);
      return [
        index + 1,
        item.fecha || item.fechaCreacion ? new Date(item.fecha || item.fechaCreacion).toLocaleDateString() : 'N/A',
        `${item.vendedor || 'General'} ${item.isApartado ? '(APARTADO)' : ''}`,
        item.nombre || item.cliente || 'N/A',
        item.cedula || 'N/A',
        item.numero || item.telefono || 'N/A',
        getResumenPrendas(item),
        cantPrendas,
        `CRC ${(item.isApartado ? item.precioTotal : item.totalPago || 0).toLocaleString()}`,
        item.isApartado ? 'N/A' : `CRC ${(item.costoEnvio || 0).toLocaleString()}`,
        `CRC ${(item.isApartado ? item.abono : item.montoTotal || 0).toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Fecha', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Detalle Chemas', 'Cant.', 'Chemas (CRC)', 'Envio (CRC)', 'Caja / Total (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemasMes = combinedHistory.reduce((sum, item) => sum + (item.isApartado ? item.productos.reduce((s, p) => s + Number(p.cantidad), 0) : (item.cantidad || 1)), 0);
    const granTotalMes = combinedHistory.reduce((sum, item) => sum + (item.isApartado ? item.abono : item.montoTotal || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Chemas Movidas Acumuladas: ${totalChemasMes} unds`, 14, finalY);
    doc.text(`Ingreso Bruto Total Mensual (Caja): CRC ${granTotalMes.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Reporte_Mensual_Caja_${currentMonthName}.pdf`);
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

  const totalChemas = sales.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const totalDineroEnvios = sales.reduce((sum, item) => sum + (item.costoEnvio || 0), 0);
  
  // 👈 CÁLCULO SUMANDO LOS ABONOS AL GRAN TOTAL CAJA
  const totalAbonosActivos = apartadosActivos.reduce((sum, ap) => sum + (Number(ap.abono) || 0), 0);
  const granTotalCaja = sales.reduce((sum, item) => sum + (item.montoTotal || 0), 0) + totalAbonosActivos;

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
            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
              >
                <FaRedo size={12} /> Resetear Ventas (Mes)
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
            <p className="text-gray-400 text-xs mt-1">Auditoría general de ingresos acumulados en el sistema.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaCashRegister className="text-gray-400"/> Ventas
            </span>
            <span className="text-2xl font-black text-white">{sales.length} <span className="text-xs font-normal text-gray-500">pedidos</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTshirt className="text-[#D4AF37]"/> Chemas
            </span>
            <span className="text-2xl font-black text-[#D4AF37]">{totalChemas} <span className="text-xs font-normal text-gray-500">unds</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTruck className="text-blue-400"/> Envíos
            </span>
            <span className="text-2xl font-black text-blue-400">₡{totalDineroEnvios.toLocaleString()}</span>
          </div>

          <div className="bg-[#111] border border-green-500/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.1)] col-span-2 md:col-span-1">
            <span className="text-[10px] text-green-400 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaMoneyBillWave /> Gran Total Caja
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
            No se encontraron ingresos registrados en el sistema.
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111] border-b border-gray-800 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Fecha / Vendedor</th>
                    <th className="p-4">Cliente / Cédula / Tel</th>
                    <th className="p-4">Detalle Chemas</th>
                    <th className="p-4 text-center">Cant.</th>
                    <th className="p-4 text-right">Chemas</th>
                    <th className="p-4 text-right">Envío</th>
                    <th className="p-4 text-right">Total (Caja)</th>
                    <th className="p-4 text-center">Acción</th> 
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {combinedHistory.map((item) => {
                    const itemId = item._id || item.id;
                    const isApartado = item.isApartado;
                    const dateString = item.fecha || item.fechaCreacion;
                    const cantPrendas = isApartado ? item.productos.reduce((sum, p) => sum + Number(p.cantidad), 0) : item.cantidad;

                    return (
                      <tr key={itemId} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4">
                          <span className="font-bold text-white block">
                            {dateString ? new Date(dateString).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{item.vendedor}</span>
                          {isApartado && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 mt-1 inline-block font-black uppercase tracking-wider">
                              APARTADO
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-200 block uppercase">{item.nombre || item.cliente}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {item.cedula} | Tel: {item.numero || item.telefono}</span>
                        </td>
                        <td className="p-4 max-w-[220px]">
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
                          {isApartado ? 'N/A' : `₡${item.costoEnvio?.toLocaleString()}`}
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

            <h3 className="font-black uppercase text-base tracking-tight mb-2">¿Realizar Cierre de Mes?</h3>
            <p className="text-xs text-gray-600 font-medium mb-6 px-2">
              Esta acción borrará <strong className="text-red-600">todas las ventas y comisiones</strong> del sistema para dejar las cuentas en cero. ¿Estás completamente seguro?
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
                {resetting ? 'Vaciando...' : 'SÍ, RESETEAR '}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}