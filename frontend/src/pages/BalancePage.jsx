import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaChartLine, FaPlus, FaTimes, FaTrash, 
  FaCalendarAlt, FaFilePdf, FaMoneyBillWave, FaTshirt, FaFileInvoiceDollar, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = "https://fut-store.onrender.com";

export default function BalancePage({ user }) {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [apartadosActivos, setApartadosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro de mes (Por defecto mes actual YYYY-MM)
  const mesActual = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(mesActual);

  // Estado del modal de gastos
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    categoria: 'Publicidad',
    descripcion: '',
    monto: ''
  });

  // Estado del modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const displayName = user?.firstName || user?.username || 'Admin';

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSales, resExpenses, resApartados] = await Promise.all([
        fetch(`${API_BASE}/api/sales`),
        fetch(`${API_BASE}/api/expenses`),
        fetch(`${API_BASE}/api/apartados`)
      ]);

      const dataSales = resSales.ok ? await resSales.json() : [];
      const dataExpenses = resExpenses.ok ? await resExpenses.json() : [];
      const dataApartados = resApartados.ok ? await resApartados.json() : [];

      setSales(Array.isArray(dataSales) ? dataSales : []);
      setExpenses(Array.isArray(dataExpenses) ? dataExpenses : []);
      setApartadosActivos(Array.isArray(dataApartados) ? dataApartados : []);
    } catch (error) {
      toast.error("Error al cargar los datos financieros");
    } finally {
      setLoading(false);
    }
  };
  
// 🧮 LÓGICA DE COSTOS POR PRODUCTO
const calcularCostoItem = (prod) => {
  const tipo = (prod.type || '').toLowerCase();
  const nombre = (prod.nombre || '').toLowerCase();
  const cant = Number(prod.cantidad) || 1;

  // 1. Es Nacional? (₡15,000)
  if (tipo.includes('nacional') || nombre.includes('saprissa') || nombre.includes('alajuelense') || nombre.includes('herediano') || nombre.includes('cartagines') || nombre.includes('costa rica')) {
    return 15000 * cant;
  }
  // 2. Es Tacos? (₡20,000) 👈 ¡AQUÍ ESTÁ LA NUEVA REGLA PARA LOS TACOS!
  if (tipo.includes('tacos') || nombre.includes('tacos')) {
    return 20000 * cant;
  }
  // 3. Es Bola o Balón? (₡11,000)
  if (tipo.includes('bola') || tipo.includes('balon') || nombre.includes('bola') || nombre.includes('balon')) {
    return 11000 * cant;
  }
  // 4. Todo lo demás: Retro, Fan, Mujer, Player, Niño (₡9,000)
  return 9000 * cant;
};

// Función auxiliar para determinar la categoría en texto para el PDF
const getCategoriaCosto = (prod) => {
  const tipo = (prod.type || '').toLowerCase();
  const nombre = (prod.nombre || '').toLowerCase();
  if (tipo.includes('nacional') || nombre.includes('saprissa') || nombre.includes('alajuelense') || nombre.includes('herediano') || nombre.includes('cartagines') || nombre.includes('costa rica')) return 'nacionales';
  if (tipo.includes('tacos') || nombre.includes('tacos')) return 'tacos';
  if (tipo.includes('bola') || tipo.includes('balon') || nombre.includes('bola') || nombre.includes('balon')) return 'balones';
  return 'generales';
};

  // 🔍 FILTRADO POR MES SELECCIONADO
  const salesFiltradas = sales.filter(s => {
    if (!s.fecha) return false;
    return s.fecha.startsWith(selectedMonth);
  });

  const expensesFiltrados = expenses.filter(e => {
    if (!e.fecha) return false;
    return e.fecha.startsWith(selectedMonth);
  });

  const apartadosFiltrados = apartadosActivos.filter(ap => {
    const fechaAComparar = ap.fecha || ap.fechaCreacion;
    if (!fechaAComparar) return false;
    return fechaAComparar.startsWith(selectedMonth);
  });
  
  const totalAbonosMes = apartadosFiltrados.reduce((sum, ap) => sum + (Number(ap.abono) || 0), 0);

  // 📈 CÁLCULO DE MÉTRICAS FINANCIERAS
  const ingresoBrutoTotal = salesFiltradas.reduce((sum, s) => sum + (Number(s.montoTotal) || 0), 0) + totalAbonosMes;
  const totalEnviosCobrados = salesFiltradas.reduce((sum, s) => sum + (Number(s.costoEnvio) || 0), 0);
  
  // Costo total de mercadería vendida y desglose
  let costoTotalChemas = 0;
  
  let totalInversionNacionales = 0;
  let totalInversionTacos = 0;
  let totalInversionBalones = 0;
  let totalInversionGenerales = 0;

  salesFiltradas.forEach(sale => {
    if (sale.productos && sale.productos.length > 0) {
      sale.productos.forEach(p => {
        const costoUnitario = calcularCostoItem(p);
        const cat = getCategoriaCosto(p);

        costoTotalChemas += costoUnitario;
        if (cat === 'nacionales') totalInversionNacionales += costoUnitario;
        else if (cat === 'tacos') totalInversionTacos += costoUnitario;
        else if (cat === 'balones') totalInversionBalones += costoUnitario;
        else totalInversionGenerales += costoUnitario;
      });
    } else {
      const cant = Number(sale.cantidad) || 1;
      const costoM = 9000 * cant;
      costoTotalChemas += costoM;
      totalInversionGenerales += costoM;
    }
  });

  // Gastos Operativos Manuales
  const totalGastosManuales = expensesFiltrados.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);

  // 💰 UTILIDADES
  const utilidadBruta = ingresoBrutoTotal - costoTotalChemas - totalEnviosCobrados;
  const balanceNeto = utilidadBruta - totalGastosManuales;

  // AGREGAR GASTO MANUAL
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.descripcion || !expenseForm.monto) {
      return toast.warning("Llena la descripción y el monto");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify({
          ...expenseForm,
          monto: Number(expenseForm.monto),
          fecha: new Date().toISOString()
        })
      });

      if (res.ok) {
        toast.success("💸 Gasto registrado correctamente");
        setShowAddModal(false);
        setExpenseForm({ categoria: 'Publicidad', descripcion: '', monto: '' });
        fetchData();
      } else {
        throw new Error("Fallo al guardar");
      }
    } catch (error) {
      toast.error("Error al registrar el gasto");
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ ABRE EL MODAL DE CONFIRMACIÓN
  const confirmDeleteExpense = (id) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  // 🗑️ BORRAR GASTO MANUAL CONFIRMADO
  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${expenseToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Gasto eliminado correctamente");
        setExpenses(prev => prev.filter(e => e._id !== expenseToDelete && e.id !== expenseToDelete));
      } else {
        throw new Error("Error en el servidor");
      }
    } catch (error) {
      toast.error("No se pudo eliminar el gasto");
    } finally {
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    }
  };

  // 📄 EXPORTAR REPORTE MENSUAL EN PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ⬛ ENCABEZADO NEGRO ESTILO FUTSTORE
    doc.setFillColor(17, 17, 17); 
    doc.rect(0, 0, pageWidth, 42, 'F');

    // 🟡 LÍNEA DORADA DE ACENTO
    doc.setFillColor(212, 175, 55); 
    doc.rect(0, 42, pageWidth, 3, 'F');

    // TÍTULO Y DATOS DEL REPORTE
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FUTSTORE CR - REPORTE FINANCIERO", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(`Período: ${selectedMonth}   |   Generado por: ${displayName}`, 14, 30);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CR')}`, 14, 36);

    // 📊 SECCIÓN DE RESUMEN EJECUTIVO (TARJETAS VISUALES)
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("RESUMEN EJECUTIVO DEL MES", 14, 58);

    const drawMetricBox = (x, y, w, h, title, value, isAccent = false) => {
      doc.setFillColor(isAccent ? 240 : 248, isAccent ? 253 : 249, isAccent ? 244 : 250);
      doc.setDrawColor(isAccent ? 34 : 220, isAccent ? 197 : 220, isAccent ? 94 : 220);
      doc.roundedRect(x, y, w, h, 3, 3, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(title.toUpperCase(), x + 6, y + 8);

      doc.setFontSize(13);
      doc.setTextColor(isAccent ? 22 : 17, isAccent ? 163 : 17, isAccent ? 74 : 17);
      doc.text(`CRC ${value.toLocaleString()}`, x + 6, y + 18);
    };

    const boxW = (pageWidth - 36) / 2;
    drawMetricBox(14, 64, boxW, 24, "Ingreso Bruto Total", ingresoBrutoTotal);
    drawMetricBox(18 + boxW, 64, boxW, 24, "Costo Mercadería + Envíos", costoTotalChemas + totalEnviosCobrados);
    drawMetricBox(14, 93, boxW, 24, "Gastos Operativos", totalGastosManuales);
    drawMetricBox(18 + boxW, 93, boxW, 24, "Balance Neto (Utilidad)", balanceNeto, true);

    // DESGLOSE DETALLADO DE INVERSIÓN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text("Desglose de Inversión en Mercadería y Logística:", 14, 128);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    let lineY = 136;
    doc.text(`• Costo de Camisetas (Retro, Player, Fan, Niños): CRC ${totalInversionGenerales.toLocaleString()}`, 18, lineY);
    lineY += 7;
    doc.text(`• Costo de Zapatos / Tacos: CRC ${totalInversionTacos.toLocaleString()}`, 18, lineY);
    lineY += 7;
    doc.text(`• Costo de Ediciones Nacionales: CRC ${totalInversionNacionales.toLocaleString()}`, 18, lineY);
    lineY += 7;
    doc.text(`• Costo de Balones: CRC ${totalInversionBalones.toLocaleString()}`, 18, lineY);
    lineY += 7;
    doc.text(`• Costo de Envíos Cubiertos: CRC ${totalEnviosCobrados.toLocaleString()}`, 18, lineY);

    // 📋 TABLA DE GASTOS OPERATIVOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text("DETALLE DE GASTOS OPERATIVOS", 14, lineY + 15);

    if (expensesFiltrados.length > 0) {
      const rows = expensesFiltrados.map(exp => [
        new Date(exp.fecha).toLocaleDateString('es-CR'),
        exp.categoria.toUpperCase(),
        exp.descripcion,
        exp.registradoPor || 'Admin',
        `CRC ${Number(exp.monto).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: lineY + 20,
        head: [['FECHA', 'CATEGORÍA', 'DESCRIPCIÓN', 'REGISTRADO POR', 'MONTO']],
        body: rows,
        theme: 'grid',
        headStyles: { 
          fillColor: [17, 17, 17], 
          textColor: [212, 175, 55], 
          fontStyle: 'bold',
          fontSize: 8.5
        },
        styles: { fontSize: 8.5, cellPadding: 4 },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] }
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("No se registraron gastos operativos adicionales en este período.", 14, lineY + 25);
    }

    // PIE DE PÁGINA
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`FutStore Costa Rica - Sistema de Gestión Financiera   |   Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`Reporte_Financiero_FutStore_${selectedMonth}.pdf`);
    toast.success("📄 Reporte PDF descargado con éxito");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <div className="flex-grow pt-40 pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* ENCABEZADO Y VOLVER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#111] p-4 rounded-2xl border border-gray-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase cursor-pointer"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <div className="flex items-center gap-2 bg-black border border-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold">
              <FaCalendarAlt className="text-[#D4AF37]" />
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)} 
                className="bg-transparent text-white outline-none cursor-pointer font-mono"
              />
            </div>
            
            <button 
              onClick={exportarPDF}
              className="px-4 py-2.5 bg-white hover:bg-zinc-700 text-red-600 font-black rounded-xl transition shadow flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer border border-zinc-600"
            >
              <FaFilePdf className="text-red-500" size={14} /> Exportar PDF
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              <FaPlus size={12} /> Añadir Gasto
            </button>
          </div>
        </div>

        {/* TÍTULO */}
        <div className="border-b border-gray-800 pb-6 mb-8">
          <h1 className="text-3xl font-black italic uppercase text-[#D4AF37] flex items-center gap-3 tracking-tighter">
            <FaChartLine /> Balance General y Rendimiento
          </h1>
          
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Calculando balance financiero...
          </div>
        ) : (
          <>
            {/* 📊 TARJETAS DE MÉTRICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* 1. INGRESOS */}
              <div className="bg-[#111] p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Ingreso Bruto</span>
                  <span className="text-2xl font-black text-green-400">₡{ingresoBrutoTotal.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-3">Total cobrado en ventas + envíos</span>
              </div>

              {/* 2. COSTO MERCADERÍA + ENVÍOS */}
              <div className="bg-[#111] p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Costo Mercadería + Envíos</span>
                  <span className="text-2xl font-black text-amber-500">₡{(costoTotalChemas + totalEnviosCobrados).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 flex justify-between">
                  <span>Prendas: ₡{costoTotalChemas.toLocaleString()}</span>
                  <span>Envíos: ₡{totalEnviosCobrados.toLocaleString()}</span>
                </div>
              </div>

              {/* 3. GASTOS OPERATIVOS */}
              <div className="bg-[#111] p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Gastos Operativos</span>
                  <span className="text-2xl font-black text-red-400">₡{totalGastosManuales.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-3">Publicidad, salarios y extras</span>
              </div>

              {/* 4. BALANCE NETO */}
              <div className={`p-5 rounded-2xl border shadow-xl flex flex-col justify-between ${
                balanceNeto >= 0 
                  ? 'bg-gradient-to-br from-green-950/40 to-[#111] border-green-500/50 shadow-green-900/20' 
                  : 'bg-gradient-to-br from-red-950/40 to-[#111] border-red-500/50 shadow-red-900/20'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-[#D4AF37]">
                    Balance Neto (Utilidad)
                  </span>
                  <span className={`text-3xl font-black tracking-tight ${balanceNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₡{balanceNeto.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-3 block">
                  {balanceNeto >= 0 ? ' Ganancia limpia del mes' : ' Pérdida registrada en el mes'}
                </span>
              </div>

            </div>

            {/* 📋 SECCIÓN DE GASTOS MANUALES REGISTRADOS */}
            <div className="bg-[#111] rounded-2xl border border-gray-800 p-6 mb-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Historial de Gastos Operativos ({expensesFiltrados.length})
                  </h3>
                  <p className="text-[10px] text-gray-400">Detalle de salidas de dinero manuales registradas este mes.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl border border-red-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <FaPlus size={10} /> Añadir
                </button>
              </div>

              {expensesFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  No hay gastos manuales registrados en este mes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] uppercase text-gray-500 font-black">
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4">Registrado Por</th>
                        <th className="py-3 px-4 text-right">Monto</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 text-xs font-medium">
                      {expensesFiltrados.map(exp => {
                        const id = exp._id || exp.id;
                        return (
                          <tr key={id} className="hover:bg-black/40 transition">
                            <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                              {new Date(exp.fecha).toLocaleDateString('es-CR')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                exp.categoria === 'Publicidad' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                exp.categoria === 'Salarios' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              }`}>
                                {exp.categoria}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white">{exp.descripcion}</td>
                            <td className="py-3 px-4 text-gray-400 text-[11px]">{exp.registradoPor || 'Admin'}</td>
                            <td className="py-3 px-4 text-right font-black text-red-400">
                              -₡{Number(exp.monto).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => confirmDeleteExpense(id)}
                                className="text-gray-600 hover:text-red-500 transition p-1 cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <FaTrash size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* ⚠️ MODAL ELEGANTE PARA ELIMINAR GASTO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col p-6 relative animate-in zoom-in-95 duration-200 overflow-hidden text-center">
            
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaExclamationTriangle size={20} />
            </div>

            <h3 className="font-black uppercase text-base tracking-tight mb-1 text-gray-900">
              ¿Eliminar este gasto?
            </h3>
            
            <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
              Esta acción no se puede deshacer. El balance del mes se recalculará automáticamente.
            </p>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setExpenseToDelete(null); }}
                className="w-1/2 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executeDeleteExpense}
                className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🚀 MODAL PARA AÑADIR GASTO MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow font-black text-sm">
                  $
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-tight">Añadir Gasto Operativo</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Restará directamente al balance</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-black hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Categoría del Gasto *</label>
                <select 
                  value={expenseForm.categoria}
                  onChange={e => setExpenseForm({...expenseForm, categoria: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-xs font-bold focus:border-black outline-none bg-gray-50"
                >
                  <option value="Publicidad">Publicidad (Ads / Marketing)</option>
                  <option value="Salarios">Salarios</option>
                  <option value="Otro">Otro Gasto</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descripción / Motivo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Pauta en Instagram semana 3, Pago quincena Justin..."
                  value={expenseForm.descripcion}
                  onChange={e => setExpenseForm({...expenseForm, descripcion: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-xs font-bold focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Monto Gastado (₡) *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="Ej: 25000"
                  value={expenseForm.monto}
                  onChange={e => setExpenseForm({...expenseForm, monto: e.target.value})}
                  className="w-full border p-2.5 rounded-xl text-sm font-black text-red-600 focus:border-black outline-none bg-red-50/30"
                />
              </div>

              <div className="pt-3 border-t flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-2/3 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'REGISTRAR GASTO '}
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