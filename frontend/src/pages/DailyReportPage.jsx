
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaMoneyBillWave, FaTshirt, FaTruck, FaCashRegister, FaFilePdf, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import Footer from '../components/Footer';

const API_BASE = "https://fut-store.onrender.com";

export default function DailyReportPage({ user, onLogout }) {
  const navigate = useNavigate();
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const displayName = user?.firstName || user?.username || 'Admin';

  useEffect(() => {
    fetchAllSales();
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

  // 📄 EXPORTAR PDF DIARIO
  const exportDailyPDF = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dailySales = sales.filter(sale => sale.fecha && sale.fecha.startsWith(todayStr));

    if (dailySales.length === 0) {
      return toast.warning("No hay ventas registradas el día de hoy para exportar.");
    }

    const doc = new jsPDF('landscape');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(`FUTSTORE CR - CORTE DE CAJA DIARIO (${todayStr})`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${displayName}`, 14, 28);

    const tableData = dailySales.map((sale, index) => [
      index + 1,
      sale.fecha ? new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      sale.vendedor || 'General',
      sale.nombre || 'N/A',
      sale.cedula || 'N/A',
      sale.numero || 'N/A',
      sale.productoNombre || 'Camiseta',
      sale.tallaVendida || 'N/A',
      sale.cantidad || 1,
      `CRC ${(sale.totalPago || 0).toLocaleString()}`,
      `CRC ${(sale.costoEnvio || 0).toLocaleString()}`,
      `CRC ${(sale.montoTotal || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Hora', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Producto', 'Talla', 'Cant.', 'Chema (CRC)', 'Envio (CRC)', 'Total (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemas = dailySales.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const granTotal = dailySales.reduce((sum, item) => sum + (item.montoTotal || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Chemas Vendidas Hoy: ${totalChemas} unds`, 14, finalY);
    doc.text(`Gran Total Caja del Dia: CRC ${granTotal.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Corte_Diario_${todayStr}.pdf`);
    toast.success("📄 PDF Diario exportado correctamente");
  };

  // 📄 EXPORTAR PDF MENSUAL
  const exportMonthlyPDF = () => {
    if (!sales || sales.length === 0) {
      return toast.warning("No hay ventas registradas en el sistema para exportar.");
    }

    const doc = new jsPDF('landscape');
    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(`FUTSTORE CR - REPORTE MENSUAL DE COMISIONES (${currentMonthName})`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${displayName}`, 14, 28);

    const tableData = sales.map((sale, index) => [
      index + 1,
      sale.fecha ? new Date(sale.fecha).toLocaleDateString() : 'N/A',
      sale.vendedor || 'General',
      sale.nombre || 'N/A',
      sale.cedula || 'N/A',
      sale.numero || 'N/A',
      sale.productoNombre || 'Camiseta',
      sale.tallaVendida || 'N/A',
      sale.cantidad || 1,
      `CRC ${(sale.totalPago || 0).toLocaleString()}`,
      `CRC ${(sale.costoEnvio || 0).toLocaleString()}`,
      `CRC ${(sale.montoTotal || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Fecha', 'Vendedor', 'Cliente', 'Cedula', 'Telefono', 'Producto', 'Talla', 'Cant.', 'Chema (CRC)', 'Envio (CRC)', 'Total (CRC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [212, 175, 55], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { horizontal: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const totalChemasMes = sales.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const granTotalMes = sales.reduce((sum, item) => sum + (item.montoTotal || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Chemas Acumuladas: ${totalChemasMes} unds`, 14, finalY);
    doc.text(`Ingreso Bruto Total Mensual: CRC ${granTotalMes.toLocaleString()}`, 14, finalY + 6);

    doc.save(`Reporte_Mensual_${currentMonthName}.pdf`);
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
  const granTotalCaja = sales.reduce((sum, item) => sum + (item.montoTotal || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      

      <div className="flex-grow pt-40 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {isSuperUser && (
              <button 
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 bg-red-600/20 border border-red-600/40 hover:bg-red-600 text-red-400 hover:text-white font-black rounded-xl transition flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95"
              >
                <FaRedo size={12} /> Resetear Ventas (Mes)
              </button>
            )}

            <button 
              onClick={exportDailyPDF}
              className="px-4 py-3 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <FaFilePdf size={14} /> PDF Diario 📄
            </button>

            <button 
              onClick={exportMonthlyPDF}
              className="px-4 py-3 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <FaFilePdf size={14} /> PDF Mensual 📊
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
              <FaCashRegister className="text-gray-400"/> Transacciones
            </span>
            <span className="text-2xl font-black text-white">{sales.length} <span className="text-xs font-normal text-gray-500">ventas</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTshirt className="text-[#D4AF37]"/> Chemas Vendidas
            </span>
            <span className="text-2xl font-black text-[#D4AF37]">{totalChemas} <span className="text-xs font-normal text-gray-500">unds</span></span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block flex items-center gap-1.5 mb-1">
              <FaTruck className="text-blue-400"/> Cobrado en Envíos
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
        ) : sales.length === 0 ? (
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
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-center">Cant.</th>
                    <th className="p-4 text-right">Chemas</th>
                    <th className="p-4 text-right">Envío</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-4">
                        <span className="font-bold text-white block">
                          {sale.fecha ? new Date(sale.fecha).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{sale.vendedor}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-200 block uppercase">{sale.nombre}</span>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {sale.cedula} | Tel: {sale.numero}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-white uppercase block">{sale.productoNombre}</span>
                        <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                          Talla: {sale.tallaVendida}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-white text-sm">
                        {sale.cantidad}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-300">
                        ₡{sale.totalPago?.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-blue-400">
                        ₡{sale.costoEnvio?.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-black text-green-500 text-sm">
                        ₡{sale.montoTotal?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
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

      <Footer />
    </div>
  );
}