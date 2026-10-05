import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMedal, FaTshirt, FaImage } from 'react-icons/fa';

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

  return (
    <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-black italic uppercase flex items-center gap-2" style={{ color: '#D4AF37' }}>
          <FaMedal /> Ranking de Modelos
        </h2>
        <div className="flex items-center gap-3 bg-black p-2 rounded-xl border border-gray-700">
          <FaCalendarAlt className="text-gray-400 ml-2" />
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="bg-black text-white text-sm font-bold outline-none cursor-pointer"
          >
            {meses.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-black text-white text-sm font-bold outline-none cursor-pointer pr-2"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold uppercase text-xs animate-pulse">
          Calculando ranking del mes...
        </div>
      ) : topProducts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl text-gray-500 font-bold uppercase text-xs">
          No hay ventas registradas en este periodo.
        </div>
      ) : (
        <div className="space-y-3">
          {topProducts.map((prod, index) => {
            const isOro = index === 0;
            const isPlata = index === 1;
            const isBronce = index === 2;
            const isTop3 = index < 3; // Mostrar foto si está en el podio
            
            // Colores forzados para que Tailwind no los ignore
            const badgeBgColor = isOro ? '#D4AF37' : isPlata ? '#9CA3AF' : isBronce ? '#B45309' : '#1F2937';
            const badgeTextColor = isOro || isPlata ? '#000000' : '#FFFFFF';
            const borderColor = isOro ? '#D4AF37' : isPlata ? '#9CA3AF' : isBronce ? '#B45309' : '#1F2937';

            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] bg-[#0a0a0a]"
                style={{ borderColor: borderColor }}
              >
                <div className="flex items-center gap-4">
                  {/* Número */}
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full font-black text-lg shadow-inner flex-shrink-0"
                    style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                  >
                    #{index + 1}
                  </div>

                  {/* 🔥 FOTO (Solo para Top 3) */}
                  {isTop3 && (
                    <div className="hidden sm:flex w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden items-center justify-center flex-shrink-0">
                      {prod.imagen ? (
                        <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <FaImage className="text-gray-600" />
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-black bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
                        {prod.tipo || 'N/A'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white uppercase text-sm mt-0.5 line-clamp-1">{prod.nombre}</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Generado</span>
                    <span className="text-green-500 font-black text-sm flex items-center gap-1 justify-end">
                      ₡{prod.totalDineroGenerado.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Vendidas</span>
                    <span className="text-white font-black text-base flex items-center gap-1.5 justify-end">
                      {prod.totalUnidadesVendidas} <FaTshirt className="text-gray-600 text-xs"/>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}