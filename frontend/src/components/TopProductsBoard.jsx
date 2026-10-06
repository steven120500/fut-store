import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMedal, FaTshirt, FaImage, FaCrown } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE || "https://fut-store.onrender.com";

export default function TopProductsBoard() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchTopProducts();
  }, [selectedMonth, selectedYear]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/top-products?year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setTopProducts(data);
      }
    } catch (error) {
      console.error("Error al cargar top productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    { val: 1, label: 'Enero' }, { val: 2, label: 'Febrero' }, { val: 3, label: 'Marzo' },
    { val: 4, label: 'Abril' }, { val: 5, label: 'Mayo' }, { val: 6, label: 'Junio' },
    { val: 7, label: 'Julio' }, { val: 8, label: 'Agosto' }, { val: 9, label: 'Septiembre' },
    { val: 10, label: 'Octubre' }, { val: 11, label: 'Noviembre' }, { val: 12, label: 'Diciembre' }
  ];

  // Separar el Top 3 del resto
  const top3 = topProducts.slice(0, 3);
  const resto = topProducts.slice(3);

  return (
    <div className="bg-[#111] p-4 sm:p-6 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-xl font-black italic uppercase flex items-center gap-2" style={{ color: '#D4AF37' }}>
          <FaMedal /> Ranking de Modelos
        </h2>
        <div className="flex items-center gap-3 bg-black p-2 rounded-xl border border-gray-700 w-full sm:w-auto justify-between">
          <FaCalendarAlt className="text-gray-400 ml-2" />
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="bg-black text-white text-sm font-bold outline-none cursor-pointer flex-1"
          >
            {meses.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-black text-white text-sm font-bold outline-none cursor-pointer pr-2 flex-1"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
          Calculando ranking del mes...
        </div>
      ) : topProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl text-gray-500 font-bold uppercase text-xs bg-black/50">
          No hay ventas registradas en este periodo.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 🔥 SECCIÓN PODIO REAL: ARQUITECTURA EXPERTA CON CSS GRID */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 mt-12 sm:mt-16 mb-12 items-stretch">
              {top3.map((prod, index) => {
                const isOro = index === 0;
                const isPlata = index === 1;
                const isBronce = index === 2;

                const badgeBgColor = isOro ? '#D4AF37' : isPlata ? '#9CA3AF' : '#B45309';
                const badgeTextColor = isOro || isPlata ? '#000000' : '#FFFFFF';
                const borderColor = isOro ? '#D4AF37' : isPlata ? '#9CA3AF' : '#B45309';

                let orderClass = "";
                let transformClass = "";
                
                if (isOro) {
                  orderClass = "order-1 sm:order-2 z-10"; 
                  // Sube el 1er lugar sin deformar su contenedor
                  transformClass = "sm:-translate-y-8 hover:sm:-translate-y-10"; 
                } else if (isPlata) {
                  orderClass = "order-2 sm:order-1"; 
                  transformClass = "hover:-translate-y-2";
                } else if (isBronce) {
                  orderClass = "order-3 sm:order-3"; 
                  transformClass = "hover:-translate-y-2";
                }

                return (
                  <div 
                    key={index}
                    // h-full asegura que las 3 tarjetas midan exactamente igual
                    className={`relative flex flex-col bg-[#0a0a0a] rounded-2xl p-4 border transition-transform duration-300 shadow-lg h-full ${orderClass} ${transformClass}`}
                    style={{ borderColor: borderColor, boxShadow: isOro ? '0 10px 30px rgba(212,175,55,0.15)' : 'none' }}
                  >
                    {/* Medalla */}
                    <div 
                      className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full font-black text-xl shadow-xl z-20 border-4 border-[#111]`}
                      style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                    >
                      {isOro ? <FaCrown size={20} /> : `#${index + 1}`}
                    </div>

                    {/* Contenedor de Imagen estricto (no se deforma) */}
                    <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden mt-3 mb-4 relative flex-shrink-0 border border-gray-800">
                      {prod.imagen ? (
                        <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FaImage className="text-gray-700 text-4xl" /></div>
                      )}
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] uppercase font-black bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded shadow">
                          {prod.tipo || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Contenedor de Texto y Estadísticas (flex-1 para rellenar espacio restante) */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-bold text-white uppercase text-center line-clamp-2 text-xs sm:text-[13px] mb-4">
                        {prod.nombre}
                      </h3>
                      
                      {/* 🔥 mt-auto EMPUJA ESTE BLOQUE AL FONDO, ALINEANDO LOS 3 PERFECTAMENTE */}
                      <div className="mt-auto grid grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-lg border border-gray-800">
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase font-black block mb-0.5">Vendidas</span>
                          <span className="text-white font-black text-sm flex items-center justify-center gap-1.5">
                            {prod.totalUnidadesVendidas} <FaTshirt className="text-gray-600 text-[10px]"/>
                          </span>
                        </div>
                        <div className="border-l border-gray-800">
                          <span className="text-[9px] text-gray-500 uppercase font-black block mb-0.5">Generado</span>
                          <span className="text-green-500 font-black text-sm flex items-center justify-center">
                            ₡{prod.totalDineroGenerado >= 1000000 ? (prod.totalDineroGenerado/1000000).toFixed(1) + 'M' : (prod.totalDineroGenerado/1000).toFixed(0) + 'K'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* 🔥 SECCIÓN LISTA: DEL 4TO LUGAR EN ADELANTE */}
          {resto.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center sm:text-left">Resto del Ranking</h3>
              {resto.map((prod, idx) => {
                const indexFinal = idx + 3; 
                
                return (
                  <div 
                    key={indexFinal} 
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all hover:bg-gray-900 bg-[#0a0a0a] border-gray-800"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-9 h-9 flex items-center justify-center rounded-full font-black text-sm shadow-inner bg-gray-800 text-gray-400 flex-shrink-0">
                        #{indexFinal + 1}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[8px] uppercase font-black bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                            {prod.tipo || 'N/A'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-300 uppercase text-xs truncate">{prod.nombre}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6 text-right flex-shrink-0">
                      <div className="hidden sm:block">
                        <span className="text-[9px] text-gray-600 uppercase font-black block">Generado</span>
                        <span className="text-gray-400 font-bold text-xs flex items-center gap-1 justify-end">
                          ₡{prod.totalDineroGenerado.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-600 uppercase font-black block">Vendidas</span>
                        <span className="text-white font-black text-sm flex items-center gap-1 justify-end">
                          {prod.totalUnidadesVendidas} <FaTshirt className="text-gray-600 text-[10px]"/>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}